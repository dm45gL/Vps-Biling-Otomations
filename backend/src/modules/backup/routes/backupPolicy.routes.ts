import express from "express";
import multer from "multer";
import { BackupController } from "../controllers/backupPolicy.controller";

const upload = multer({ dest: "/tmp/uploads" });
const controller = new BackupController();
const router = express.Router();

router.post("/policies", controller.createPolicy);
router.get("/policies", controller.listPolicies);
router.put("/policies/:id", controller.updatePolicy);
router.delete("/policies/:id", controller.deletePolicy);

router.post("/backup/:policyId/run", controller.runBackup);

router.post("/upload", upload.single("file"), controller.uploadBackup);

router.get("/download/:id", controller.downloadBackup);

export default router;
