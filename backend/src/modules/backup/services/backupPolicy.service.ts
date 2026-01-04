import { prisma } from "../../../core/db/client";
import fs from "fs";
import path from "path";
import { exec, spawn } from "child_process";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { BlobServiceClient } from "@azure/storage-blob";

const TMP_DIR = "/tmp";

export interface BackupStorage {
  id: string;
  provider: "NFS" | "S3" | "AZURE";
  directory?: string; // NFS
  accessKey?: string; // S3 / AZURE
  secretKey?: string; // S3
  region?: string; // S3
  bucket?: string; // S3 / AZURE
  isDefault?: boolean;
  isActive?: boolean;
}
export class BackupService {
  // execute shell
  execShell(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      exec(command, (err, stdout, stderr) => {
        if (err) {
          reject(new Error(stderr || err.message)); // ✅ Always reject with an Error object
        } else {
          resolve(stdout);
        }
      });
    });
  }


  // get default storage
  async getDefaultStorage(): Promise<BackupStorage> {
    const s = await prisma.backupStorage.findFirst({
      where: { isDefault: true, isActive: true },
    });
    if (!s) throw new Error("Default storage unavailable");

    // convert null → undefined untuk TypeScript
    return {
      ...s,
      directory: s.directory ?? undefined,
      accessKey: s.accessKey ?? undefined,
      secretKey: s.secretKey ?? undefined,
      region: s.region ?? undefined,
      bucket: s.bucket ?? undefined,
    };
  }

  // quota check (GB → bytes)
  async validateQuota(policyId: string) {
    const policy = await prisma.backupPolicy.findUnique({
      where: { id: policyId },
    });
    if (!policy) throw new Error("Policy not found");

    const maxBytes = (policy.maxStorageGB ?? 0) * 1024 ** 3;

    const agg = await prisma.backupHistory.aggregate({
      where: { policyId },
      _sum: { sizeBytes: true },
    });

    if ((agg._sum.sizeBytes ?? 0) >= maxBytes) {
      throw new Error("Backup quota exceeded");
    }
  }

  // daily limit check
  async validateDailyLimit(policyId: string) {
    const policy = await prisma.backupPolicy.findUnique({
      where: { id: policyId },
    });
    if (!policy) throw new Error("Policy not found");

    const last24 = new Date(Date.now() - 1000 * 60 * 60 * 24);
    const count = await prisma.backupHistory.count({
      where: { policyId, createdAt: { gte: last24 } },
    });

    if (count >= (policy.maxDailyBackup ?? 0)) {
      throw new Error("Daily backup limit reached");
    }
  }

  // tar listing
  listTarEntries(archive: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const tar = spawn("tar", ["-tzf", archive]);
      const entries: string[] = [];

      tar.stdout.on("data", (data: Buffer) => {
        entries.push(...data.toString().split("\n").filter(Boolean));
      });

      tar.on("close", () => resolve(entries));
      tar.on("error", reject);
    });
  }

  // tar extraction size
  getTarExtractSize(archive: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const tar = spawn("tar", ["-tzvf", archive]);
      let total = 0;

      tar.stdout.on("data", (data: Buffer) => {
        const parts = data.toString().split(/\s+/);
        total += Number(parts[2]) || 0;
      });

      tar.on("close", () => resolve(total));
      tar.on("error", reject);
    });
  }

  validateTarPaths(entries: string[]) {
    for (const e of entries) {
      if (e.startsWith("/") || e.includes("../")) {
        throw new Error("Invalid path inside tar archive");
      }
    }
  }

  validateAllowedStructure(entries: string[]) {
    const allowed = ["app/", "env", "database.sql", "config/"];
    for (const e of entries) {
      if (!allowed.some((p) => e.startsWith(p))) {
        throw new Error(`Forbidden entry: ${e}`);
      }
    }
  }

  // validate upload
  async validateBackupUpload(file: Express.Multer.File) {
    if (!file.originalname.endsWith(".tar.gz"))
      throw new Error("Only .tar.gz allowed");

    if (file.size > 2_000_000_000)
      throw new Error("Upload too large (2GB max)");

    const entries = await this.listTarEntries(file.path);
    this.validateTarPaths(entries);
    this.validateAllowedStructure(entries);

    const extractSize = await this.getTarExtractSize(file.path);
    if (extractSize > 10_000_000_000)
      throw new Error("Extracted size too large (>10GB)");

    return true;
  }

  // upload to storage
  async uploadToStorage(
    storage: BackupStorage,
    localPath: string,
    fileName: string
  ): Promise<string> {
    switch (storage.provider) {
      case "NFS": {
        const target = path.join(storage.directory!, fileName);
        fs.copyFileSync(localPath, target);
        return target;
      }

      case "S3": {
        if (!storage.bucket || !storage.accessKey || !storage.secretKey || !storage.region) {
          throw new Error("Incomplete S3 configuration");
        }

        const s3Client = new S3Client({
          region: storage.region,
          credentials: {
            accessKeyId: storage.accessKey,
            secretAccessKey: storage.secretKey,
          },
        });

        await s3Client.send(
          new PutObjectCommand({
            Bucket: storage.bucket,
            Key: fileName,
            Body: fs.createReadStream(localPath),
          })
        );

        return `s3://${storage.bucket}/${fileName}`;
      }

      case "AZURE": {
        if (!storage.bucket || !storage.accessKey) {
          throw new Error("Incomplete Azure configuration");
        }

        const client = BlobServiceClient.fromConnectionString(storage.accessKey);
        const container = client.getContainerClient(storage.bucket);
        const blob = container.getBlockBlobClient(fileName);

        await blob.uploadFile(localPath);
        return `azure://${storage.bucket}/${fileName}`;
      }

      default:
        throw new Error("Unknown storage provider");
    }
  }

  // store uploaded backup
  async storeUploadedBackup(file: Express.Multer.File, policyId?: string) {
    const storage = await this.getDefaultStorage();
    const name = `upload-${Date.now()}-${file.originalname}`;
    const finalPath = await this.uploadToStorage(storage, file.path, name);

    return prisma.backupHistory.create({
      data: {
        policyId: policyId ?? undefined,
        storageId: storage.id,
        path: finalPath,
        sizeBytes: file.size,
        status: "UPLOADED",
      },
    });
  }

  // run portable backup
  async runPortableBackup(policyId: string) {
    await this.validateQuota(policyId);
    await this.validateDailyLimit(policyId);

    const storage = await this.getDefaultStorage();
    const name = `backup-${policyId}-${Date.now()}.tar.gz`;
    const output = `${TMP_DIR}/${name}`;

    await this.execShell(`mysqldump -u root appdb > ${TMP_DIR}/database.sql`);
    await this.execShell(`cp -r /var/www/app ${TMP_DIR}/app`);
    await this.execShell(`cp /var/www/app/.env ${TMP_DIR}/env`);
    await this.execShell(`tar -czf ${output} -C ${TMP_DIR} app env database.sql`);

    const stats = fs.statSync(output);
    const finalPath = await this.uploadToStorage(storage, output, name);

    return prisma.backupHistory.create({
      data: {
        policyId,
        storageId: storage.id,
        path: finalPath,
        sizeBytes: stats.size,
        status: "SUCCESS",
      },
    });
  }

  // get backup by history ID
  async getBackupFile(historyId: string) {
    return prisma.backupHistory.findUnique({
      where: { id: historyId },
      include: { storage: true },
    });
  }
}
