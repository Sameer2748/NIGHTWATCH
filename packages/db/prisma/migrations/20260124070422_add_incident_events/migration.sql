-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "IncidentEvent" (
    "id" TEXT NOT NULL,
    "incident_id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "status" "EventStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncidentEvent_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "IncidentEvent" ADD CONSTRAINT "IncidentEvent_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "Incident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
