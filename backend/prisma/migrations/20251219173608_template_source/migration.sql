/*
  Warnings:

  - Made the column `sourceId` on table `Template` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Template" DROP CONSTRAINT "Template_sourceId_fkey";

-- AlterTable
ALTER TABLE "Template" ALTER COLUMN "sourceId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Template" ADD CONSTRAINT "Template_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "TemplateSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
