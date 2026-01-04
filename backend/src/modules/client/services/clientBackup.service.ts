// import { prisma } from "../../../core/db/client";
// import { BackupJobStatus } from "@prisma/client";
// import { getHypervisorService } from "../../sysadmin/services/hypervisor.factory";

// export class ClientBackupService {

//   // Trigger backup manual
//   async triggerBackup(clientId: string, vmId: string, hypervisorId: string, storageId: string) {
//     // cek apakah client punya VM / product ini
//     const clientProduct = await prisma.clientProduct.findFirst({
//       where: { clientId, product: { someVMs: { vmId } } } // sesuaikan relasi
//     });
//     if (!clientProduct) throw new Error("Unauthorized or product not found");

//     // buat entry backup job
//     const job = await prisma.backupJob.create({
//       data: {
//         vmId,
//         hypervisorId,
//         storageId,
//         status: BackupJobStatus.PENDING,
//       },
//     });

//     // jalankan backup async
//     this.runBackup(job.id);

//     return job;
//   }

//   private async runBackup(jobId: string) {
//     const job = await prisma.backupJob.findUnique({ where: { id: jobId } });
//     if (!job) return;

//     await prisma.backupJob.update({ where: { id: jobId }, data: { status: BackupJobStatus.RUNNING, startedAt: new Date() } });

//     try {
//       // ambil hypervisor
//       const hypervisor = await prisma.hypervisor.findUnique({ where: { id: job.hypervisorId } });
//       if (!hypervisor) throw new Error("Hypervisor not found");

//       const service = getHypervisorService(hypervisor.type, {
//         id: hypervisor.id,
//         host: hypervisor.host,
//         token: hypervisor.token // kalau perlu decrypt
//       });

//       // jalankan backup ke storage (proxmox dir / S3 / dll)
//       const backupResult = await service.backupVM(job.vmId, job.storageId);

//       await prisma.backupJob.update({
//         where: { id: jobId },
//         data: {
//           status: BackupJobStatus.SUCCESS,
//           fileName: backupResult.fileName,
//           fileSize: backupResult.fileSize,
//           durationSec: backupResult.durationSec,
//           finishedAt: new Date(),
//           log: backupResult.log,
//         },
//       });
//     } catch (err: any) {
//       await prisma.backupJob.update({
//         where: { id: jobId },
//         data: {
//           status: BackupJobStatus.FAILED,
//           log: err.message,
//           finishedAt: new Date(),
//         },
//       });
//     }
//   }

//   // Restore backup
//   async restoreBackup(clientId: string, jobId: string) {
//     const job = await prisma.backupJob.findUnique({ where: { id: jobId } });
//     if (!job) throw new Error("Backup job not found");

//     // cek client ownership
//     const clientProduct = await prisma.clientProduct.findFirst({
//       where: { clientId, product: { someVMs: { vmId: job.vmId } } } // sesuaikan relasi
//     });
//     if (!clientProduct) throw new Error("Unauthorized");

//     const hypervisor = await prisma.hypervisor.findUnique({ where: { id: job.hypervisorId } });
//     if (!hypervisor) throw new Error("Hypervisor not found");

//     const service = getHypervisorService(hypervisor.type, {
//       id: hypervisor.id,
//       host: hypervisor.host,
//       token: hypervisor.token
//     });

//     return service.restoreVM(job.vmId, job.fileName!);
//   }

//   // Download backup file
//   async getBackupDownloadLink(clientId: string, jobId: string) {
//     const job = await prisma.backupJob.findUnique({ where: { id: jobId } });
//     if (!job) throw new Error("Backup job not found");

//     const clientProduct = await prisma.clientProduct.findFirst({
//       where: { clientId, product: { someVMs: { vmId: job.vmId } } } // sesuaikan relasi
//     });
//     if (!clientProduct) throw new Error("Unauthorized");

//     // buat signed URL atau path download
//     return `/download/${job.fileName}`;
//   }

// }
