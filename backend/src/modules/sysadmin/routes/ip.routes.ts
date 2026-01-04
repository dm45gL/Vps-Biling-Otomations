import { Router } from "express";
import { IPController } from "../controllers/ip.controller";

const router = Router();
const ctrl = new IPController();

// ─── IP CRUD ───
router.get("/", (req, res) => ctrl.getAll(req, res));       // List semua IP, bisa filter regionId
router.get("/:id", (req, res) => ctrl.getOne(req, res));    // Ambil 1 IP berdasarkan ID

router.post("/", (req, res) => ctrl.create(req, res));      // Tambah 1 IP
router.post("/cidr", (req, res) => ctrl.createFromCIDR(req, res)); // Tambah IP dari CIDR

router.put("/:id", (req, res) => ctrl.update(req, res));    // Update IP
router.delete("/:id", (req, res) => ctrl.delete(req, res)); // Hapus IP

export default router;
