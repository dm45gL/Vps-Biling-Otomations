import { Request, Response } from "express";
import { z } from "zod";
import { OrderService } from "../services/order.service";

const svc = new OrderService();

export class OrderController {
  /**
   * Schema validasi body 
   */
  private createSchema = z.object({
    pricingId: z.string().min(1),
    promoId: z.string().optional(),
    backupEnabled: z.boolean().optional(),
    region: z.string().min(1),
    templateId: z.string().optional(),
    billingAddress: z.object({
      email: z.string().email(),
      fullName: z.string().min(1),
      companyName: z.string().optional(),
      country: z.string().min(1),
      state: z.string().min(1),
      city: z.string().min(1),
      addressLine1: z.string().min(1),
      addressLine2: z.string().optional(),
      postalCode: z.string().min(1),
      phone: z.string().min(1),
    }),
  });

  /**
   * POST /api/orders
   */
  create = async (req: Request, res: Response) => {
    try {
      // 1. Validasi body
      const dto = this.createSchema.parse(req.body);

      // 2. Ambil user dari JWT
      if (!req.user || req.user.type !== "CLIENT") {
        return res.status(401).json({
          success: false,
          error: "Unauthorized",
        });
      }

      const clientId = req.user.id;

      // 3. Panggil service dengan region & templateId
      const result = await svc.createOrder({
        clientId,
        pricingId: dto.pricingId,
        promoId: dto.promoId,
        backupEnabled: dto.backupEnabled,
        region: dto.region,
        templateId: dto.templateId,
        billingAddress: dto.billingAddress,
      });

      return res.json(result);
    } catch (err: unknown) {
      console.error("Order Create Error:", err);

      // Tangani Zod validation error
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: err.issues?.[0]?.message || "Invalid request data",
        });
      }

      // Tangani generic error
      const message = err instanceof Error ? err.message : "Failed to create order";

      return res.status(400).json({ success: false, error: message });
    }
  };
}
