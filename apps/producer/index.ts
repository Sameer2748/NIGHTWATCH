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
        return;
    }

    isMainRunning = true;
    cycleCount++;
    const cycleId = `CYC-${Date.now().toString().slice(-6)}`;
    const timestamp = new Date().toISOString();

    try {

        const websites = await client.website.findMany({
            where: { paused: false },
            select: { url: true, id: true }
        });


        if (websites.length === 0) {
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
        const [indiaRes, usaRes] = await Promise.all([
            xAddBulk(REGIONS.INDIA, websiteData),
            xAddBulk(REGIONS.USA, websiteData)
        ]);

    } catch (error: any) {
    } finally {
        isMainRunning = false;
    }
}


// Initial run
main();

// Loop
setInterval(() => {
    main();
}, 3 * 60 * 1000);