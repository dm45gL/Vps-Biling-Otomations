import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../../../core/db/client";
import { BackupService } from "../services/backupPolicy.service";

export class BackupController {
  private svc = new BackupService();

  // DTO
  createPolicySchema = z.object({
    name: z.string(),
    cron: z.string().optional().nullable(),
    retentionDays: z.number(),
    isSystem: z.boolean().optional(),
    maxStorageGB: z.number(), // quota dalam GB
    maxDailyBackup: z.number(),
  });

  updatePolicySchema = this.createPolicySchema.partial();

  // CREATE policy
  createPolicy = async (req: Request, res: Response) => {
    try {
      const dto = this.createPolicySchema.parse(req.body);
      const result = await prisma.backupPolicy.create({ data: dto });
      res.status(201).json({ success: true, data: result });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      res.status(400).json({ success: false, error: message });
    }
  };

  // UPDATE policy
  updatePolicy = async (req: Request, res: Response) => {
    try {
      const dto = this.updatePolicySchema.parse(req.body);
      const result = await prisma.backupPolicy.update({
        where: { id: req.params.id },
        data: dto,
      });
      res.json({ success: true, data: result });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      res.status(400).json({ success: false, error: message });
    }
  };

  // LIST policies
  listPolicies = async (_req: Request, res: Response) => {
    const list = await prisma.backupPolicy.findMany();
    res.json({ success: true, data: list });
  };

  // DELETE policy
  deletePolicy = async (req: Request, res: Response) => {
    await prisma.backupPolicy.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  };

  // RUN BACKUP
  runBackup = async (req: Request, res: Response) => {
    try {
      const result = await this.svc.runPortableBackup(req.params.policyId);
      res.json({ success: true, data: result });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      res.status(400).json({ success: false, error: message });
    }
  };

  // UPLOAD BACKUP
  uploadBackup = async (req: Request, res: Response) => {
    try {
      if (!req.file)
        return res.status(400).json({ error: "File is required" });

      await this.svc.validateBackupUpload(req.file);

      const result = await this.svc.storeUploadedBackup(
        req.file,
        req.body.policyId
      );

      res.json({ success: true, data: result });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      res.status(400).json({ success: false, error: message });
    }
  };

  // DOWNLOAD BACKUP
  downloadBackup = async (req: Request, res: Response) => {
    try {
      const record = await this.svc.getBackupFile(req.params.id);
      if (!record) return res.status(404).json({ error: "Backup not found" });

      res.json({
        success: true,
        provider: record.storage.provider,
        path: record.path,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      res.status(400).json({ success: false, error: message });
    }
  };
}
