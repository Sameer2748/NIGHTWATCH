
import { client } from "@repo/db/client";

async function main() {
    const steps = await client.escalationStep.findMany({
        include: {
            website: true
        }
    });

    const websites = await client.website.findMany();
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await client.$disconnect();
    });
