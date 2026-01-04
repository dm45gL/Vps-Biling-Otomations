import { prisma } from "../../../core/db/client";

export class OrderService {
  async getPaymentStatus(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        externalId: true,
        status: true,
        paidAt: true,
        finalPrice: true,
        invoiceId: true,
        invoiceUrl: true,
        invoiceExpired: true,
        createdAt: true,
      },
    });

    if (!order) {
      throw new Error("ORDER_NOT_FOUND");
    }

    return {
      orderId: order.id,
      externalId: order.externalId,
      status: order.status,
      paidAt: order.paidAt,
      amount: order.finalPrice,
      invoice: {
        id: order.invoiceId,
        url: order.invoiceUrl,
        expiredAt: order.invoiceExpired,
      },
      createdAt: order.createdAt,
    };
  }
}
