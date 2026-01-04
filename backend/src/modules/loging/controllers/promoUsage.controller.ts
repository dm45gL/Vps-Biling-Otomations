import { Request, Response } from "express";
import { PromoUsageService } from "../services/promoUsage.service";

const svc = new PromoUsageService();

export class PromoUsageController {
  /**
   * GET /api/promos/:id/usages
   */
  listByPromo = async (req: Request, res: Response) => {
    try {
      const promoId = req.params.id;
      if (!promoId) throw new Error("Promo ID is required");

      const skip = Math.max(Number(req.query.skip ?? 0), 0);
      const take = Math.min(Math.max(Number(req.query.take ?? 20), 1), 100);

      const data = await svc.listByPromo(promoId, { skip, take });

      return res.json({
        success: true,
        data: data.items,
        meta: { total: data.total, skip: data.skip, take: data.take },
      });
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Unknown error";
      return res
        .status(message === "Promo ID is required" ? 400 : 500)
        .json({ success: false, error: message });
    }
  };

  /**
   * GET /api/promos/:id/summary
   */
  summary = async (req: Request, res: Response) => {
    try {
      const promoId = req.params.id;
      if (!promoId) throw new Error("Promo ID is required");

      const data = await svc.summary(promoId);
      return res.json({ success: true, data });
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Unknown error";
      return res
        .status(message === "Promo not found" ? 404 : 500)
        .json({ success: false, error: message });
    }
  };

  /**
   * GET /api/promos/:id/log/download
   */
  downloadCsvLog = async (req: Request, res: Response) => {
    try {
      const promoId = req.params.id;
      if (!promoId) throw new Error("Promo ID is required");

      const usages = await svc.listByPromo(promoId, { skip: 0, take: 10000 });
      const csv = await svc.generateCsvLog(usages.items);

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="promo-${promoId}-log.csv"`
      );
      res.send(csv);
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Unknown error";
      res.status(500).json({ success: false, error: message });
    }
  };

  /**
   * POST /api/promos/auto-delete
   * Menjalankan auto delete promo usages > 1 bulan lalu
   */
  autoDeleteOldUsages = async (_req: Request, res: Response) => {
    try {
      await svc.autoDeleteOldUsages();
      res.json({ success: true, message: "Auto-delete executed successfully" });
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Unknown error";
      res.status(500).json({ success: false, error: message });
    }
  };
}
