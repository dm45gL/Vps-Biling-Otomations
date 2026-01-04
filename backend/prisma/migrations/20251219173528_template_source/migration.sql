/*
  Warnings:

  - You are about to drop the column `groupId` on the `Template` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Template` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Template` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "TemplateStatus" AS ENUM ('READY', 'SYNCING', 'ERROR');

-- DropForeignKey
ALTER TABLE "Template" DROP CONSTRAINT "Template_groupId_fkey";

-- AlterTable
ALTER TABLE "Template" DROP COLUMN "groupId",
DROP COLUMN "name",
DROP COLUMN "type",
ADD COLUMN     "sourceId" TEXT,
ADD COLUMN     "status" "TemplateStatus" NOT NULL DEFAULT 'READY',
ADD COLUMN     "syncedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "TemplateSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "os" TEXT NOT NULL,
    "type" "TemplateType" NOT NULL,
    "masterHypervisorId" TEXT NOT NULL,
    "masterNode" TEXT NOT NULL,
    "masterVmid" INTEGER NOT NULL,
    "categoryId" TEXT,
    "groupId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TemplateSource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TemplateSource_masterHypervisorId_masterNode_masterVmid_key" ON "TemplateSource"("masterHypervisorId", "masterNode", "masterVmid");

-- AddForeignKey
ALTER TABLE "Template" ADD CONSTRAINT "Template_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "TemplateSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateSource" ADD CONSTRAINT "TemplateSource_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "TemplateCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateSource" ADD CONSTRAINT "TemplateSource_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "TemplateGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
