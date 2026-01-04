import { Router } from "express";
import { authenticate } from "../../../middleware/auth.middleware";
import { requireRole } from "../../../middleware/role.middleware";
import { Role } from "../../../core/auth/roles";
import { OrderController } from "../controllers/order.controller";

const router = Router();
const controller = new OrderController();


router.post(
  "/",
  authenticate,
  requireRole([Role.CLIENT]),
  controller.create
);

export default router;
