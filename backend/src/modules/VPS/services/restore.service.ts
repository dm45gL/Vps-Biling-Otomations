// src/modules/vps/services/restore.service.ts
import { prisma } from "../../../core/db/client";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import AWS from "aws-sdk";
import { BlobServiceClient } from "@azure/storage-blob";
import { pipeline } from "stream/promises";

const TMP = "/tmp/restore";

interface Storage {
  provider: "NFS" | "S3" | "AZURE";
  path?: string;
  bucket?: string;
  accessKey?: string;
  secretKey?: string;
  region?: string;
}

interface BackupRecord {
  id: string;
  path: string;
  storage: Storage;
}

export class RestoreService {
  execShell(cmd: string): Promise<void> {
    return new Promise((resolve, reject) => {
      exec(cmd, (err) => (err ? reject(err) : resolve()));
    });
  }

  async downloadBackup(record: BackupRecord, target: string) {
    const { storage } = record;

    if (storage.provider === "NFS") {
      fs.copyFileSync(record.path!, target);
      return;
    }

    if (storage.provider === "S3") {
      const s3 = new AWS.S3({
        accessKeyId: storage.accessKey!,
        secretAccessKey: storage.secretKey!,
        region: storage.region,
      });

      const key = record.path!.split(`${storage.bucket}/`)[1];
      const readStream = s3
        .getObject({ Bucket: storage.bucket!, Key: key! })
        .createReadStream();

      const writeStream = fs.createWriteStream(target);

      // Gunakan pipeline untuk tipe aman dan proper error handling
      await pipeline(readStream, writeStream);

      return;
    }

    if (storage.provider === "AZURE") {
      const client = BlobServiceClient.fromConnectionString(storage.accessKey!);
      const container = client.getContainerClient(storage.bucket!);
      const blob = container.getBlobClient(path.basename(record.path!));
      await blob.downloadToFile(target);
    }
  }

  async restore(vpsId: string, backupId: string) {
    const backup = await prisma.backupHistory.findUnique({
      where: { id: backupId },
      include: { storage: true },
    });

    if (!backup) throw new Error("Backup not found");

    fs.mkdirSync(TMP, { recursive: true });
    const archive = path.join(TMP, `${backup.id}.tar.gz`);

    await this.downloadBackup(backup as unknown as BackupRecord, archive);

    // extract
    await this.execShell(`tar -xzf ${archive} -C ${TMP}`);

    // restore APP
    if (fs.existsSync(`${TMP}/app`)) {
      await this.execShell(`rm -rf /var/www/app`);
      await this.execShell(`cp -r ${TMP}/app /var/www/app`);
    }

    // restore ENV
    if (fs.existsSync(`${TMP}/env`)) {
      await this.execShell(`cp ${TMP}/env /var/www/app/.env`);
    }

    // restore DB
    if (fs.existsSync(`${TMP}/database.sql`)) {
      await this.execShell(`mysql appdb < ${TMP}/database.sql`);
    }

    await prisma.backupHistory.update({
      where: { id: backup.id },
      data: { status: "RESTORED", vpsId },
    });

    return { success: true };
  }
}
