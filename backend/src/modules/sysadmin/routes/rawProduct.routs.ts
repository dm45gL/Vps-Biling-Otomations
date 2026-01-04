
import { RawProductController } from "../controllers/rawProduct.controller";


import { Router } from "express";
import { authenticate } from "../../../middleware/auth.middleware";
import { requireRole } from "../../../middleware/role.middleware";
import { Role } from "../../../core/auth/roles";



const router = Router();
const ctrl = new RawProductController();

router.post("/", authenticate, requireRole([Role.SYSADMIN, Role.BUSINESS]), ctrl.create);
router.get("/", authenticate, requireRole([Role.SYSADMIN, Role.BUSINESS]), ctrl.list);
router.get("/:id", authenticate, requireRole([Role.SYSADMIN, Role.BUSINESS]), ctrl.get);
router.put("/:id", authenticate, requireRole([Role.SYSADMIN, Role.BUSINESS]), ctrl.update);
router.delete("/:id", authenticate, requireRole([Role.SYSADMIN]), ctrl.delete);

export default router;
