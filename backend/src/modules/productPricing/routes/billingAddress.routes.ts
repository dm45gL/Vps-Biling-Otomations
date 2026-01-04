import { Router } from "express";
import { BillingAddressController } from "../controllers/billingAddress.controller";

const ctrl = new BillingAddressController();
const r = Router();

r.get("/:clientId", ctrl.list);
r.delete("/:clientId/:id", ctrl.delete);

export default r;
