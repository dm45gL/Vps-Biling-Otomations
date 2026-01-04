/*
  Warnings:

  - You are about to drop the column `externalId` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `promoId` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `orderId` on the `PromoUsage` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "PromoUsage" DROP CONSTRAINT "PromoUsage_orderId_fkey";

-- DropIndex
DROP INDEX "Order_externalId_key";

-- DropIndex
DROP INDEX "PromoUsage_orderId_key";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "externalId",
DROP COLUMN "promoId";

-- AlterTable
ALTER TABLE "PromoUsage" DROP COLUMN "orderId";
