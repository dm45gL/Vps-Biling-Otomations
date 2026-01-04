// src/modules/order/controllers/xendit.webhook.controller.ts
import { Request, Response } from 'express';
import { prisma } from "../../../core/db/client";
import { ProvisioningService } from "../../VPS/services/provision.service";

export const xenditWebhook = async (req: Request, res: Response) => {
  try {
    // 1️⃣ SECURITY CHECK
    const callbackToken = req.headers['x-callback-token'];
    if (callbackToken !== process.env.XENDIT_CALLBACK_TOKEN) {
      return res.status(401).send('Invalid callback token');
    }

    const payload = req.body;
    console.log('XENDIT WEBHOOK:', JSON.stringify(payload, null, 2));

    const handlePaidOrder = async (order: any) => {
      // Update order status
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'PAID', paidAt: new Date() },
      });

      // ✅ Catat promo usage jika ada promo
      if (order.promoId) {
        await prisma.promoUsage.create({
          data: {
            promoId: order.promoId,
            clientId: order.clientId,
            orderId: order.id,
            usedAt: new Date(),
          },
        });

        // Update counter di promo
        await prisma.promo.update({
          where: { id: order.promoId },
          data: { usedCount: { increment: 1 } },
        });
      }

      // Trigger provisioning VPS
      try {
        const provisioningService = new ProvisioningService();
        await provisioningService.provisionFromOrder(order.id);
      } catch (err) {
        console.error('Provisioning Error:', err);
        // opsional: rollback atau tandai error
      }
    };

    /**
     * INVOICE WEBHOOK
     */
    if (payload.external_id && payload.status) {
      const { external_id, status, amount, paid_at } = payload;

      const order = await prisma.order.findUnique({
        where: { externalId: external_id },
      });

      if (!order) return res.status(404).send('Order not found');

      // Idempotent
      if (order.status === 'PAID') return res.status(200).send('Already paid');

      if (status === 'PAID') {
        if (amount !== order.finalPrice) return res.status(400).send('Amount mismatch');

        await handlePaidOrder(order);
        return res.status(200).send('PAID OK');
      }

      if (status === 'EXPIRED') {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: 'EXPIRED' },
        });
        return res.status(200).send('EXPIRED OK');
      }

      return res.status(200).send('Ignored');
    }

    /**
     * VIRTUAL ACCOUNT WEBHOOK
     */
    if (payload.callback_virtual_account_id && payload.external_id) {
      const { external_id, amount } = payload;

      const order = await prisma.order.findUnique({
        where: { externalId: external_id },
      });

      if (!order) return res.status(404).send('Order not found');
      if (order.status === 'PAID') return res.status(200).send('Already paid');
      if (amount !== order.finalPrice) return res.status(400).send('Amount mismatch');

      await handlePaidOrder(order);
      return res.status(200).send('VA PAID OK');
    }

    return res.status(200).send('Unhandled payload');
  } catch (err) {
    console.error('Xendit Webhook Error:', err);
    return res.status(500).send('Server error');
  }
};

