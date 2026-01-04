import { Request, Response } from "express";
import { z } from "zod";
import { ProductPricingService } from "../services/productPricing.service";

const svc = new ProductPricingService();

export class ProductPricingController {
  createBatchSchema = z.object({
    rawProductId: z.string(),
    pricings: z
      .array(
        z.object({
          months: z.number().min(1),
          price: z.number().min(1),
          backupPrice: z.number().nullable(), // boleh null
        })
      )
      .nonempty(),
  });

  updateSchema = z.object({
    price: z.number().optional(),
    backupPrice: z.number().nullable().optional(),
    isActive: z.boolean().optional(),
  });

  // ============================================
  // CREATE / UPDATE BATCH
  // ============================================
  createBatch = async (req: Request, res: Response) => {
    try {
      const dto = this.createBatchSchema.parse(req.body);
      const data = await svc.createOrUpdateBatch(dto);
      res.json({ success: true, data });
    } catch (err: unknown) {
      console.error("createBatch Error:", err);
      const message = err instanceof Error ? err.message : "Failed to create batch";
      res.status(400).json({ success: false, error: message });
    }
  };

  // ============================================
  // LIST PRODUCT PRICING
  // ============================================
  listByProduct = async (req: Request, res: Response) => {
    try {
      const rawProductId = req.params.rawProductId;
      const data = await svc.listByRawProduct(rawProductId);
      res.json({ success: true, data });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to list product pricing";
      res.status(400).json({ success: false, error: message });
    }
  };

  // ============================================
  // UPDATE
  // ============================================
  update = async (req: Request, res: Response) => {
    try {
      const dto = this.updateSchema.parse(req.body);
      const data = await svc.update(req.params.id, dto);
      res.json({ success: true, data });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update product pricing";
      res.status(400).json({ success: false, error: message });
    }
  };

  // ============================================
  // DELETE
  // ============================================
  delete = async (req: Request, res: Response) => {
    try {
      await svc.delete(req.params.id);
      res.json({ success: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete product pricing";
      res.status(400).json({ success: false, error: message });
    }
  };
}
