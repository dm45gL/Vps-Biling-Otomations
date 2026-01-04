import { prisma } from "../../../core/db/client";

export class CheckoutService {
  // =========================
  // INTERNAL: HITUNG HARGA DAN PROMO
  // =========================
  async preview(input: {
    pricingId: string;
    clientId: string;
    promoId?: string;
    backupEnabled?: boolean;
  }) {
    const pricing = await prisma.productPricing.findUnique({
      where: { id: input.pricingId },
      include: { pricingDuration: true, rawProduct: true },
    });

    if (!pricing) throw new Error("Paket harga tidak ditemukan");
    if (!pricing.isActive) throw new Error("Paket harga tidak aktif");
    if (!pricing.rawProduct || pricing.rawProduct.deletedAt)
      throw new Error("Produk tidak tersedia");
    if (!pricing.pricingDuration || pricing.pricingDuration.months <= 0)
      throw new Error("Durasi paket tidak valid");

    const months = pricing.pricingDuration.months;
    const basePrice = pricing.price;
    const backupCost =
      input.backupEnabled && pricing.backupPrice
        ? pricing.backupPrice * months
        : 0;
    const rawPrice = basePrice + backupCost;

    let discount = 0;
    let promoData: { id: string; type: string; value: number } | null = null;

    if (input.promoId) {
      const promo = await prisma.promo.findUnique({ where: { id: input.promoId } });
      if (!promo || !promo.isActive) throw new Error("Promo tidak valid");

      const now = new Date();
      if (now < promo.startsAt || now > promo.endsAt) throw new Error("Promo tidak aktif");

      if (promo.minOrderAmount !== null && rawPrice < promo.minOrderAmount)
        throw new Error("Minimal pembelian tidak terpenuhi");

      const used = promo.userLimit
        ? await prisma.promoUsage.count({ where: { promoId: promo.id, clientId: input.clientId } })
        : 0;
      if (promo.userLimit !== null && used >= promo.userLimit) throw new Error("Promo sudah digunakan");

      discount = promo.type === "PERCENT" 
        ? Math.min(Math.floor((rawPrice * promo.value) / 100), promo.maxDiscount ?? Infinity) 
        : promo.value;
      discount = Math.min(discount, rawPrice);

      promoData = { id: promo.id, type: promo.type, value: promo.value };
    }

    return {
      pricing: {
        rawPrice,
        backupCost,
        discount,
        finalPrice: Math.max(rawPrice - discount, 0),
        durationMonths: months,
      },
      promoApplied: promoData,
      backupEnabled: input.backupEnabled ?? false,
    };
  }
}
