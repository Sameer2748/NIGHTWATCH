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

        return;
    }

    isMainRunning = true;
    cycleCount++;
    const cycleId = `CYC-${Date.now().toString().slice(-6)}`;
    const timestamp = new Date().toISOString();



    try {
        // ALWAYS check heartbeats (every 1 min)
        await checkHeartbeats();

        // ONLY check URLs every 3rd cycle (3 mins)
        if (cycleCount % 3 === 0) {

            const websites = await client.website.findMany({
                where: { paused: false, type: "URL" },
                select: { url: true, id: true }
            });



            if (websites.length > 0) {
                const websiteData = websites.map(w => ({
                    url: w.url,
                    id: w.id,
                    sentAt: timestamp,
                    cycleId
                }));


                // Send to both regions
                const [indiaRes, usaRes] = await Promise.all([
                    xAddBulk(REGIONS.INDIA, websiteData),
                    xAddBulk(REGIONS.USA, websiteData)
                ]);

            }
        } else {

        }

    } catch (error: any) {
        console.error("[PRODUCER] CRITICAL ERROR in cycle:", error);
    } finally {
        isMainRunning = false;

    }
}


// Initial run
main();

// Loop every 60 seconds
setInterval(() => {
    main();
}, 60 * 1000);