import { Request, Response } from "express";
import { ReinstallService } from "../services/reinstall.service";
import { RestoreService } from "../services/restore.service";

interface VPSParams {
  vpsId: string;
}

interface ReinstallBody {
  templateId: string;
}

interface RestoreBody {
  backupId: string;
}

interface ResponseData<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

export class VPSActionController {
  reinstallSvc = new ReinstallService();
  restoreSvc = new RestoreService();

  reinstall = async (
    req: Request<VPSParams, ResponseData, ReinstallBody>,
    res: Response<ResponseData>
  ) => {
    try {
      const result = await this.reinstallSvc.reinstall(
        req.params.vpsId,
        req.body.templateId
      );
      res.json({ success: true, data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ success: false, message });
    }
  };

  restore = async (
    req: Request<VPSParams, ResponseData, RestoreBody>,
    res: Response<ResponseData>
  ) => {
    try {
      const result = await this.restoreSvc.restore(
        req.params.vpsId,
        req.body.backupId
      );
      res.json({ success: true, data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ success: false, message });
    }
  };
}
