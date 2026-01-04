/*
  Warnings:

  - A unique constraint covering the columns `[promoId,clientId,usedAt]` on the table `PromoUsage` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "PromoUsage_promoId_clientId_key";

-- CreateIndex
CREATE UNIQUE INDEX "PromoUsage_promoId_clientId_usedAt_key" ON "PromoUsage"("promoId", "clientId", "usedAt");
