-- CreateEnum
CREATE TYPE "MonitorType" AS ENUM ('URL', 'HEARTBEAT');

-- AlterTable
ALTER TABLE "Website" ADD COLUMN     "grace_period" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "last_heartbeat" TIMESTAMP(3),
ADD COLUMN     "period" INTEGER NOT NULL DEFAULT 180,
ADD COLUMN     "type" "MonitorType" NOT NULL DEFAULT 'URL';
