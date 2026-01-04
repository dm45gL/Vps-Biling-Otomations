-- CreateEnum
CREATE TYPE "VPSStatus" AS ENUM ('PROVISIONING', 'RUNNING', 'STOPPED', 'SUSPENDED', 'TERMINATED', 'ERROR');

-- CreateTable
CREATE TABLE "VPS" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "rawProductId" TEXT NOT NULL,
    "pricingId" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "hypervisorId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "vmid" INTEGER NOT NULL,
    "hostname" TEXT NOT NULL,
    "cpu" INTEGER NOT NULL,
    "ram" INTEGER NOT NULL,
    "disk" INTEGER NOT NULL,
    "bandwidth" INTEGER NOT NULL,
    "ipAddressId" TEXT NOT NULL,
    "backupEnabled" BOOLEAN NOT NULL DEFAULT false,
    "backupPolicyId" TEXT,
    "backupProvider" "BackupProvider",
    "status" "VPSStatus" NOT NULL DEFAULT 'PROVISIONING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "VPS_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VPS_ipAddressId_key" ON "VPS"("ipAddressId");

-- CreateIndex
CREATE UNIQUE INDEX "VPS_hypervisorId_vmid_key" ON "VPS"("hypervisorId", "vmid");

-- AddForeignKey
ALTER TABLE "VPS" ADD CONSTRAINT "VPS_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VPS" ADD CONSTRAINT "VPS_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VPS" ADD CONSTRAINT "VPS_rawProductId_fkey" FOREIGN KEY ("rawProductId") REFERENCES "RawProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VPS" ADD CONSTRAINT "VPS_pricingId_fkey" FOREIGN KEY ("pricingId") REFERENCES "ProductPricing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VPS" ADD CONSTRAINT "VPS_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VPS" ADD CONSTRAINT "VPS_hypervisorId_fkey" FOREIGN KEY ("hypervisorId") REFERENCES "Hypervisor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VPS" ADD CONSTRAINT "VPS_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VPS" ADD CONSTRAINT "VPS_ipAddressId_fkey" FOREIGN KEY ("ipAddressId") REFERENCES "ip_addresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
