import { Router } from "express";
import { ProductPricingController } from "../controllers/productPricing.controller";

const router = Router();
const c = new ProductPricingController();

router.post("/batch", c.createBatch);
router.get("/:rawProductId", c.listByProduct);
router.patch("/:id", c.update);
router.delete("/:id", c.delete);

export default router;
