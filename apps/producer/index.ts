import "dotenv/config";
import { client } from "@repo/db/client"
import { xAddBulk } from "@redis-stream/index";

const REGIONS = {
    INDIA: 'india-region-id',
    USA: 'usa-region-id'
};

let cycleCount = 0;
let isMainRunning = false;

async function main() {
    if (isMainRunning) {
        console.log("[PRODUCER] Already running, skipping cycle.");
        return;
    }

    isMainRunning = true;
    cycleCount++;
    const cycleId = `CYC-${Date.now().toString().slice(-6)}`;
    const timestamp = new Date().toISOString();

    console.log(`\n--- Cycle #${cycleCount} [${cycleId}] Starting at ${timestamp} ---`);

    try {
        console.log("[PRODUCER] Fetching active websites from DB...");
        const websites = await client.website.findMany({
            where: { paused: false },
            select: { url: true, id: true }
        });

        console.log(`[PRODUCER] Found ${websites.length} active websites.`);

        if (websites.length === 0) {
            console.log("[PRODUCER] No websites to check. Finishing cycle.");
            isMainRunning = false;
            return;
        }

        const websiteData = websites.map(w => ({
            url: w.url,
            id: w.id,
            sentAt: timestamp,
            cycleId
        }));

        console.log(`[PRODUCER] Pushing ${websites.length} tasks to Redis streams...`);
        console.log(`[PRODUCER] Stream Regions: India (${REGIONS.INDIA}), USA (${REGIONS.USA})`);

        // Send to both regions
        const [indiaRes, usaRes] = await Promise.all([
            xAddBulk(REGIONS.INDIA, websiteData),
            xAddBulk(REGIONS.USA, websiteData)
        ]);

        console.log(`[PRODUCER] Successfully queued to India region (${indiaRes.length} tasks)`);
        console.log(`[PRODUCER] Successfully queued to USA region (${usaRes.length} tasks)`);

    } catch (error: any) {
        console.error("[PRODUCER] CRITICAL ERROR in cycle:", error);
    } finally {
        isMainRunning = false;
        console.log(`--- Cycle #${cycleCount} Finished ---\n`);
    }
}


// Initial run
main();

// Loop
setInterval(() => {
    main();
}, 3 * 60 * 1000);