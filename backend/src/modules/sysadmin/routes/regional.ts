import { Router } from "express";
import { RegionController } from "../controllers/region.controller";

const router = Router();

router.post("/", RegionController.create);
router.get("/", RegionController.list);
router.get("/:id", RegionController.get);
router.put("/:id", RegionController.update);
router.delete("/:id", RegionController.delete);

export default router;
