// import { prisma } from "../../../core/db/client";
// import { getHypervisorService } from "./hypervisor.factory";
// import { decryptToken } from "../../../core/utils/encrypt";
// import { saveTemplatesToDB } from "./saveTemplatesToDB";

// export class MasterHypervisorService {
//   /**
//    * Ambil hypervisor master per region
//    */
//   static async getMasterByRegion(regionId: string) {
//     return prisma.hypervisor.findFirst({
//       where: { regionId, isMaster: true },
//     });
//   }

//   /**
//    * Set hypervisor sebagai master
//    * Hanya 1 master per region
//    */
//   static async setMaster(hypervisorId: string) {
//     const hv = await prisma.hypervisor.findUnique({ where: { id: hypervisorId } });
//     if (!hv) throw new Error("Hypervisor not found");

//     // Reset master sebelumnya di region yang sama
//     await prisma.hypervisor.updateMany({
//       where: { regionId: hv.regionId },
//       data: { isMaster: false },
//     });

//     // Set hypervisor baru sebagai master
//     const updated = await prisma.hypervisor.update({
//       where: { id: hypervisorId },
//       data: { isMaster: true },
//     });

//     return updated;
//   }

//   /**
//    * Unset master hypervisor di region tertentu
//    */
//   static async unsetMaster(regionId: string) {
//     // Reset semua hypervisor di region menjadi non-master
//     const updated = await prisma.hypervisor.updateMany({
//       where: { regionId, isMaster: true },
//       data: { isMaster: false },
//     });

//     return updated;
//   }

//   /**
//    * Sinkronisasi template master ke semua hypervisor regional
//    */
//   static async syncTemplatesToRegion(regionId: string) {
//     const master = await this.getMasterByRegion(regionId);
//     if (!master) throw new Error("No master hypervisor found for this region");

//     const masterService = getHypervisorService(master.type, {
//       id: master.id,
//       host: master.host,
//       token: decryptToken(master.token),
//     });

//     if (typeof masterService.getTemplates !== "function") {
//       throw new Error("Master hypervisor service does not support templates");
//     }

//     const masterTemplates = await masterService.getTemplates();

//     const hypervisors = await prisma.hypervisor.findMany({
//       where: { regionId, isMaster: false },
//     });

//     for (const hv of hypervisors) {
//       await saveTemplatesToDB(hv.id, masterTemplates, { sync: true });
//     }

//     return { success: true, syncedHypervisors: hypervisors.length };
//   }
// }


import { prisma } from "../../../core/db/client";
import { getHypervisorService } from "./hypervisor.factory";
import { decryptToken } from "../../../core/utils/encrypt";
import { saveTemplatesToDB } from "./saveTemplatesToDB";

export class MasterHypervisorService {
  /**
   * Ambil hypervisor master per region
   */
  static async getMasterByRegion(regionId: string) {
    return prisma.hypervisor.findFirst({
      where: { regionId, isMaster: true },
    });
  }

  /**
   * Set hypervisor sebagai master
   * Hanya 1 master per region
   */
  static async setMaster(hypervisorId: string) {
    const hv = await prisma.hypervisor.findUnique({ where: { id: hypervisorId } });
    if (!hv) throw new Error("Hypervisor not found");

    await prisma.hypervisor.updateMany({
      where: { regionId: hv.regionId },
      data: { isMaster: false },
    });

    return prisma.hypervisor.update({
      where: { id: hypervisorId },
      data: { isMaster: true },
    });
  }

  /**
   * Unset master hypervisor di region tertentu
   */
  static async unsetMaster(regionId: string) {
    return prisma.hypervisor.updateMany({
      where: { regionId, isMaster: true },
      data: { isMaster: false },
    });
  }

  /**
   * Sync master → semua hypervisor di 1 region
   */
  static async syncTemplatesToRegion(regionId: string) {
    const master = await this.getMasterByRegion(regionId);
    if (!master) throw new Error("No master hypervisor found for this region");

    const masterService = getHypervisorService(master.type, {
      id: master.id,
      host: master.host,
      token: decryptToken(master.token),
    });

    if (typeof masterService.getTemplates !== "function") {
      throw new Error("Master hypervisor service does not support templates");
    }

    const masterTemplates = await masterService.getTemplates();

    const hypervisors = await prisma.hypervisor.findMany({
      where: { regionId, isMaster: false },
    });

    for (const hv of hypervisors) {
      await saveTemplatesToDB(hv.id, masterTemplates, { sync: true });
    }

    return {
      regionId,
      syncedHypervisors: hypervisors.length,
    };
  }

  /**
   * 🚀 SYNC GLOBAL
   * Sebarkan template yang sudah diperbarui
   * ke SEMUA regional & SEMUA hypervisor
   */
  static async syncTemplatesGlobally() {
    const regions = await prisma.region.findMany();

    const result = {
      success: true,
      totalRegions: regions.length,
      syncedRegions: 0,
      totalHypervisors: 0,
      failedRegions: [] as { regionId: string; error: string }[],
    };

    for (const region of regions) {
      try {
        const res = await this.syncTemplatesToRegion(region.id);
        result.syncedRegions++;
        result.totalHypervisors += res.syncedHypervisors;

        console.log(
          `[GLOBAL SYNC] Region ${region.id} → ${res.syncedHypervisors} hypervisors`
        );
      } catch (err) {
        console.error(`[GLOBAL SYNC] Region ${region.id} FAILED`, err);

        result.failedRegions.push({
          regionId: region.id,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return result;
  }
}
