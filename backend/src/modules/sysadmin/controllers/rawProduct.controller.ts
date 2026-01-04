import { Request, Response } from "express";
import { z } from "zod";
import { RawProductService } from "../services/rawProduct.service";

export class RawProductController {
  private svc = new RawProductService();

  // VALIDATION SCHEMA
  createSchema = z.object({
    name: z.string(),
    cpu: z.number().min(1),
    ram: z.number().min(128),
    disk: z.number().min(10),
    bandwidth: z.number().min(1),
    backupPolicyId: z.string().optional().nullable(),
    templateCategoryIds: z.array(z.string()).nonempty("Minimal pilih 1 kategori"),
  });

  updateSchema = this.createSchema.partial();

  // CREATE
  create = async (req: Request, res: Response) => {
    try {
      const dto = this.createSchema.parse(req.body);

      const result = await this.svc.create(dto);

      return res.status(201).json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      console.error("Create RawProduct Error:", err);
      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  };

  // LIST
  list = async (_req: Request, res: Response) => {
    try {
      const products = await this.svc.list();

      return res.json({
        success: true,
        data: products,
      });
    } catch (err: any) {
      console.error("List RawProduct Error:", err);
      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  };

  // GET SINGLE
  get = async (req: Request, res: Response) => {
    try {
      const product = await this.svc.get(req.params.id);

      if (!product) {
        return res.status(404).json({
          success: false,
          error: "Raw product not found",
        });
      }

      return res.json({
        success: true,
        data: product,
      });
    } catch (err: any) {
      console.error("Get RawProduct Error:", err);
      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  };

  // UPDATE
  update = async (req: Request, res: Response) => {
    try {
      const dto = this.updateSchema.parse(req.body);

      const updated = await this.svc.update(req.params.id, dto);

      return res.json({
        success: true,
        data: updated,
      });
    } catch (err: any) {
      console.error("Update RawProduct Error:", err);
      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  };

  // DELETE
  delete = async (req: Request, res: Response) => {
    try {
      await this.svc.delete(req.params.id);

      return res.json({
        success: true,
      });
    } catch (err: any) {
      console.error("Delete RawProduct Error:", err);
      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  };
}
