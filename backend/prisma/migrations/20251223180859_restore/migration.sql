-- AlterTable
ALTER TABLE "BackupHistory" ADD COLUMN     "vpsId" TEXT;

-- AddForeignKey
ALTER TABLE "BackupHistory" ADD CONSTRAINT "BackupHistory_vpsId_fkey" FOREIGN KEY ("vpsId") REFERENCES "VPS"("id") ON DELETE SET NULL ON UPDATE CASCADE;
