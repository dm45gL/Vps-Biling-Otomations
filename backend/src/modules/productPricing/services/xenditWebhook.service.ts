// import { prisma } from "../../../core/db/client";

// export class XenditWebhookService {

//   async handleInvoiceEvent(payload: any) {
//     const { id: invoiceId, status } = payload;

//     // Cari order berdasarkan invoiceId
//     const order = await prisma.order.findFirst({
//       where: { invoiceId }
//     });

//     if (!order) {
//       throw new Error("Order not found for invoice");
//     }

//     switch (status) {
//       case "PAID":
//         return this.handlePaid(order, payload);

//       case "EXPIRED":
//         return this.handleExpired(order);

//       case "VOIDED":
//         return this.handleCancelled(order);

//       default:
//         return { message: "Ignored event" };
//     }
//   }

//   // ===== HANDLERS =====

//   private async handlePaid(order: any, payload: any) {
//     // 1. Update status order
//     const updated = await prisma.order.update({
//       where: { id: order.id },
//       data: {
//         status: "PAID",
//         paidAt: new Date(),
//       },
//     });

//     // 2. Jika promo dipakai, increment usage
//     if (order.promoId) {
//       const clientId = order.clientId;

//       await prisma.promo.update({
//         where: { id: order.promoId },
//         data: { usedCount: { increment: 1 } }
//       });

//       await prisma.promoUsage.create({
//         data: {
//           promoId: order.promoId,
//           clientId,
//         }
//       });
//     }

//     return updated;
//   }

//   private async handleExpired(order: any) {
//     return prisma.order.update({
//       where: { id: order.id },
//       data: { status: "EXPIRED" }
//     });
//   }

//   private async handleCancelled(order: any) {
//     return prisma.order.update({
//       where: { id: order.id },
//       data: { status: "CANCELLED" }
//     });
//   }
// }

// export const xenditWebhookService = new XenditWebhookService();
