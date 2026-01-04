import { Request, Response } from "express";
import { BackupStorageService } from "../services/backupStorage.service";
import { BackupProvider } from "@prisma/client";

const service = new BackupStorageService();

/* ─────────────────────────────
   CREATE BACKUP STORAGE
──────────────────────────────── */
export const createBackupStorage = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const storage = await service.createBackupStorage({
      name: data.name,
      provider: data.provider as BackupProvider,
      endpoint: data.endpoint,
      bucket: data.bucket,
      accessKey: data.accessKey,
      secretKey: data.secretKey,
      region: data.region,
      directory: data.directory,
      totalSpace: data.totalSpace,
    });

    res.status(201).json({ success: true, data: storage });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create storage";
    res.status(500).json({ success: false, error: message });
  }
};

/* ─────────────────────────────
   GET ALL STORAGE
──────────────────────────────── */
export const getAllBackupStorages = async (_req: Request, res: Response) => {
  try {
    const storages = await service.getAllBackupStorages();
    res.json({ success: true, data: storages });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch backup storages";
    res.status(500).json({ success: false, error: message });
  }
};

/* ─────────────────────────────
   GET STORAGE BY ID
──────────────────────────────── */
export const getBackupStorageById = async (req: Request, res: Response) => {
  try {
    const storage = await service.getBackupStorageById(req.params.id);
    if (!storage) return res.status(404).json({ success: false, error: "Backup storage not found" });
    res.json({ success: true, data: storage });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch backup storage";
    res.status(500).json({ success: false, error: message });
  }
};

/* ─────────────────────────────
   UPDATE STORAGE
──────────────────────────────── */
export const updateBackupStorage = async (req: Request, res: Response) => {
  try {
    const updated = await service.updateBackupStorage(req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, error: "Backup storage not found" });

    res.json({ success: true, data: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update backup storage";
    res.status(500).json({ success: false, error: message });
  }
};

/* ─────────────────────────────
   DELETE STORAGE
──────────────────────────────── */
export const deleteBackupStorage = async (req: Request, res: Response) => {
  try {
    await service.deleteBackupStorage(req.params.id);
    res.json({ success: true, message: "Backup storage deleted successfully" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete backup storage";
    res.status(500).json({ success: false, error: message });
  }
};

/* ─────────────────────────────
   SET DEFAULT STORAGE
──────────────────────────────── */
export const setDefaultBackupStorage = async (req: Request, res: Response) => {
  try {
    const storage = await service.setDefaultBackupStorage(req.params.id);
    res.json({ success: true, data: storage });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to set default storage";
    res.status(500).json({ success: false, error: message });
  }
};

/* ─────────────────────────────
   ENABLE STORAGE
──────────────────────────────── */
export const enableStorage = async (req: Request, res: Response) => {
  try {
    const storage = await service.enableStorage(req.params.id);
    res.json({ success: true, data: storage });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to enable storage";
    res.status(500).json({ success: false, error: message });
  }
};

/* ─────────────────────────────
   DISABLE STORAGE
──────────────────────────────── */
export const disableStorage = async (req: Request, res: Response) => {
  try {
    const storage = await service.disableStorage(req.params.id);
    res.json({ success: true, data: storage });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to disable storage";
    res.status(500).json({ success: false, error: message });
  }
};

/* ─────────────────────────────
   VALIDATE STORAGE
──────────────────────────────── */
export const validateStorage = async (req: Request, res: Response) => {
  try {
    const result = await service.validateAndUpdateStatus(req.params.id);
    res.json({ success: true, data: result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Validation failed";
    res.status(500).json({ success: false, error: message });
  }
};

/* ─────────────────────────────
   PICK ACTIVE STORAGE (Primary first, then secondary)
──────────────────────────────── */
export const pickStorageForBackup = async (_req: Request, res: Response) => {
  try {
    const storage = await service.pickActiveStorage();
    if (!storage) return res.status(404).json({ success: false, error: "No active storage found" });

    res.json({ success: true, data: storage });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to pick storage";
    res.status(500).json({ success: false, error: message });
  }
};
