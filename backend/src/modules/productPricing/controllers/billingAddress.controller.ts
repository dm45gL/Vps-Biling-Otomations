import { Request, Response } from "express";
import { BillingAddressService } from "../services/billingAddress.service";
import { z } from "zod";

const service = new BillingAddressService();

export class BillingAddressController {

  createSchema = z.object({
    clientId: z.string(),
    email: z.string().email(),
    fullName: z.string(),
    companyName: z.string().optional(),
    country: z.string(),
    state: z.string(),
    city: z.string(),
    addressLine1: z.string(),
    addressLine2: z.string().optional(),
    postalCode: z.string(),
    phone: z.string(),
  });

  create = async (req: Request, res: Response) => {
    try {
      const dto = this.createSchema.parse(req.body);
      const data = await service.create(dto.clientId, dto);
      res.json({ success: true, data });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      res.status(400).json({ success: false, error: message });
    }
  };

  list = async (req: Request, res: Response) => {
    try {
      const { clientId } = req.params;
      const data = await service.list(clientId);
      res.json({ success: true, data });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      res.status(400).json({ success: false, error: message });
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      const { clientId, id } = req.params;
      await service.delete(clientId, id);
      res.json({ success: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      res.status(400).json({ success: false, error: message });
    }
  };
}
