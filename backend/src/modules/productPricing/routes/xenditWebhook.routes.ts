import { Router } from "express";
import { XenditWebhookController } from "../controllers/xenditWebhook.controller";

const router = Router();
const controller = new XenditWebhookController();

/**
 * Webhook Xendit Invoice
 * POST /webhooks/xendit/invoice
 */
router.post("/xendit/invoice", controller.webhook);

export default router;
