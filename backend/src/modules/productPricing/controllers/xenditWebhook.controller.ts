// import { Request, Response } from "express";
// import { xenditWebhookService } from "../services/xenditWebhook.service";

// export class XenditWebhookController {

//   webhook = async (req: Request, res: Response) => {
//     try {
//       const token = req.headers["x-callback-token"];

//       if (token !== process.env.XENDIT_WEBHOOK_TOKEN) {
//         return res.status(403).json({ message: "Invalid token" });
//       }

//       const payload = req.body;

//       await xenditWebhookService.handleInvoiceEvent(payload);

//       return res.json({ success: true });

//     } catch (err: any) {
//       console.error("Webhook Error:", err);
//       return res.status(400).json({ success: false, error: err.message });
//     }
//   };

// }

// export const xenditWebhookController = new XenditWebhookController();
