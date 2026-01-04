import { Request, Response } from "express";
import { z } from "zod";
import { IPService } from "../services/ip.service";
import { IPStatus, IPType } from "@prisma/client";

const service = new IPService();

// --- DTO ---
const CreateIPDTO = z.object({
  ip: z.string(),
  type: z.nativeEnum(IPType),
  regionId: z.string(),
  status: z.nativeEnum(IPStatus).optional(),
  note: z.string().optional(),
  gateway: z.string().optional(),
  netmask: z.number().optional(),
  dns: z.string().optional(),
});

const CreateFromCIDRDTO = z.object({
  cidr: z.string(),
  type: z.nativeEnum(IPType),
  regionId: z.string(),
  status: z.nativeEnum(IPStatus).optional(),
  note: z.string().optional(),
  dns: z.string().optional(),
});

const UpdateIPDTO = z.object({
  type: z.nativeEnum(IPType).optional(),
  status: z.nativeEnum(IPStatus).optional(),
  note: z.string().optional(),
  gateway: z.string().optional(),
  netmask: z.number().optional(),
  dns: z.string().optional(),
  regionId: z.string().optional(),
});

// --- Controller ---
export class IPController {
  async getAll(req: Request, res: Response) {
    try {
      const regionId = req.query.regionId as string | undefined;
      const data = await service.getAll(regionId);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getOne(req: Request, res: Response) {
    try {
      const data = await service.getById(req.params.id);
      if (!data) return res.status(404).json({ success: false, error: "Not found" });
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const dto = CreateIPDTO.parse(req.body);
      const data = await service.create(dto);
      res.status(201).json({ success: true, data });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  async createFromCIDR(req: Request, res: Response) {
    try {
      const dto = CreateFromCIDRDTO.parse(req.body);
      const result = await service.createFromCidr(
        dto.cidr, dto.type, dto.regionId, dto.status ?? IPStatus.AVAILABLE, dto.note, dto.dns
      );
      res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const dto = UpdateIPDTO.parse(req.body);
      const data = await service.update(req.params.id, dto);
      res.json({ success: true, data });
    } catch (err: any) {
      if (err.code === "P2025") return res.status(404).json({ success: false, error: "IP not found" });
      res.status(400).json({ success: false, error: err.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await service.delete(req.params.id);
      res.json({ success: true, message: "IP deleted" });
    } catch (err: any) {
      if (err.code === "P2025") return res.status(404).json({ success: false, error: "IP not found" });
      res.status(400).json({ success: false, error: err.message });
    }
  }
}
