import { Router } from "express";
import { PublicProductController } from "./controllers/publicProduct.controller";

const router = Router();
const ctrl = new PublicProductController();

// ─── Admin Routes ───────────────────────────
// Admin routes dulu supaya tidak ketemu route client yang dinamis
router.post("/", ctrl.create);
router.get("/admin/all", ctrl.listAdmin);
router.get("/admin/:id", ctrl.getDetailAdmin);
router.patch("/:id", ctrl.update);
router.patch("/:id/active", ctrl.setActive);
router.delete("/:id", ctrl.delete);

// ─── Client Routes ──────────────────────────
router.get("/", ctrl.listActiveClient);
router.get("/:publicId", ctrl.getDetailClient);

export default router;
