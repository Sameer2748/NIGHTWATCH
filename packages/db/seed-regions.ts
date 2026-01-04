import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    // Create India region
    const india = await prisma.region.upsert({
        where: { id: 'india-region-id' },
        update: {},
        create: {
            id: 'india-region-id',
            name: 'India'
        }
    })

    // Create USA region
    const usa = await prisma.region.upsert({
        where: { id: 'usa-region-id' },
        update: {},
        create: {
            id: 'usa-region-id',
            name: 'USA'
        }
    })

    console.log('Regions created:', { india, usa })
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
