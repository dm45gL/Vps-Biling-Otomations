import { Router } from "express";
import { authenticate } from "../../../middleware/auth.middleware";
import { requireRole } from "../../../middleware/role.middleware";
import { Role } from "../../../core/auth/roles";

import { 
  createHypervisor,
  getAllHypervisors,
  getHypervisorById,
  updateHypervisor,
  deleteHypervisor,
  testProxmoxConnection,
  getHypervisorStats,
  syncHypervisorTemplatesController,
  getHypervisorTemplatesController,

} from "../controllers/proxmox.controller";

import { 
  createGroup, 
  assignTemplate, 
  unassignTemplate,
  listGroups,
  deleteGroup,
  createCategory,
  listCategories,
  deleteCategory,
  assignGroupToCategory,
  unassignGroupFromCategory
} from "../controllers/templateGroup.controller";

const router = Router();

// ──────────────────────────────
// CRUD HYPERVISOR (protected)
// ──────────────────────────────
router.post("/", authenticate, requireRole([Role.SYSADMIN]), createHypervisor);
router.get("/", authenticate, requireRole([Role.SYSADMIN]), getAllHypervisors);
router.get("/:id", authenticate, requireRole([Role.SYSADMIN]), getHypervisorById);
router.put("/:id", authenticate, requireRole([Role.SYSADMIN]), updateHypervisor);
router.delete("/:id", authenticate, requireRole([Role.SYSADMIN]), deleteHypervisor);

// ──────────────────────────────
// Hypervisor Utilities / Monitoring
// ──────────────────────────────
router.get("/:hypervisorId/test", authenticate, requireRole([Role.SYSADMIN]), testProxmoxConnection);
router.get("/vms/:hypervisorId", authenticate, requireRole([Role.SYSADMIN]), getHypervisorStats);

// ──────────────────────────────
// Template Routes
// ──────────────────────────────
router.post("/:hypervisorId/sync-templates", authenticate, requireRole([Role.SYSADMIN]), syncHypervisorTemplatesController);
router.get("/:hypervisorId/templates", authenticate, requireRole([Role.SYSADMIN]), getHypervisorTemplatesController);

// ──────────────────────────────
// Template Group
// ──────────────────────────────
router.post("/templates/groups", authenticate, requireRole([Role.SYSADMIN]), createGroup);
router.get("/templates/groups", authenticate, requireRole([Role.SYSADMIN]), listGroups);
router.delete("/templates/groups/:groupId", authenticate, requireRole([Role.SYSADMIN]), deleteGroup);

// ──────────────────────────────
// Template Assignment
// ──────────────────────────────
router.post("/templates/assign", authenticate, requireRole([Role.SYSADMIN]), assignTemplate);
router.post("/templates/unassign", authenticate, requireRole([Role.SYSADMIN]), unassignTemplate);

// ──────────────────────────────
// Template Category
// ──────────────────────────────
router.post("/templates/categories", authenticate, requireRole([Role.SYSADMIN]), createCategory);
router.get("/templates/categories", authenticate, requireRole([Role.SYSADMIN]), listCategories);
router.delete("/templates/categories/:categoryId", authenticate, requireRole([Role.SYSADMIN]), deleteCategory);

// ──────────────────────────────
// Assign/Unassign Group to Category
// ──────────────────────────────
router.post("/templates/categories/assign-group", authenticate, requireRole([Role.SYSADMIN]), assignGroupToCategory);
router.post("/templates/categories/unassign-group", authenticate, requireRole([Role.SYSADMIN]), unassignGroupFromCategory);

// ──────────────────────────────
// MASTER HYPERVISOR
// ──────────────────────────────

export default router;
