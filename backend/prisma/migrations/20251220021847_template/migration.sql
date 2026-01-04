/*
  Warnings:

  - You are about to drop the column `sourceId` on the `Template` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Template` table. All the data in the column will be lost.
  - You are about to drop the column `syncedAt` on the `Template` table. All the data in the column will be lost.
  - You are about to drop the `TemplateSource` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Template" DROP CONSTRAINT "Template_sourceId_fkey";

-- DropForeignKey
ALTER TABLE "TemplateSource" DROP CONSTRAINT "TemplateSource_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "TemplateSource" DROP CONSTRAINT "TemplateSource_groupId_fkey";

-- AlterTable
ALTER TABLE "Template" DROP COLUMN "sourceId",
DROP COLUMN "status",
DROP COLUMN "syncedAt",
ADD COLUMN     "groupId" TEXT;

-- DropTable
DROP TABLE "TemplateSource";

-- DropEnum
DROP TYPE "TemplateStatus";

-- AddForeignKey
ALTER TABLE "Template" ADD CONSTRAINT "Template_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "TemplateGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
