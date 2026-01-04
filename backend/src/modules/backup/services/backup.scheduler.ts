// src/modules/backup/backup.scheduler.ts

import { prisma } from "../../../core/db/client";
import { BackupService } from "./backupPolicy.service";
import cron from "node-cron";
import fs from "fs";
import path from "path";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { BlobServiceClient } from "@azure/storage-blob";
import {  BackupProvider } from "@prisma/client";

const backupSvc = new BackupService();

// =====================
// 1. Cleanup old backup
// =====================
async function cleanupOldBackups() {
  try {
    const now = new Date();

    const histories = await prisma.backupHistory.findMany({
      include: { policy: true, storage: true },
    });

    for (const h of histories) {
      if (!h.policy || !h.storage) continue;

      const retentionMs = h.policy.retentionDays * 24 * 60 * 60 * 1000;
      const expiryDate = new Date(h.createdAt.getTime() + retentionMs);

      if (expiryDate <= now) {
        // delete file from storage
        try {
          const provider: BackupProvider = h.storage.provider as BackupProvider;

          if (provider === "NFS") {
            if (fs.existsSync(h.path)) fs.unlinkSync(h.path);
          } else if (provider === "S3") {
            const s3Client = new S3Client({
              region: h.storage.region!,
              credentials: {
                accessKeyId: h.storage.accessKey!,
                secretAccessKey: h.storage.secretKey!,
              },
            });
            const key = h.path.split(`${h.storage.bucket}/`)[1];
            if (key) {
              const command = new DeleteObjectCommand({
                Bucket: h.storage.bucket!,
                Key: key,
              });
              await s3Client.send(command);
            }
          } else if (provider === "AZURE") {
            const client = BlobServiceClient.fromConnectionString(h.storage.accessKey!);
            const container = client.getContainerClient(h.storage.bucket!);
            const fileName = path.basename(h.path);
            await container.deleteBlob(fileName);
          }
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Unknown error";
          console.error(`Failed to delete file ${h.path}:`, message);
        }

        // delete record from DB
        await prisma.backupHistory.delete({ where: { id: h.id } });
        console.log(`Deleted expired backup: ${h.id}`);
      }
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Cleanup error:", message);
  }
}

// =====================
// 2. Run scheduled backups
// =====================
async function runScheduledBackups() {
  try {
    const policies = await prisma.backupPolicy.findMany({
      where: { cron: { not: null } },
    });

    for (const p of policies) {
      try {
        if (p.cron && cron.validate(p.cron)) {
          cron.schedule(p.cron, async () => {
            try {
              console.log(`Running scheduled backup for policy ${p.id}`);
              await backupSvc.runPortableBackup(p.id);
            } catch (err: unknown) {
              const message = err instanceof Error ? err.message : "Unknown error";
              console.error(`Backup failed for policy ${p.id}:`, message);
            }
          });
        } else {
          console.warn(`Invalid cron expression for policy ${p.id}: ${p.cron}`);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error(`Error scheduling policy ${p.id}:`, message);
      }
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Error fetching policies:", message);
  }
}

// =====================
// 3. Start scheduler
// =====================
async function startScheduler() {
  console.log("Starting backup scheduler...");

  // run cleanup once at start
  await cleanupOldBackups();

  // run cleanup every day at 00:00
  cron.schedule("0 0 * * *", async () => {
    console.log("Running daily cleanup of old backups...");
    await cleanupOldBackups();
  });

  // schedule backups
  await runScheduledBackups();

  console.log("Backup scheduler started");
}

// =====================
// 4. Run
// =====================
startScheduler().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : "Unknown error";
  console.error("Scheduler startup error:", message);
});
