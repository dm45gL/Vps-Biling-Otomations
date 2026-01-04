import { prisma } from "../../../core/db/client";

export class ProductPricingService {

  // ============================================
  // CREATE / UPDATE dalam 1 form
  // ============================================
  async createOrUpdateBatch(data: {
    rawProductId: string;
    pricings: {
      months: number;
      price: number;
      backupPrice: number | null;
    }[];
  }) {
    const results = [];

    for (const p of data.pricings) {
      // 1. Pastikan PricingDuration ada
      let duration = await prisma.pricingDuration.findUnique({
        where: { months: p.months },
      });

      if (!duration) {
        duration = await prisma.pricingDuration.create({
          data: {
            months: p.months,
            label: `${p.months} Month${p.months > 1 ? "s" : ""}`,
          },
        });
      }

      // 2. Upsert Pricing
      const pricing = await prisma.productPricing.upsert({
        where: {
          rawProductId_pricingDurationId: {
            rawProductId: data.rawProductId,
            pricingDurationId: duration.id,
          },
        },
        update: {
          price: p.price,
          backupPrice: p.backupPrice, // null diperbolehkan
          isActive: true,
        },
        create: {
          rawProductId: data.rawProductId,
          pricingDurationId: duration.id,
          price: p.price,
          backupPrice: p.backupPrice,
        },
        include: { pricingDuration: true },
      });

      results.push(pricing);
    }

    return results;
  }

  // ============================================
  // LIST
  // ============================================
  async listByRawProduct(rawProductId: string) {
    return prisma.productPricing.findMany({
      where: { rawProductId },
      include: { pricingDuration: true },
      orderBy: { pricingDurationId: "asc" },
    });
  }

  // ============================================
  // UPDATE single pricing
  // ============================================
  async update(
    id: string,
    data: { price?: number; backupPrice?: number | null; isActive?: boolean }
  ) {
    return prisma.productPricing.update({
      where: { id },
      data,
      include: { pricingDuration: true },
    });
  }

  // ============================================
  // DELETE
  // ============================================
  async delete(id: string) {
    return prisma.productPricing.delete({
      where: { id },
    });
  }
}
