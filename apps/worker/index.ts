import { xAckBulk, xReadGroup, initConsumerGroup } from "@redis-stream/index";
import got from "got"
import { client } from "@repo/db/client"

const regionId = process.env.REGION_ID!;
const workerId = process.env.WORKER_ID! || "worker-1";

if (!regionId || !workerId) {
    throw new Error("REGION_ID and WORKER_ID environment variables are required")
}

async function main() {
    console.log(`Worker ${workerId} started for region ${regionId}`);

    await initConsumerGroup(regionId, `consumer-group-${regionId}`);

    while (1) {
        try {
            const response = await xReadGroup(regionId, `consumer-group-${regionId}`, workerId);

            if (!response || response.length === 0) {
                await new Promise(resolve => setTimeout(resolve, 500));
                continue;
            }

            console.log(`[${regionId}] Received batch of ${response.length} messages`);

            // Skip logic: If we have multiple checks for the same website in one batch,
            // only process the latest one to catch up with the backlog.
            const latestMessages = new Map<string, { message: any, streamId: string }>();

            for (const item of response) {
                const websiteId = item.message.id;
                // Since xReadGroup returns messages in order, 
                // the last one we see for a websiteId will be the newest.
                latestMessages.set(websiteId, item);
            }

            console.log(`[${regionId}] Processing ${latestMessages.size} unique monitors (skipped ${response.length - latestMessages.size} stale checks)`);

            // Process unique websites
            for (const [websiteId, { message }] of latestMessages.entries()) {
                console.log(`[${regionId}] Checking: ${message.url}`);
                try {
                    await processWebsites(message.url, message.id);
                    console.log(`[${regionId}] Finished checking: ${message.url}`);
                } catch (e) {
                    console.error(`[${regionId}] Error processing website ${message.url}:`, e);
                }
            }

            // Acknowledge ALL messages in the batch (including skipped ones)
            const allStreamIds = response.map(item => item.id);
            await xAckBulk(regionId, `consumer-group-${regionId}`, allStreamIds);

            console.log(`[${regionId}] Successfully acknowledged batch of ${response.length}`);
        } catch (error) {
            console.error(`[${regionId}] Worker error in main loop:`, error);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}

const processWebsites = async (url: string, websiteId: string) => {
    try {
        const response = await got(url, {
            timeout: { request: 10000 },
            followRedirect: true,
            https: { rejectUnauthorized: false },
            retry: { limit: 0 } // Don't retry inside the worker to avoid blocking
        });

        const timings = response.timings;
        const phases = timings.phases;

        const dnsTime = Math.round(phases.dns || 0);
        const tcpTime = Math.round(phases.tcp || 0);
        const tlsTime = Math.round(phases.tls || 0);
        const ttfb = Math.round(phases.firstByte || 0);
        const downloadTime = Math.round(phases.download || 0);
        const totalTime = Math.round(timings.phases.total || 0);

        await client.websiteTick.create({
            data: {
                response_time_ms: totalTime,
                dns_time_ms: dnsTime,
                tcp_time_ms: tcpTime,
                tls_time_ms: tlsTime,
                ttfb_ms: ttfb,
                download_time_ms: downloadTime,
                status: "Up",
                region_id: regionId,
                website_id: websiteId,
            }
        });

        const ongoingIncident = await client.incident.findFirst({
            where: {
                website_id: websiteId,
                region_id: regionId,
                status: "ONGOING"
            }
        });

        if (ongoingIncident) {
            const duration = Math.floor((Date.now() - new Date(ongoingIncident.startedAt).getTime()) / 1000);
            await client.incident.update({
                where: { id: ongoingIncident.id },
                data: {
                    status: "RESOLVED",
                    resolvedAt: new Date(),
                    duration
                }
            });
            console.log(`[${regionId}] Incident resolved for ${url} (${duration}s downtime)`);
        }
    } catch (error: any) {
        console.log(`[${regionId}] Monitor DOWN: ${url} - Error: ${error.message}`);

        await client.websiteTick.create({
            data: {
                response_time_ms: 0,
                status: "Down",
                region_id: regionId,
                website_id: websiteId,
            }
        });

        const existingIncident = await client.incident.findFirst({
            where: {
                website_id: websiteId,
                region_id: regionId,
                status: "ONGOING"
            }
        });

        if (!existingIncident) {
            await client.incident.create({
                data: {
                    website_id: websiteId,
                    region_id: regionId,
                    status: "ONGOING"
                }
            });
            console.log(`[${regionId}] New incident created for ${url}`);
        }
    }
}

main();
