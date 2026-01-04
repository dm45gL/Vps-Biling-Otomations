// import { Request, Response } from "express";
// import { MasterHypervisorService } from "../services/MasterHypervisorService";

// // ────────────── Set master ──────────────
// export const setMasterController = async (req: Request, res: Response) => {
//   const { hypervisorId } = req.params;
//   if (!hypervisorId) return res.status(400).json({ success: false, error: "hypervisorId is required" });

//   try {
//     const master = await MasterHypervisorService.setMaster(hypervisorId);
//     return res.json({ success: true, message: "Hypervisor set as master", data: master });
//   } catch (err: any) {
//     return res.status(500).json({ success: false, error: err.message || "Internal server error" });
//   }
// };

// // ────────────── Unset master ──────────────
// export const unsetMasterController = async (req: Request, res: Response) => {
//   const { regionId } = req.params;
//   if (!regionId) return res.status(400).json({ success: false, error: "regionId is required" });

//   try {
//     const result = await MasterHypervisorService.unsetMaster(regionId);
//     return res.json({ success: true, message: "Master unset for region", data: result });
//   } catch (err: any) {
//     return res.status(500).json({ success: false, error: err.message || "Internal server error" });
//   }
// };

// // ────────────── Sync master templates ──────────────
// export const syncMasterTemplatesController = async (req: Request, res: Response) => {
//   const { regionId } = req.params;
//   if (!regionId) return res.status(400).json({ success: false, error: "regionId is required" });

//   try {
//     const result = await MasterHypervisorService.syncTemplatesToRegion(regionId);
//     return res.json({
//       success: true,
//       message: `Templates synced to ${result.syncedHypervisors} hypervisor(s) in region`,
//     });
//   } catch (err: any) {
//     return res.status(500).json({ success: false, error: err.message || "Internal server error" });
//   }
// };



import { Request, Response } from "express";
import { MasterHypervisorService } from "../services/MasterHypervisorService";

// ────────────── Set master ──────────────
export const setMasterController = async (req: Request, res: Response) => {
  const { hypervisorId } = req.params;
  if (!hypervisorId)
    return res.status(400).json({ success: false, error: "hypervisorId is required" });

  try {
    const master = await MasterHypervisorService.setMaster(hypervisorId);
    return res.json({
      success: true,
      message: "Hypervisor set as master",
      data: master,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
};

// ────────────── Unset master ──────────────
export const unsetMasterController = async (req: Request, res: Response) => {
  const { regionId } = req.params;
  if (!regionId)
    return res.status(400).json({ success: false, error: "regionId is required" });

  try {
    const result = await MasterHypervisorService.unsetMaster(regionId);
    return res.json({
      success: true,
      message: "Master unset for region",
      data: result,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
};

// ────────────── Sync master templates (PER REGION) ──────────────
export const syncMasterTemplatesController = async (req: Request, res: Response) => {
  const { regionId } = req.params;
  if (!regionId)
    return res.status(400).json({ success: false, error: "regionId is required" });

  try {
    const result = await MasterHypervisorService.syncTemplatesToRegion(regionId);
    return res.json({
      success: true,
      message: `Templates synced to ${result.syncedHypervisors} hypervisor(s) in region`,
      data: result,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
};

// ──────────────  Sync master templates (GLOBAL) ──────────────
export const syncMasterTemplatesGlobalController = async (_req: Request, res: Response) => {
  try {
    const result = await MasterHypervisorService.syncTemplatesGlobally();

    return res.json({
      success: true,
      message: "Global template sync completed",
      data: result,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
};
