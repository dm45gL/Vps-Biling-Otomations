import { Request, Response } from "express";
import { prisma } from "../../../core/db/client";
import { ProxmoxService } from "../services/proxmox.service";

interface VPSParams {
  id: string;
}

export class VPSController {
  proxmox = new ProxmoxService();

  start = async (req: Request<VPSParams>, res: Response) => {
    try {
      const vps = await prisma.vPS.findUnique({
        where: { id: req.params.id },
        include: { hypervisor: true, template: true },
      });

      if (!vps) {
        return res.status(404).json({ success: false, message: "VPS not found" });
      }

      await this.proxmox.start(vps.hypervisor, vps.template.node, vps.vmid);

      await prisma.vPS.update({
        where: { id: vps.id },
        data: { status: "RUNNING" },
      });

      res.json({ success: true });
    } catch (error: unknown) {
      // Narrow unknown to Error safely
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ success: false, message });
    }
  };

  stop = async (req: Request<VPSParams>, res: Response) => {
    try {
      const vps = await prisma.vPS.findUnique({
        where: { id: req.params.id },
        include: { hypervisor: true, template: true },
      });

      if (!vps) {
        return res.status(404).json({ success: false, message: "VPS not found" });
      }

      await this.proxmox.stop(vps.hypervisor, vps.template.node, vps.vmid);

      await prisma.vPS.update({
        where: { id: vps.id },
        data: { status: "STOPPED" },
      });

      res.json({ success: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ success: false, message });
    }
  };
}
