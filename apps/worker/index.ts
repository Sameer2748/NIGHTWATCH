import { xAckBulk, xReadGroup, initConsumerGroup, xAddAlert } from "@redis-stream/index";
import got from "got"
import { client } from "@repo/db/client"
import type { message } from "@redis-stream/types"

const regionId = process.env.REGION_ID!;
const workerId = process.env.WORKER_ID! || "worker-1";

if (!regionId || !workerId) {
    throw new Error("REGION_ID and WORKER_ID environment variables are required")
}

async function main() {
    console.log(`[${workerId}] Worker started for region: ${regionId}`);

    try {
        await initConsumerGroup(regionId, `consumer-group-${regionId}`);
    } catch (e) {
        console.error(`[${workerId}] Initial setup failed:`, e);
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
                console.log(`[${workerId}] Processing batch: ${latestMessages.size} unique tasks.`);

                // Process each website with a STRICT per-task timeout
                const tasks = Array.from(latestMessages.values()).map(async (msg) => {
                    const taskInfo = `[${msg.message.url}] [ID: ${msg.id}]`;
                    try {
                        await withTimeout(
                            processWebsites(msg.message.url, msg.message.id),
                            45000, // 45 seconds max per website check
                            `Task for ${msg.message.url} timed out overall`
                        );
                        console.log(`[${workerId}] DONE: ${taskInfo}`);
                    } catch (e: any) {
                        console.error(`[${workerId}] FAILED: ${taskInfo} - ${e.message}`);
                    }
                });

                await Promise.all(tasks);
            }

            // Always acknowledge everything we read to move the group pointer
            await xAckBulk(regionId, `consumer-group-${regionId}`, allStreamIds);

        } catch (error: any) {
            console.error(`[${workerId}] Main Loop Fatal Error:`, error.message);
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

    // 1. HTTP CHECK
    try {
        console.log(`[${workerId}] Performing HTTP check: ${url}`);
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
            } else {
                status = "Up";
            }

        } catch (fetchError: any) {
            clearTimeout(timeoutId);
            throw fetchError;
        }

    } catch (error: any) {
        status = "Down";
        console.log(`[${workerId}] HTTP Check failed for ${url}: ${error.message}`);
    }

    // 2. DATABASE PERSISTENCE (with strict internal timeout)
    try {
        console.log(`[${workerId}] Saving result to DB: ${url}`);
        await withTimeout(
            dbWork(websiteId, status, timings),
            15000, // 15s for DB
            "Database operation timed out"
        );
    } catch (e: any) {
        console.error(`[${workerId}] DB Persist Error for ${url}: ${e.message}`);
    }
}

async function dbWork(websiteId: string, status: "Up" | "Down", timings: any) {
    const tickData: any = {
        status,
        region_id: regionId,
        website_id: websiteId,
        response_time_ms: timings ? Math.round(timings.phases.total || 0) : 0,
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
                url: website.url
            });
            console.log(`[${workerId}] Alert triggered for ${website.url} (Incident: ${newIncident.id})`);
        }
    }
}

main();
