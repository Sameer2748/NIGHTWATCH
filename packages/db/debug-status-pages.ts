import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
    try {
        const pages = await prisma.statusPage.findMany();
        console.log("Existing Status Pages:", JSON.stringify(pages, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
