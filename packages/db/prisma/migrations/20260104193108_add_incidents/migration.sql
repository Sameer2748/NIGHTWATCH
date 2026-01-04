-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('ONGOING', 'RESOLVED');

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "website_id" TEXT NOT NULL,
    "region_id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "status" "IncidentStatus" NOT NULL DEFAULT 'ONGOING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_website_id_fkey" FOREIGN KEY ("website_id") REFERENCES "Website"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
