// src/modules/checkout/routes/checkout.routes.ts
import { Router } from "express";
import { CheckoutController } from "../controllers/checkout.controller";
import { authenticate } from "../../../middleware/auth.middleware";

const router = Router();
const controller = new CheckoutController();


router.post("/preview",authenticate,controller.preview);


export default router;
