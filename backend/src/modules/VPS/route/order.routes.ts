import { Router } from "express"
import { OrderController } from "../controller/order.controller"

const router = Router()

// ambil semua order milik client
router.get("/:clientId", OrderController.getClientOrders)

export default router



// import { Router } from "express";
// import { OrderController } from "../controller/order.controller";
// import { authenticate } from "../../../middleware/auth.middleware";
// import { requireRole } from "../../../middleware/role.middleware";
// import { Role } from "../../../core/auth/roles";

// const router = Router();

// // Ambil semua order milik client, hanya bisa diakses oleh SYSADMIN atau ADMIN
// router.get(
//   "/:clientId",
//   authenticate,
//   requireRole([Role.SYSADMIN, Role.CLIENT]), // contoh role yang diizinkan
//   OrderController.getClientOrders
// );

// export default router;
