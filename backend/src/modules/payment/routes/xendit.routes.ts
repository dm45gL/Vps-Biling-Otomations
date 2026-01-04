import { Router } from 'express';
import { xenditWebhook } from '../controllers/xendit-webhook.controller'; 

const router = Router();

// Endpoint untuk menerima webhook Xendit
router.post('/xendit/invoice', xenditWebhook);

export default router;
