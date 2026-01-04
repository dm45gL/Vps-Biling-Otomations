import { Router } from "express";
import {
  createBackupStorage,
  getAllBackupStorages,
  getBackupStorageById,
  updateBackupStorage,
  deleteBackupStorage,
  setDefaultBackupStorage,
  validateStorage,
  enableStorage,
  disableStorage
} from "../controllers/backupStorage.controller";

const router = Router();

router.post("/", createBackupStorage);
router.get("/", getAllBackupStorages);
router.get("/:id", getBackupStorageById);
router.put("/:id", updateBackupStorage);
router.delete("/:id", deleteBackupStorage);

router.post("/:id/default", setDefaultBackupStorage);
router.post("/:id/validate", validateStorage);
router.post("/:id/enable", enableStorage);
router.post("/:id/disable", disableStorage);

export default router;
