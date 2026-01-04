import { Router, Request, Response } from "express";
import { VPSController } from "../controller/vps.controller";
import { ReinstallService } from "../services/reinstall.service";
import { RestoreService } from "../services/restore.service";

const router = Router();

const vpsController = new VPSController();
const reinstallService = new ReinstallService();
const restoreService = new RestoreService();

/**
 * VPS POWER
 */
router.post("/:id/start", vpsController.start);
router.post("/:id/stop", vpsController.stop);

/**
 * VPS REINSTALL
 * body: { templateId: string }
 */
router.post("/:id/reinstall", async (req: Request, res: Response) => {
  try {
    const { templateId } = req.body;
    if (!templateId) {
      return res
        .status(400)
        .json({ success: false, message: "templateId is required" });
    }

    const result = await reinstallService.reinstall(req.params.id, templateId);

    res.json({ success: true, data: result });
  } catch (error: unknown) {
    let message = "Unknown error";
    if (error instanceof Error) {
      message = error.message;
    }
    res.status(500).json({
      success: false,
      message,
    });
  }
});

/**
 * VPS RESTORE
 * body: { backupId: string }
 */
router.post("/:id/restore", async (req: Request, res: Response) => {
  try {
    const { backupId } = req.body;
    if (!backupId) {
      return res
        .status(400)
        .json({ success: false, message: "backupId is required" });
    }

    const result = await restoreService.restore(req.params.id, backupId);

    res.json({ success: true, data: result });
  } catch (error: unknown) {
    let message = "Unknown error";
    if (error instanceof Error) {
      message = error.message;
    }
    res.status(500).json({
      success: false,
      message,
    });
  }
});

export default router;
