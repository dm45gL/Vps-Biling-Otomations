// src/modules/checkout/controllers/checkout.controller.ts
import { Request, Response } from "express";
import { CheckoutService } from "../services/checkout.service";

export class CheckoutController {
  private checkoutService = new CheckoutService();

  /**
   * Preview harga sebelum order
   * POST /checkout/preview
   */
  async preview(req: Request, res: Response) {
    try {
      const { clientId, pricingId, promoId, backupEnabled } = req.body;

      if (!clientId || !pricingId) {
        return res.status(400).json({ success: false, message: "clientId dan pricingId required" });
      }

      const previewData = await this.checkoutService["preview"]({
        clientId,
        pricingId,
        promoId,
        backupEnabled,
      });

      return res.json({ success: true, data: previewData });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return res.status(500).json({ success: false, message });
    }
  }
}
