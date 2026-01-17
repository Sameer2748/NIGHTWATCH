
import { client } from "@repo/db/client";

async function main() {
    const steps = await client.escalationStep.findMany({
        include: {
            website: true
        }
    });
    console.log("Escalation Steps:", JSON.stringify(steps, null, 2));

    const websites = await client.website.findMany();
    console.log("Websites:", JSON.stringify(websites, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await client.$disconnect();
    });
