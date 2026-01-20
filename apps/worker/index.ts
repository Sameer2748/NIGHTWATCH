import { xAckBulk, xReadGroup, initConsumerGroup, xAddAlert } from "@redis-stream/index";
import got from "got"
import { client } from "@repo/db/client"
import type { message } from "@redis-stream/types"
import { checkNightwatchHealth, alertMasterOnStateChange } from "./healthCheck";

const regionId = process.env.REGION_ID!;
const workerId = process.env.WORKER_ID! || "worker-1";

if (!regionId || !workerId) {
    throw new Error("REGION_ID and WORKER_ID environment variables are required")
}

async function main() {

    try {
        await initConsumerGroup(regionId, `consumer-group-${regionId}`);
    } catch (e) {
        process.exit(1);
    }

    while (true) {
        try {
            // Read with a short block to keep the loop responsive
            const response = await xReadGroup(regionId, `consumer-group-${regionId}`, workerId) as message[];

            if (!response || response.length === 0) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                continue;
            }

            const now = Date.now();
            const staleThresholdMs = 15 * 60 * 1000; // 15 mins

            const latestMessages = new Map<string, message>();
            const allStreamIds = response.map(item => item.id);

            for (const item of response) {
                const websiteId = item.message.id;
                const sentAtTime = item.message.sentAt ? new Date(item.message.sentAt).getTime() : now;

                if (now - sentAtTime > staleThresholdMs) {
                    // Even if stale, we skip but we still identify it to be acked below
                    continue;
                }
                latestMessages.set(websiteId, item);
            }

            if (latestMessages.size > 0) {

                // HEALTH CHECK: Check Nightwatch network health ONCE per batch
                const isNightwatchHealthy = await checkNightwatchHealth();
                await alertMasterOnStateChange(workerId, regionId, isNightwatchHealthy);

                if (!isNightwatchHealthy) {
                    // Nightwatch network is down - skip this entire batch
                    // Still acknowledge messages to prevent reprocessing
                    await xAckBulk(regionId, `consumer-group-${regionId}`, allStreamIds);
                    continue;
                }

                // Process each website with a STRICT per-task timeout
                const tasks = Array.from(latestMessages.values()).map(async (msg) => {
                    const taskInfo = `[${msg.message.url}] [ID: ${msg.id}]`;
                    try {
                        await withTimeout(
                            processWebsites(msg.message.url, msg.message.id),
                            45000, // 45 seconds max per website check
                            `Task for ${msg.message.url} timed out overall`
                        );
                    } catch (e: any) {
                    }
                });

                await Promise.all(tasks);
            }

            // Always acknowledge everything we read to move the group pointer
            await xAckBulk(regionId, `consumer-group-${regionId}`, allStreamIds);

        } catch (error: any) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            // In a cluster, we exit and let the manager restart us
            process.exit(1);
        }
    }
}

async function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
    let timeoutId: any;
    const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(message)), ms);
    });
    return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
}

const processWebsites = async (url: string, websiteId: string) => {
    let status: "Up" | "Down" = "Up";
    let timings: any = null;
    let message: string | undefined = undefined;

    // 1. HTTP CHECK
    try {

        // Fetch website config to see if keyword check is needed
        const websiteConfig = await client.website.findUnique({
            where: { id: websiteId },
            select: { keywordCheck: true }
        });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s strict timeout

        try {
            const start = performance.now();
            const response = await fetch(url, {
                signal: controller.signal,
                redirect: 'follow',
            });
            clearTimeout(timeoutId);

            const end = performance.now();
            const duration = Math.round(end - start);

            timings = {
                phases: {
                    total: duration,
                    dns: 0, tcp: 0, tls: 0, firstByte: 0, download: duration
                }
            };

            if (!response.ok && response.status >= 400) {
                status = "Down";
                message = `HTTP Status ${response.status}: ${response.statusText}`;
            } else {
                status = "Up";

                // Keyword Assertion Check
                if (websiteConfig?.keywordCheck && websiteConfig.keywordCheck.trim() !== "") {
                    const bodyText = await response.text();
                    if (!bodyText.includes(websiteConfig.keywordCheck)) {
                        status = "Down";
                        message = `Keyword Check Failed: Expected "${websiteConfig.keywordCheck}"`;
                    }
                }
            }

        } catch (fetchError: any) {
            clearTimeout(timeoutId);
            throw fetchError;
        }

    } catch (error: any) {
        // Website is down (we already checked Nightwatch health at batch level)
        status = "Down";
        message = `Network Error: ${error.message}`;
    }

    // 2. DATABASE PERSISTENCE (with strict internal timeout)
    try {
        await withTimeout(
            dbWork(websiteId, status, timings, message),
            15000, // 15s for DB
            "Database operation timed out"
        );
    } catch (e: any) {
    }
}

async function dbWork(websiteId: string, status: "Up" | "Down", timings: any, message?: string) {
    const tickData: any = {
        status,
        region_id: regionId,
        website_id: websiteId,
        response_time_ms: timings ? Math.round(timings.phases.total || 0) : 0,
        message: message || null
    };

    if (timings) {
        tickData.dns_time_ms = Math.round(timings.phases.dns || 0);
        tickData.tcp_time_ms = Math.round(timings.phases.tcp || 0);
        tickData.tls_time_ms = Math.round(timings.phases.tls || 0);
        tickData.ttfb_ms = Math.round(timings.phases.firstByte || 0);
        tickData.download_time_ms = Math.round(timings.phases.download || 0);
    }

    // Tick creation
    await client.websiteTick.create({ data: tickData });

    // Incident management
    const ongoingIncident = await client.incident.findFirst({
        where: { website_id: websiteId, region_id: regionId, status: "ONGOING" }
    });

    if (status === "Up" && ongoingIncident) {
        const duration = Math.floor((Date.now() - new Date(ongoingIncident.startedAt).getTime()) / 1000);
        await client.incident.update({
            where: { id: ongoingIncident.id },
            data: { status: "RESOLVED", resolvedAt: new Date(), duration }
        });
    } else if (status === "Down" && !ongoingIncident) {
        const newIncident = await client.incident.create({
            data: { website_id: websiteId, region_id: regionId, status: "ONGOING" }
        });

        // Trigger Alert System
        const website = await client.website.findUnique({ where: { id: websiteId } });
        if (website) {
            await xAddAlert({
                websiteId,
                incidentId: newIncident.id,
                alertType: "WEBSITE_DOWN",
                url: website.url,
                message: message || "Unknown Error"
            });
        }
    }
}

main();
