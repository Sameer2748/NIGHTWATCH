import { client } from "@repo/db/client"
import { xAddBulk } from "@redis-stream/index";

const REGIONS = {
    INDIA: 'india-region-id',
    USA: 'usa-region-id'
};

async function main() {
    try {
        const websites = await client.website.findMany({
            select: {
                url: true,
                id: true
            }
        })
        console.log(`Sending ${websites.length} websites to both regions...`);

        const websiteData = websites.map(w => ({ url: w.url, id: w.id }));

        // Send to both regions
        const [indiaRes, usaRes] = await Promise.all([
            xAddBulk(REGIONS.INDIA, websiteData),
            xAddBulk(REGIONS.USA, websiteData)
        ]);

        console.log(`India: ${indiaRes.length} messages, USA: ${usaRes.length} messages`);
    } catch (error) {
        console.error("Producer error:", error);
    }
}

console.log("Producer starting...");
setInterval(() => {
    console.log(`[${new Date().toISOString()}] Running producer cycle...`);
    main()
}, 2 * 1000 * 60)

main()