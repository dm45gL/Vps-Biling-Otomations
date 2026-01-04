import { prisma } from "../../../core/db/client";

export class RegionService {
  // CREATE
  static async createRegion(data: { code: string; name: string }) {
    return prisma.region.create({ data });
  }

  // LIST ALL
  static async listRegions() {
    return prisma.region.findMany({ orderBy: { name: "asc" } });
  }

  // GET ONE
  static async getRegion(id: string) {
    return prisma.region.findUnique({ where: { id } });
  }

  // UPDATE
  static async updateRegion(id: string, data: { code?: string; name?: string }) {
    return prisma.region.update({ where: { id }, data });
  }

  // DELETE
  static async deleteRegion(id: string) {
    // Pastikan hypervisor yang pakai region sudah di-handle
    await prisma.hypervisor.updateMany({
      where: { regionId: id },
      data: { regionId: null },
    });

    return prisma.region.delete({ where: { id } });
  }
}
