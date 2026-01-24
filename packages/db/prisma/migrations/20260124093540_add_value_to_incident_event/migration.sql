/*
  Warnings:

  - Added the required column `value` to the `IncidentEvent` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "IncidentEvent" ADD COLUMN     "value" TEXT NOT NULL;
