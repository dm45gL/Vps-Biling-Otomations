/*
  Warnings:

  - A unique constraint covering the columns `[orderId]` on the table `PromoUsage` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `orderId` to the `PromoUsage` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "promoId" TEXT;

-- AlterTable
ALTER TABLE "PromoUsage" ADD COLUMN     "orderId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "PromoUsage_orderId_key" ON "PromoUsage"("orderId");

-- AddForeignKey
ALTER TABLE "PromoUsage" ADD CONSTRAINT "PromoUsage_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
