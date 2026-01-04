import { Request, Response } from "express";
import { RegionService } from "../services/region.service";

export class RegionController {
  // CREATE REGION
  static async create(req: Request, res: Response) {
    try {
      const { code, name } = req.body;
      const region = await RegionService.createRegion({ code, name });
      res.status(201).json(region);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // LIST REGIONS
  static async list(req: Request, res: Response) {
    try {
      const regions = await RegionService.listRegions();
      res.json(regions);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // GET REGION DETAIL
  static async get(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const region = await RegionService.getRegion(id);
      if (!region) return res.status(404).json({ error: "Region not found" });
      res.json(region);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // UPDATE REGION
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = req.body;
      const region = await RegionService.updateRegion(id, data);
      res.json(region);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // DELETE REGION
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const region = await RegionService.deleteRegion(id);
      res.json(region);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
