// import { Router } from "express";
// import { PromoUsageController } from "../controllers/promoUsage.controller";
// import { requireRole } from "../../../middleware/role.middleware";
// import { Role } from "../../../core/auth/roles";

// const router = Router();
// const ctrl = new PromoUsageController();

// // ─── Promo Usages ─────────────────────────────
// router.get(
//   "/:id/usages",
//   requireRole([Role.BUSINESS, Role.SYSADMIN]),
//   ctrl.listByPromo
// );

// router.get(
//   "/:id/summary",
//   requireRole([Role.BUSINESS, Role.SYSADMIN]),
//   ctrl.summary
// );

// router.get(
//   "/:id/log/download",
//   requireRole([Role.BUSINESS, Role.SYSADMIN]),
//   ctrl.downloadCsvLog
// );

// // ─── Auto Delete Old Usages ───────────────────
// // Bisa dipanggil cron job, atau manual trigger
// router.post(
//   "/auto-delete",
//   requireRole([Role.SYSADMIN]), // hanya SYSADMIN bisa trigger manual
//   ctrl.autoDeleteOldUsages
// );

// export default router;



import { Router } from "express";
import { PromoUsageController } from "../controllers/promoUsage.controller";

const router = Router();
const ctrl = new PromoUsageController();

// ─── Promo Usages ─────────────────────────────
router.get("/:id/usages", ctrl.listByPromo);
router.get("/:id/summary", ctrl.summary);
router.get("/:id/log/download", ctrl.downloadCsvLog);

// ─── Auto Delete Old Usages ───────────────────
// Bisa dipanggil cron job, atau manual trigger
router.post("/auto-delete", ctrl.autoDeleteOldUsages);

export default router;
