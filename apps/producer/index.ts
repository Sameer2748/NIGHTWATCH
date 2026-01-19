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
        console.log(`[${new Date().toISOString()}] skipping cycle - previous main() still running`);
        return;
    }

    isMainRunning = true;
    cycleCount++;
    const cycleId = `CYC-${Date.now().toString().slice(-6)}`;
    const timestamp = new Date().toISOString();

    try {
        console.log(`[${timestamp}] [${cycleId}] Producer: Cycle #${cycleCount} starting...`);

        const websites = await client.website.findMany({
            where: { paused: false },
            select: { url: true, id: true }
        });

        console.log(`[${timestamp}] [${cycleId}] Producer: Found ${websites.length} websites.`);

        if (websites.length === 0) {
            console.log(`[${timestamp}] [${cycleId}] Producer: No websites to check.`);
            isMainRunning = false;
            return;
        }

        const websiteData = websites.map(w => ({
            url: w.url,
            id: w.id,
            sentAt: timestamp,
            cycleId
        }));

        // Send to both regions
        console.log(`[${timestamp}] [${cycleId}] Producer: Sending to Redis streams...`);
        const [indiaRes, usaRes] = await Promise.all([
            xAddBulk(REGIONS.INDIA, websiteData),
            xAddBulk(REGIONS.USA, websiteData)
        ]);

        console.log(`[${timestamp}] [${cycleId}] Producer: Successfully queued ${websites.length} tasks (India: ${indiaRes.length}, USA: ${usaRes.length}).`);
    } catch (error: any) {
        console.error(`[${new Date().toISOString()}] [${cycleId}] Producer ERROR:`, error.stack || error.message);
    } finally {
        isMainRunning = false;
    }
}

console.log("BetterStack Producer Service Starting...");
console.log("Interval: 3 Minutes");

// Initial run
main();

// Loop
setInterval(() => {
    main();
}, 3 * 60 * 1000);