import { Router } from "express";
import { PromoController } from "../controllers/promo.controller";
import { authenticate } from "../../../middleware/auth.middleware";
import { requireRole } from "../../../middleware/role.middleware";
import { Role } from "../../../core/auth/roles";

const router = Router();
const ctrl = new PromoController();

/////////////////////////////////////////
// ADMIN (BUSINESS) – CRUD PROMO
/////////////////////////////////////////

router.post(
  "/",
  authenticate,
  requireRole([Role.BUSINESS]),
  ctrl.create
);

router.get(
  "/",
  authenticate,
  requireRole([Role.BUSINESS]),
  ctrl.list
);

router.get(
  "/:id",
  authenticate,
  requireRole([Role.BUSINESS]),
  ctrl.getById
);

router.put(
  "/:id",
  authenticate,
  requireRole([Role.BUSINESS]),
  ctrl.update
);

router.delete(
  "/:id",
  authenticate,
  requireRole([Role.BUSINESS]),
  ctrl.delete
);

/////////////////////////////////////////
// CLIENT – PROMO FLOW
/////////////////////////////////////////

router.post(
  "/validate",
  authenticate,
  requireRole([Role.CLIENT]),
  ctrl.validatePromo
);

router.post(
  "/:id/use",
  authenticate,
  requireRole([Role.CLIENT]),
  ctrl.usePromo
);

export default router;
