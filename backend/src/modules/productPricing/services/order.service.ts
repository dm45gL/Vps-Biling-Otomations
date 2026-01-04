import { prisma } from "../../../core/db/client";
import { InvoiceService } from "./invoice.service";
import { CheckoutService } from "./checkout.service";
import { v4 as uuidv4 } from "uuid";
import { addMonths } from "date-fns";

type CreateOrderInput = {
  clientId: string;
  pricingId: string;
  promoId?: string;
  backupEnabled?: boolean;
  region: string;          // ← wajib diisi
  templateId?: string;     // ← opsional
  billingAddress: {
    email: string;
    fullName: string;
    companyName?: string;
    country: string;
    state: string;
    city: string;
    addressLine1: string;
    addressLine2?: string;
    postalCode: string;
    phone: string;
  };
};

export class OrderService {
  private invoice = new InvoiceService();
  private checkout = new CheckoutService();

  async createOrder(input: CreateOrderInput) {
    const {
      clientId,
      pricingId,
      promoId,
      backupEnabled = false,
      region,
      templateId,
      billingAddress,
    } = input;

    if (!region || region.trim() === '') {
      throw new Error("Region harus dipilih");
    }

    // ─────────────────────────────────────────────
    // 1. Preview pricing & promo (SOURCE OF TRUTH)
    // ─────────────────────────────────────────────
    const preview = await this.checkout.preview({
      clientId,
      pricingId,
      promoId,
      backupEnabled,
    });

    const pricing = preview.pricing;
    const promo = preview.promoApplied;
    const months = pricing.durationMonths;

    // 🔑 SATU externalId UNTUK SEMUANYA
    const externalId = `order-${uuidv4()}`;

    // ─────────────────────────────────────────────
    // 2. Transaction: billing + promo + order
    // ─────────────────────────────────────────────
    const order = await prisma.$transaction(async (tx) => {
      // Billing address (snapshot per order)
      const billing = await tx.billingAddress.create({
        data: {
          clientId,
          ...billingAddress,
        },
      });

      // Promo usage
      if (promo) {
        await tx.promoUsage.create({
          data: {
            clientId,
            promoId: promo.id,
          },
        });

        await tx.promo.update({
          where: { id: promo.id },
          data: { usedCount: { increment: 1 } },
        });
      }

      // Order
      return tx.order.create({
        data: {
          clientId,
          pricingId,
          billingAddressId: billing.id,
          rawPrice: pricing.rawPrice,
          discount: pricing.discount,
          finalPrice: pricing.finalPrice,
          months,
          nextBillingDate: addMonths(new Date(), months),
          status: "PENDING_PAYMENT",
          externalId,      // 🔥 dipakai di webhook
          region,          // ← simpan region, wajib
          templateId,      // ← opsional
        },
      });
    });

    // ─────────────────────────────────────────────
    // 3. Create Xendit Invoice
    // ─────────────────────────────────────────────
    let invoice;
    try {
      invoice = await this.invoice.createInvoice({
        externalId,
        amount: pricing.finalPrice,
        customerEmail: billingAddress.email,
        description: `Payment for VPS - Order ${order.id}`,
        invoiceDuration: 60 * 60 * 48, // 48 jam
        reminderTime: 60 * 60,         // 1 jam
      });
    } catch (err) {
      // Jika invoice gagal → cancel order
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED" },
      });
      throw err;
    }

    // ─────────────────────────────────────────────
    // 4. Update order dengan invoice data
    // ─────────────────────────────────────────────
    await prisma.order.update({
      where: { id: order.id },
      data: {
        invoiceId: invoice.id,
        invoiceUrl: invoice.invoiceUrl,
        invoiceExpired: invoice.expiryDate,
      },
    });

    // ─────────────────────────────────────────────
    // 5. Response
    // ─────────────────────────────────────────────
    return {
      success: true,
      data: {
        orderId: order.id,
        externalId, 
        invoiceId: invoice.id,
        invoiceUrl: invoice.invoiceUrl,
        expiresAt: invoice.expiryDate,
        pricing: {
          rawPrice: pricing.rawPrice,
          backupPrice: backupEnabled ? pricing.backupCost : 0,
          discount: pricing.discount,
          finalPrice: pricing.finalPrice,
          durationMonths: months,
        },
        backupEnabled,
        promoApplied: promo,
        billingAddress,
        region,       
        templateId,  
      },
    };
  }
}
