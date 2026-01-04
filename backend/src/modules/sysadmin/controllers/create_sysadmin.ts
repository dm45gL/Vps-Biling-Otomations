import { Request, Response } from "express";
import { prisma } from "../../../core/db/client";
import { hashPassword } from "../../../core/utils/bcrypt";
import { createUserSchema } from "../dto/auth.dto";

// ─── CREATE FIRST SYSADMIN (SETUP AWAL) ─────────────────
export const createFirstSysadmin = async (req: Request, res: Response) => {
  try {
    // Cek apakah sudah ada admin
    const existingAdmin = await prisma.admin.findFirst({});
    if (existingAdmin) {
      return res.status(400).json({ error: "Admin already exists" });
    }

    // Validasi request body
    const parse = createUserSchema.safeParse(req.body);
    if (!parse.success)
      return res
        .status(400)
        .json({ error: "Validation failed", details: parse.error.format() });

    const { email, password, username } = parse.data;
    const hashed = await hashPassword(password);

    // Buat admin pertama
    const admin = await prisma.admin.create({
      data: {
        email,
        password: hashed,
        role: "SYSADMIN",
        username: username || `admin_${Date.now()}`, // default unik jika kosong
      },
    });

    return res.status(201).json({ message: "First sysadmin created", admin });
  } catch (err: any) {
    if (err.code === "P2002") {
      return res
        .status(400)
        .json({ error: "Email or username already exists" });
    }
    return res.status(500).json({ error: "Failed to create first sysadmin" });
  }
};
