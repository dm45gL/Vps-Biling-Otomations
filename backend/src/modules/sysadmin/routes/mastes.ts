import { Router } from "express";
import {
  setMasterController,
  unsetMasterController,
  syncMasterTemplatesController,
} from "../controllers/masterHypervisor.controller";

const router = Router();

// Set hypervisor sebagai master
router.post("/set-master/:hypervisorId", setMasterController);

// Unset master di region
router.post("/unset-master/:regionId", unsetMasterController);

// Sinkronisasi template master ke semua hypervisor regional
router.post("/sync-templates/:regionId", syncMasterTemplatesController);

export default router;
