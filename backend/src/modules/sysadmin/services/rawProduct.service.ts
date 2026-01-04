// src/modules/vps/services/raw-product.service.ts
import { prisma } from "../../../core/db/client";

export class RawProductService {

  // ============================================================
  // CREATE (RAM INPUT MB → SIMPAN MB)
  // ============================================================
  async create(data: {
    name: string;
    cpu: number;
    ram: number; // ✅ INPUT DALAM MB
    disk: number;
    bandwidth: number;
    backupPolicyId?: string | null;
    templateCategoryIds: string[];
  }) {
    const { templateCategoryIds, ram, ...rest } = data;

    if (ram <= 0) {
      throw new Error("RAM must be greater than 0 MB");
    }

    return prisma.rawProduct.create({
      data: {
        ...rest,
        ram, // ✅ SIMPAN LANGSUNG (MB)
        categories: {
          create: templateCategoryIds.map(catId => ({
            templateCategoryId: catId,
          })),
        },
      },
      include: {
        categories: {
          include: { templateCategory: true },
        },
        backupPolicy: true,
      },
    });
  }

  // ============================================================
  // LIST
  // ============================================================
  async list() {
    return prisma.rawProduct.findMany({
      include: {
        categories: { include: { templateCategory: true } },
        backupPolicy: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // ============================================================
  // GET SINGLE
  // ============================================================
  async get(id: string) {
    return prisma.rawProduct.findUnique({
      where: { id },
      include: {
        categories: { include: { templateCategory: true } },
        backupPolicy: true,
      },
    });
  }

  // ============================================================
  // UPDATE (RAM INPUT MB → SIMPAN MB JIKA ADA)
  // ============================================================
  async update(
    id: string,
    data: {
      name?: string;
      cpu?: number;
      ram?: number; // ✅ INPUT DALAM MB
      disk?: number;
      bandwidth?: number;
      backupPolicyId?: string | null;
      templateCategoryIds?: string[];
    }
  ) {
    const { templateCategoryIds, ram, ...rest } = data;

    if (ram !== undefined && ram <= 0) {
      throw new Error("RAM must be greater than 0 MB");
    }

    return prisma.rawProduct.update({
      where: { id },
      data: {
        ...rest,
        ...(ram !== undefined && { ram }), // ✅ TANPA KONVERSI
        categories: templateCategoryIds
          ? {
              deleteMany: {},
              create: templateCategoryIds.map(catId => ({
                templateCategoryId: catId,
              })),
            }
          : undefined,
      },
      include: {
        categories: { include: { templateCategory: true } },
        backupPolicy: true,
      },
    });
  }

  // ============================================================
  // DELETE
  // ============================================================
  async delete(id: string) {
    await prisma.rawProductCategory.deleteMany({
      where: { rawProductId: id },
    });

    return prisma.rawProduct.delete({ where: { id } });
  }
}
