
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const ticks = await prisma.websiteTick.findMany({
        orderBy: { createdAt: "desc" },
        take: 5
    });
    console.log("Recent Ticks:", ticks);
}

main()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
