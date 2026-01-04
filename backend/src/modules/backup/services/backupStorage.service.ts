import { prisma } from "../../../core/db/client";
import { BackupProvider, BackupStorageStatus, BackupStorageType } from "@prisma/client";
import { S3Client, HeadBucketCommand, ListObjectsV2Command, ListObjectsV2CommandOutput, _Object } from "@aws-sdk/client-s3";
import { BlobServiceClient, StorageSharedKeyCredential } from "@azure/storage-blob";
import fs from "fs";
import path from "path";

export class BackupStorageService {
  async getAllBackupStorages() {
    return prisma.backupStorage.findMany();
  }

  async getBackupStorageById(id: string) {
    return prisma.backupStorage.findUnique({ where: { id } });
  }

  async createBackupStorage(data: {
    name: string;
    provider: BackupProvider;
    endpoint?: string;
    bucket?: string;
    accessKey?: string;
    secretKey?: string;
    region?: string;
    directory?: string;
    totalSpace?: number;
  }) {
    const primaryExists = await prisma.backupStorage.findFirst({
      where: { storageType: "PRIMARY" }
    });

    const storageType: BackupStorageType = primaryExists ? "SECONDARY" : "PRIMARY";
    const isDefault = !primaryExists;

    if (isDefault) {
      await prisma.backupStorage.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const storage = await prisma.backupStorage.create({
      data: { ...data, storageType, isDefault, status: "INACTIVE" },
    });

    await this.validateAndUpdateStatus(storage.id);

    return this.getBackupStorageById(storage.id);
  }

  async updateBackupStorage(id: string, data: Partial<{
    name: string;
    provider: BackupProvider;
    endpoint: string;
    bucket: string;
    accessKey: string;
    secretKey: string;
    region: string;
    directory: string;
    totalSpace: number;
    isDefault: boolean;
  }>) {
    if (data.isDefault) {
      await prisma.backupStorage.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.backupStorage.update({ where: { id }, data });

    const result = await this.validateAndUpdateStatus(id);

    return { ...updated, ...result };
  }

  async deleteBackupStorage(id: string) {
    return prisma.backupStorage.delete({ where: { id } });
  }

  async setDefaultBackupStorage(id: string) {
    await prisma.backupStorage.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    });

    const updated = await prisma.backupStorage.update({ where: { id }, data: { isDefault: true } });

    const result = await this.validateAndUpdateStatus(id);
    return { ...updated, ...result };
  }

  async enableStorage(id: string) {
    return prisma.backupStorage.update({ where: { id }, data: { status: "ACTIVE" } });
  }

  async disableStorage(id: string) {
    return prisma.backupStorage.update({ where: { id }, data: { status: "INACTIVE" } });
  }

  async validateAndUpdateStatus(id: string) {
    const storage = await prisma.backupStorage.findUnique({ where: { id } });
    if (!storage) return;

    let status: BackupStorageStatus = "INACTIVE";
    const totalSpace = storage.totalSpace || 0;
    let usedSpace = 0;
    let detailError: string | null = null;

    try {
      if (storage.provider === "S3") {
        if (!storage.bucket || !storage.accessKey || !storage.secretKey) throw new Error("Missing S3 config");

        const s3 = new S3Client({
          endpoint: storage.endpoint || undefined,
          credentials: {
            accessKeyId: storage.accessKey,
            secretAccessKey: storage.secretKey
          },
          region: storage.region || undefined
        });

        await s3.send(new HeadBucketCommand({ Bucket: storage.bucket }));
        status = "ACTIVE";

        let continuationToken: string | undefined = undefined;
        do {
          const list: ListObjectsV2CommandOutput = await s3.send(
            new ListObjectsV2Command({
              Bucket: storage.bucket!,
              ContinuationToken: continuationToken
            })
          );

          const contents: _Object[] = list.Contents || [];
          usedSpace += contents.reduce((sum: number, obj: _Object) => sum + (obj.Size || 0), 0);

          continuationToken = list.NextContinuationToken;
        } while (continuationToken);

        usedSpace = Math.floor(usedSpace / (1024 * 1024)); // MB

      } else if (storage.provider === "AZURE") {
        if (!storage.endpoint || !storage.accessKey || !storage.secretKey) throw new Error("Missing Azure config");
        const credential = new StorageSharedKeyCredential(storage.accessKey, storage.secretKey);
        const blobService = new BlobServiceClient(storage.endpoint, credential);

        await blobService.getAccountInfo();
        status = "ACTIVE";

        const containerName = storage.bucket!;
        const containerClient = blobService.getContainerClient(containerName);
        for await (const blob of containerClient.listBlobsFlat()) {
          usedSpace += blob.properties.contentLength || 0;
        }
        usedSpace = Math.floor(usedSpace / (1024 * 1024));

      } else if (storage.provider === "NFS") {
        if (!storage.directory) throw new Error("Missing NFS directory path");
        if (!fs.existsSync(storage.directory)) throw new Error("NFS directory not found");

        status = "ACTIVE";
        usedSpace = await this.getDirectorySize(storage.directory);
      }
    }catch (err: unknown) {
  status = "INACTIVE";
  if (err instanceof Error) {
    detailError = err.message;
  } else {
    detailError = "UnknownError";
  }
  console.error(`Validation failed for storage ${storage.id}: ${detailError}`);
}
    await prisma.backupStorage.update({
      where: { id },
      data: { status, usedSpace, totalSpace }
    });

    return { status, totalSpace, usedSpace, detailError };
  }

  async pickActiveStorage() {
    const primary = await prisma.backupStorage.findFirst({ where: { storageType: "PRIMARY", status: "ACTIVE" } });
    if (primary) return primary;

    const secondary = await prisma.backupStorage.findFirst({ where: { storageType: "SECONDARY", status: "ACTIVE" } });
    return secondary || null;
  }

  private async getDirectorySize(dir: string): Promise<number> {
    let total = 0;

    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      if (stats.isFile()) {
        total += stats.size;
      } else if (stats.isDirectory()) {
        total += await this.getDirectorySize(filePath);
      }
    }

    return Math.floor(total / (1024 * 1024)); // MB
  }
}
