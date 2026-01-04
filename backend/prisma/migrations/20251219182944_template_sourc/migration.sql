/*
  Warnings:

  - Added the required column `name` to the `Template` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Template` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Template" ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL;
