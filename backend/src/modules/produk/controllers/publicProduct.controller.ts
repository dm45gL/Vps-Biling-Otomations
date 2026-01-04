import { Request, Response } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { PublicProductService } from "../services/publicProduct.service";
import {
  ClientProductDTO,
  ClientTemplateCategoryDTO,
  ClientTemplateGroupDTO,
  ClientTemplateDTO,
} from "../services/publicProduct.service";

const service = new PublicProductService();

export class PublicProductController {
  // ────────────────────────────────
  // SCHEMAS
  // ────────────────────────────────
  private createSchema = z.object({
    rawProductId: z.string().min(1),
    name: z.string().min(1),
    description: z.string().optional(),
  });

  private updateSchema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
  });

  private setActiveSchema = z.object({ isActive: z.boolean() });

  // ────────────────────────────────
  // CREATE
  // ────────────────────────────────
  create = async (req: Request, res: Response) => {
    try {
      const dto = this.createSchema.parse(req.body);
      const data = await service.create(dto);
      res.status(201).json({ success: true, data });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create product";
      res.status(400).json({ success: false, error: message });
    }
  };

  // ────────────────────────────────
  // LIST CLIENT
  // ────────────────────────────────
  listActiveClient = async (_req: Request, res: Response) => {
    try {
      const data = await service.listActiveClient();
      this.ensureRegionsAndMasterFlag(data);
      res.json({ success: true, data });
    } catch (err: unknown) {
      console.error("Error listing client products:", err);
      const message = err instanceof Error ? err.message : "Failed to list client products";
      res.status(500).json({ success: false, error: message });
    }
  };

  // ────────────────────────────────
  // DETAIL CLIENT
  // ────────────────────────────────
  getDetailClient = async (req: Request, res: Response) => {
    try {
      const { publicId } = req.params;
      const data = await service.getDetailClient(publicId);
      if (!data) return res.status(404).json({ success: false, error: "Product not found" });

      this.ensureRegionsAndMasterFlag([data]);
      res.json({ success: true, data });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to get product detail";
      res.status(500).json({ success: false, error: message });
    }
  };

  // ────────────────────────────────
  // LIST ADMIN
  // ────────────────────────────────
  listAdmin = async (_req: Request, res: Response) => {
    try {
      const data = await service.listAdmin();
      this.ensureRegionsAndMasterFlag(data);
      res.json({ success: true, data });
    } catch (err: unknown) {
      console.error("Error listing admin products:", err);
      const message = err instanceof Error ? err.message : "Failed to list admin products";
      res.status(500).json({ success: false, error: message });
    }
  };

  // ────────────────────────────────
  // DETAIL ADMIN
  // ────────────────────────────────
  getDetailAdmin = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data = await service.getDetailAdmin(id);
      if (!data) return res.status(404).json({ success: false, error: "Product not found" });

      this.ensureRegionsAndMasterFlag([data]);
      res.json({ success: true, data });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to get product detail";
      res.status(500).json({ success: false, error: message });
    }
  };

  // ────────────────────────────────
  // UPDATE
  // ────────────────────────────────
  update = async (req: Request, res: Response) => {
    try {
      const dto = this.updateSchema.parse(req.body);
      const { id } = req.params;
      const data = await service.update(id, dto);
      res.json({ success: true, data });
    } catch (err: unknown) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
        return res.status(404).json({ success: false, error: "Product not found" });
      }
      const message = err instanceof Error ? err.message : "Failed to update product";
      res.status(400).json({ success: false, error: message });
    }
  };

  // ────────────────────────────────
  // SET ACTIVE
  // ────────────────────────────────
  setActive = async (req: Request, res: Response) => {
    try {
      const dto = this.setActiveSchema.parse(req.body);
      const { id } = req.params;
      const data = await service.setActive(id, dto.isActive);
      res.json({ success: true, data });
    } catch (err: unknown) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
        return res.status(404).json({ success: false, error: "Product not found" });
      }
      const message = err instanceof Error ? err.message : "Failed to set product active";
      res.status(400).json({ success: false, error: message });
    }
  };

  // ────────────────────────────────
  // DELETE
  // ────────────────────────────────
  delete = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await service.delete(id);
      res.json({ success: true });
    } catch (err: unknown) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
        return res.status(404).json({ success: false, error: "Product not found" });
      }
      const message = err instanceof Error ? err.message : "Failed to delete product";
      res.status(400).json({ success: false, error: message });
    }
  };

  // ────────────────────────────────
  // HELPER: pastikan regions dan isMasterHypervisor selalu ada
  // ────────────────────────────────
  private ensureRegionsAndMasterFlag(products: ClientProductDTO[]) {
    products.forEach((p: ClientProductDTO) => {
      if (!p.regions) p.regions = [];

      p.categories?.forEach((c: ClientTemplateCategoryDTO) => {
        c.groups.forEach((g: ClientTemplateGroupDTO) => {
          g.templates.forEach((t: ClientTemplateDTO) => {
            if (t.isMasterHypervisor === undefined) t.isMasterHypervisor = false;
          });
        });
      });
    });
  }
}
