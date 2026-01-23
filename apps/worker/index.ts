import "dotenv/config";
import { xAckBulk, xReadGroup, initConsumerGroup, xAddAlert, publish } from "@redis-stream/index";
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
            const response = await xReadGroup(regionId, `consumer-group-${regionId}`, workerId) as message[];

            if (!response || response.length === 0) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                continue;
            }

            const now = Date.now();
            const staleThresholdMs = 15 * 60 * 1000;

            const latestMessages = new Map<string, message>();
            const allStreamIds = response.map(item => item.id);

            for (const item of response) {
                const websiteId = item.message.id;
                const sentAtTime = item.message.sentAt ? new Date(item.message.sentAt).getTime() : now;

                if (now - sentAtTime > staleThresholdMs) {
                    continue;
                }
                latestMessages.set(websiteId, item);
            }

            if (latestMessages.size > 0) {
                const isNightwatchHealthy = await checkNightwatchHealth();
                await alertMasterOnStateChange(workerId, regionId, isNightwatchHealthy);

                if (!isNightwatchHealthy) {
                    await xAckBulk(regionId, `consumer-group-${regionId}`, allStreamIds);
                    continue;
                }

                const tasks = Array.from(latestMessages.values()).map(async (msg) => {
                    try {
                        await withTimeout(
                            processWebsites(msg.message.url, msg.message.id),
                            45000,
                            `Task for ${msg.message.url} timed out overall`
                        );
                    } catch (e: any) {
                    }
                });

                await Promise.all(tasks);
            }

            await xAckBulk(regionId, `consumer-group-${regionId}`, allStreamIds);

        } catch (error: any) {
            await new Promise(resolve => setTimeout(resolve, 5000));
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

    try {
        const websiteConfig = await client.website.findUnique({
            where: { id: websiteId },
            select: { keywordCheck: true }
        });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

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
        status = "Down";
        message = `Network Error: ${error.message}`;
    }

    try {
        await withTimeout(
            dbWork(websiteId, status, timings, message),
            15000,
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

    const tick = await client.websiteTick.create({ data: tickData });

    // Real-time broadcast for tick
    await publish(`monitor:${websiteId}:updates`, { type: 'TICK', data: tick });

    const ongoingIncident = await client.incident.findFirst({
        where: { website_id: websiteId, region_id: regionId, status: "ONGOING" }
    });

    if (status === "Up" && ongoingIncident) {
        const duration = Math.floor((Date.now() - new Date(ongoingIncident.startedAt).getTime()) / 1000);
        const resolved = await client.incident.update({
            where: { id: ongoingIncident.id },
            data: { status: "RESOLVED", resolvedAt: new Date(), duration }
        });
        await publish(`monitor:${websiteId}:updates`, { type: 'INCIDENT_RESOLVED', data: resolved });
    } else if (status === "Down" && !ongoingIncident) {
        const newIncident = await client.incident.create({
            data: { website_id: websiteId, region_id: regionId, status: "ONGOING" }
        });
        await publish(`monitor:${websiteId}:updates`, { type: 'INCIDENT_CREATED', data: newIncident });

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
