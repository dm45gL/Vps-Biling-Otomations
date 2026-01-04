import { Router } from "express";
import { getPaymentStatus } from "../controllers/order.controller";

const router = Router();

// GET payment status
router.get("/:orderId/payment-status", getPaymentStatus);

export default router;
