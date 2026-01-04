import { prisma } from "../../../core/db/client";
import { PromoType } from "@prisma/client";

export interface PromoCreateDTO {
  code: string;
  type: PromoType;
  value: number;
  minOrderAmount?: number | null;
  maxDiscount?: number | null;
  startsAt: Date;
  endsAt: Date;
  globalLimit?: number | null;
  userLimit?: number | null;
}

export type PromoUpdateDTO = Partial<PromoCreateDTO>;

export class PromoService {
  // ======================
  // ADMIN
  // ======================
  async create(data: PromoCreateDTO) {
    return prisma.promo.create({
      data: {
        ...data,
        minOrderAmount: data.minOrderAmount ?? null,
        maxDiscount: data.maxDiscount ?? null,
        globalLimit: data.globalLimit ?? null,
        userLimit: data.userLimit ?? null,
      },
    });
  }

  async list() {
    return prisma.promo.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async getById(id: string) {
    return prisma.promo.findUnique({ where: { id } });
  }

  async getByCode(code: string) {
    return prisma.promo.findUnique({ where: { code } });
  }

  async update(id: string, data: PromoUpdateDTO) {
    return prisma.promo.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.promo.delete({ where: { id } });
  }

  // ======================
  // CLIENT
  // ======================
  async countUsageByUser(promoId: string, clientId: string) {
    return prisma.promoUsage.count({
      where: { promoId, clientId },
    });
  }

  /**
   * Mark promo as used (AFTER order success)
   * - atomic
   * - safe for concurrent requests
   */
  async markUsed(promoId: string, clientId: string) {
    return prisma.$transaction(async (tx) => {
      const promo = await tx.promo.findUnique({
        where: { id: promoId },
      });

      if (!promo) throw new Error("Promo not found");
      if (!promo.isActive) throw new Error("Promo disabled");

      if (
        promo.globalLimit !== null &&
        promo.usedCount >= promo.globalLimit
      ) {
        throw new Error("Promo quota finished");
      }

      if (promo.userLimit !== null) {
        const usage = await tx.promoUsage.count({
          where: { promoId, clientId },
        });
        if (usage >= promo.userLimit) {
          throw new Error("Promo already used by user");
        }
      }

      await tx.promoUsage.create({
        data: { promoId, clientId },
      });

      return tx.promo.update({
        where: { id: promoId },
        data: {
          usedCount: { increment: 1 },
        },
      });
    });
  }
}
