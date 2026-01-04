// import { Request, Response } from "express";
// import { TestProductService } from "../services/TestProductService";

// export class TestProductController {
//   private service: TestProductService;

//   constructor() {
//     // ---- ambil dari env agar production ready ----
//     const host = process.env.PROXMOX_HOST!;
//     const token = process.env.PROXMOX_API_TOKEN!;
//     this.service = new TestProductService(host, token);
//   }

//   // ======================================================
//   // CREATE TEST PRODUCT FROM RAW PRODUCT
//   // ======================================================
//   create = async (req: Request, res: Response) => {
//     try {
//       const { rawProductId, sshUsername, sshPassword } = req.body;

//       if (!rawProductId || !sshUsername || !sshPassword) {
//         return res.status(400).json({
//           success: false,
//           error: "rawProductId, sshUsername, sshPassword are required",
//         });
//       }

//       const data = await this.service.createFromRawProduct(
//         rawProductId,
//         sshUsername,
//         sshPassword
//       );

//       res.json({
//         success: true,
//         message: "Test product created successfully",
//         data,
//       });
//     } catch (err: any) {
//       res.status(500).json({ success: false, error: err.message });
//     }
//   };

//   // ======================================================
//   // GET ALL TEST PRODUCTS
//   // ======================================================
//   getAll = async (_: Request, res: Response) => {
//     try {
//       const data = await this.service.getAll();
//       res.json({ success: true, data });
//     } catch (err: any) {
//       res.status(500).json({ success: false, error: err.message });
//     }
//   };

//   // ======================================================
//   // GET ONE TEST PRODUCT
//   // ======================================================
//   getOne = async (req: Request, res: Response) => {
//     try {
//       const { id } = req.params;

//       const data = await this.service.getById(id);

//       if (!data)
//         return res
//           .status(404)
//           .json({ success: false, error: "TestProduct not found" });

//       res.json({ success: true, data });
//     } catch (err: any) {
//       res.status(500).json({ success: false, error: err.message });
//     }
//   };

//   // ======================================================
//   // START VM
//   // ======================================================
//   start = async (req: Request, res: Response) => {
//     try {
//       const { id } = req.params;

//       const data = await this.service.start(id);

//       res.json({
//         success: true,
//         message: "VM started",
//         data,
//       });
//     } catch (err: any) {
//       res.status(500).json({ success: false, error: err.message });
//     }
//   };

//   // ======================================================
//   // STOP VM
//   // ======================================================
//   stop = async (req: Request, res: Response) => {
//     try {
//       const { id } = req.params;

//       const data = await this.service.stop(id);

//       res.json({
//         success: true,
//         message: "VM stopped",
//         data,
//       });
//     } catch (err: any) {
//       res.status(500).json({ success: false, error: err.message });
//     }
//   };

//   // ======================================================
//   // REBOOT VM
//   // ======================================================
//   reboot = async (req: Request, res: Response) => {
//     try {
//       const { id } = req.params;

//       const data = await this.service.reboot(id);

//       res.json({
//         success: true,
//         message: "VM rebooted",
//         data,
//       });
//     } catch (err: any) {
//       res.status(500).json({ success: false, error: err.message });
//     }
//   };

//   // ======================================================
//   // FORCE SHUTDOWN VM
//   // ======================================================
//   forceShutdown = async (req: Request, res: Response) => {
//     try {
//       const { id } = req.params;

//       const data = await this.service.forceShutdown(id);

//       res.json({
//         success: true,
//         message: "VM force shutdown completed",
//         data,
//       });
//     } catch (err: any) {
//       res.status(500).json({ success: false, error: err.message });
//     }
//   };
// }
