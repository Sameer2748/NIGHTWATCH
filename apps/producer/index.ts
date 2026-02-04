import "dotenv/config";
import { client } from "@repo/db/client"
import { xAddBulk, xAddAlert, publish } from "@redis-stream/index";

const REGIONS = {
    INDIA: 'india-region-id',
    USA: 'usa-region-id'
};

let cycleCount = 0;
let isMainRunning = false;

async function processHeartbeatFailure(websiteId: string, url: string, regionId: string) {
    // Create DOWN tick
    const tick = await client.websiteTick.create({
        data: {
            status: "Down",
            region_id: regionId,
            website_id: websiteId,
            response_time_ms: 0,
            message: "Heartbeat missed"
        }
    });

    await publish(`monitor:${websiteId}:updates`, { type: 'TICK', data: tick });

    // Check for ONGOING incident
    const ongoingIncident = await client.incident.findFirst({
        where: { website_id: websiteId, region_id: regionId, status: "ONGOING" }
    });

    if (!ongoingIncident) {
        const newIncident = await client.incident.create({
            data: { website_id: websiteId, region_id: regionId, status: "ONGOING" }
        });
        await publish(`monitor:${websiteId}:updates`, { type: 'INCIDENT_CREATED', data: newIncident });

        await xAddAlert({
            websiteId,
            incidentId: newIncident.id,
            alertType: "WEBSITE_DOWN",
            url: url,
            message: "Heartbeat missed"
        });
    }
}

async function checkHeartbeats() {
    try {

        const heartbeats = await client.website.findMany({
            where: {
                type: "HEARTBEAT",
                paused: false
            }
        });

        const now = new Date();
        const regionId = REGIONS.INDIA; // Default handler region

        for (const monitor of heartbeats) {
            const lastHeartbeat = monitor.last_heartbeat || monitor.timeAdded;
            // Expected time = last seen + period + grace_period
            // period and grace_period are in seconds
            const expirationTime = new Date(lastHeartbeat.getTime() + (monitor.period * 1000) + (monitor.grace_period * 1000));

            if (now > expirationTime) {
                // Heartbeat is late. Use a threshold to avoid spamming DOWN ticks every minute if incident is already open?
                // Actually, creating a DOWN tick every minute is fine, it maps to the graph "red" area.
                // However, optimization: if incident is already ongoing, maybe we don't need to check too hard?
                // But we need the ticks for the graph.
                await processHeartbeatFailure(monitor.id, monitor.url, regionId);
            }
        }
    } catch (error) {
        console.error("[PRODUCER] Error checking heartbeats:", error);
    }
}

async function main() {
    if (isMainRunning) {
        console.log('[PRODUCER] Skipping cycle - previous cycle still running');
        return;
    }

    isMainRunning = true;
    cycleCount++;
    const cycleId = `CYC-${Date.now().toString().slice(-6)}`;
    const timestamp = new Date().toISOString();

    console.log(`[PRODUCER] Starting cycle #${cycleCount} at ${timestamp}`);

    try {
        // ALWAYS check heartbeats (every 1 min)
        await checkHeartbeats();
        console.log('[PRODUCER] Heartbeat check completed');

        // ONLY check URLs every 3rd cycle (3 mins)
        if (cycleCount % 3 === 0) {
            console.log('[PRODUCER] URL check cycle - fetching websites...');

            const websites = await client.website.findMany({
                where: { paused: false, type: "URL" },
                select: { url: true, id: true }
            });

            console.log(`[PRODUCER] Found ${websites.length} URL monitors to check`);

            if (websites.length > 0) {
                const websiteData = websites.map(w => ({
                    url: w.url,
                    id: w.id,
                    sentAt: timestamp,
                    cycleId
                }));


                // Send to primary region (India)
                await xAddBulk(REGIONS.INDIA, websiteData);
                console.log(`[PRODUCER] Dispatched ${websites.length} websites to India region`);

                // Send to USA region
                await xAddBulk(REGIONS.USA, websiteData);
                console.log(`[PRODUCER] Dispatched ${websites.length} websites to USA region`);

            }
        } else {
            console.log(`[PRODUCER] Skipping URL check (cycle ${cycleCount} % 3 = ${cycleCount % 3})`);
        }

    } catch (error: any) {
        console.error("[PRODUCER] CRITICAL ERROR in cycle:", error);
    } finally {
        isMainRunning = false;
        console.log(`[PRODUCER] Cycle #${cycleCount} completed\n`);
    }
}


// Initial run
main();

// Loop every 60 seconds
setInterval(() => {
    main();
}, 60 * 1000);