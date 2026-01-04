import { Request, Response } from "express";
import { z } from "zod";
import { PromoService } from "../services/promo.service";

const svc = new PromoService();

export class PromoController {
  // ======================
  // SCHEMA
  // ======================
  
  createSchema = z.object({
    code: z.string().min(3),
    type: z.enum(["PERCENT", "AMOUNT"]),
    value: z.number().min(1),

    minOrderAmount: z.number().nullable().optional(),
    maxDiscount: z.number().nullable().optional(),

    startsAt: z.string(),
    endsAt: z.string(),

    globalLimit: z.number().nullable().optional(),
    userLimit: z.number().nullable().optional(),
  });

  updateSchema = this.createSchema.partial();

  // ======================
  // ADMIN (BUSINESS)
  // ======================
  create = async (req: Request, res: Response) => {
    try {
      const dto = this.createSchema.parse(req.body);

      const promo = await svc.create({
        ...dto,
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
      });

      return res.status(201).json({ success: true, data: promo });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return res.status(400).json({ success: false, error: message });
    }
  };

  list = async (_req: Request, res: Response) => {
    const promos = await svc.list();
    return res.json({ success: true, data: promos });
  };

  getById = async (req: Request, res: Response) => {
    const promo = await svc.getById(req.params.id);
    if (!promo)
      return res.status(404).json({ success: false, error: "Promo not found" });

    return res.json({ success: true, data: promo });
  };

  update = async (req: Request, res: Response) => {
    try {
      const dto = this.updateSchema.parse(req.body);

      const promo = await svc.update(req.params.id, {
        ...dto,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
      });

      return res.json({ success: true, data: promo });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return res.status(400).json({ success: false, error: message });
    }
  };

  delete = async (req: Request, res: Response) => {
    await svc.delete(req.params.id);
    return res.json({ success: true, message: "Promo deleted" });
  };

  // ======================
  // CLIENT
  // ======================
  validatePromo = async (req: Request, res: Response) => {
    try {
      const { code, amount } = req.body;
      const clientId = req.user!.id;

      const promo = await svc.getByCode(code);
      if (!promo) throw new Error("Promo not found");

      const now = new Date();
      if (!promo.isActive) throw new Error("Promo disabled");
      if (now < promo.startsAt) throw new Error("Promo not started");
      if (now > promo.endsAt) throw new Error("Promo expired");

      if (
        promo.globalLimit !== null &&
        promo.usedCount >= promo.globalLimit
      ) {
        throw new Error("Promo quota finished");
      }

      if (promo.userLimit !== null) {
        const used = await svc.countUsageByUser(promo.id, clientId);
        if (used >= promo.userLimit)
          throw new Error("Promo already used by user");
      }

      if (promo.minOrderAmount && amount < promo.minOrderAmount)
        throw new Error("Order does not meet minimum amount");

      const discount =
        promo.type === "PERCENT"
          ? Math.min(
              Math.floor((amount * promo.value) / 100),
              promo.maxDiscount ?? Infinity
            )
          : promo.value;

      return res.json({
        success: true,
        data: {
          promoId: promo.id,
          discount,
          finalAmount: Math.max(amount - discount, 0),
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return res.status(400).json({ success: false, error: message });
    }
  };

  usePromo = async (req: Request, res: Response) => {
    try {
      const clientId = req.user!.id;
      const promoId = req.params.id;

      await svc.markUsed(promoId, clientId);

      return res.json({ success: true, message: "Promo used successfully" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return res.status(400).json({ success: false, error: message });
    }
  };
}
