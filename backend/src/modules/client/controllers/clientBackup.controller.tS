// import { Request, Response } from "express";
// import { ClientBackupService } from "../services/clientBackup.service";

// const service = new ClientBackupService();

// export const triggerBackup = async (req: Request, res: Response) => {
//   const clientId = req.user.id; // asumsi auth middleware set req.user
//   const { vmId, hypervisorId, storageId } = req.body;

//   try {
//     const job = await service.triggerBackup(clientId, vmId, hypervisorId, storageId);
//     res.json({ success: true, data: job });
//   } catch (err: any) {
//     res.status(500).json({ success: false, error: err.message });
//   }
// };

// export const restoreBackup = async (req: Request, res: Response) => {
//   const clientId = req.user.id;
//   const { jobId } = req.params;

//   try {
//     const result = await service.restoreBackup(clientId, jobId);
//     res.json({ success: true, data: result });
//   } catch (err: any) {
//     res.status(500).json({ success: false, error: err.message });
//   }
// };

// export const downloadBackup = async (req: Request, res: Response) => {
//   const clientId = req.user.id;
//   const { jobId } = req.params;

//   try {
//     const downloadLink = await service.getBackupDownloadLink(clientId, jobId);
//     res.json({ success: true, data: { url: downloadLink } });
//   } catch (err: any) {
//     res.status(500).json({ success: false, error: err.message });
//   }
// };
// // 