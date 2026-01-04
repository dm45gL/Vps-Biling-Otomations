import { prisma } from "../../../core/db/client";
import { v4 as uuidv4 } from "uuid";

// ──────────────────────────────────────────────
// DTO
// ──────────────────────────────────────────────

export type ClientPricingDTO = {
  id: string; 
  durationLabel: string;
  months: number;
  price: number;
  backupPrice?: number | null;
};

export type ClientTemplateDTO = {
  id: string;
  name: string;
  os?: string;
  hypervisorName?: string;
  hypervisorType?: string;
  hypervisorRegionId?: string | null;
  hypervisorRegionName?: string | null;
  isMasterHypervisor?: boolean;
  availableRegions?: string[]; // daftar region untuk deployment
};

export type ClientTemplateGroupDTO = {
  id: string;
  name: string;
  templates: ClientTemplateDTO[];
};

export type ClientTemplateCategoryDTO = {
  id: string;
  name: string;
  groups: ClientTemplateGroupDTO[];
};

export type ClientProductDTO = {
  publicId: string;
  name: string;
  description?: string;
  specs: {
    cpu: number | null;
    ram: number | null;
    disk: number | null;
    bandwidth: number | null;
  };
  pricing: ClientPricingDTO[];
  backupPolicy?: {
    id: string;
    name: string;
  } | null;
  categories?: ClientTemplateCategoryDTO[];
  regions?: string[]; // semua region unik
};

export type AdminPricingDTO = ClientPricingDTO & {
  pricingDurationId: string;
};

export type AdminBackupPolicyDTO = {
  id: string;
  name: string;
} | null;

export type AdminProductDTO = ClientProductDTO & {
  id: string;
  rawProductId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  backupPolicy?: AdminBackupPolicyDTO;
};

// ──────────────────────────────────────────────
// Service
// ──────────────────────────────────────────────

export class PublicProductService {
  // CREATE
  async create(data: { rawProductId: string; name: string; description?: string }) {
    const publicId = uuidv4();
    return prisma.publicProduct.create({ data: { ...data, publicId } });
  }

  // LIST CLIENT
  async listActiveClient(): Promise<ClientProductDTO[]> {
    const products = await this.fetchBaseQuery({ isActive: true });
    return products.map(p => this.mapToClientDTO(p));
  }

  // DETAIL CLIENT
  async getDetailClient(publicId: string): Promise<ClientProductDTO | null> {
    const product = await this.fetchOneBaseQuery({ publicId });
    if (!product || !product.isActive) return null;
    return this.mapToClientDTO(product);
  }

  // LIST ADMIN
  async listAdmin(): Promise<AdminProductDTO[]> {
    const products = await this.fetchBaseQuery();
    return products.map(p => this.mapToAdminDTO(p));
  }

  // DETAIL ADMIN
  async getDetailAdmin(id: string): Promise<AdminProductDTO | null> {
    const product = await this.fetchOneBaseQuery({ id });
    if (!product) return null;
    return this.mapToAdminDTO(product);
  }

  // UPDATE
  async update(id: string, data: { name?: string; description?: string; isActive?: boolean }) {
    return prisma.publicProduct.update({ where: { id }, data });
  }

  // SET ACTIVE
  async setActive(id: string, isActive: boolean) {
    return prisma.publicProduct.update({ where: { id }, data: { isActive } });
  }

  // DELETE
  async delete(id: string) {
    return prisma.publicProduct.delete({ where: { id } });
  }

  // ──────────────────────────────────────────
  // PRIVATE QUERIES
  // ──────────────────────────────────────────
  private fetchBaseQuery(where: any = {}) {
    return prisma.publicProduct.findMany({
      where,
      include: {
        rawProduct: {
          include: {
            backupPolicy: true,
            productPricing: { where: { isActive: true }, include: { pricingDuration: true } },
            categories: {
              include: {
                templateCategory: {
                  include: {
                    groups: {
                      include: {
                        templates: {
                          include: {
                            hypervisor: { include: { region: true } },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            regions: { include: { region: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  private fetchOneBaseQuery(where: any) {
    return prisma.publicProduct.findFirst({
      where,
      include: {
        rawProduct: {
          include: {
            backupPolicy: true,
            productPricing: { where: { isActive: true }, include: { pricingDuration: true } },
            categories: {
              include: {
                templateCategory: {
                  include: {
                    groups: {
                      include: {
                        templates: {
                          include: {
                            hypervisor: { include: { region: true } },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            regions: { include: { region: true } },
          },
        },
      },
    });
  }

  // ──────────────────────────────────────────
  // MAPPING
  // ──────────────────────────────────────────
  private mapToClientDTO(p: any): ClientProductDTO {
    const raw = p.rawProduct;

    const regionSet = new Set<string>();

    // 1️⃣ Semua region sharing dari RawProductRegion
    raw?.regions?.forEach((r: any) => {
      if (r.region?.name) regionSet.add(r.region.name);
    });

    // 2️⃣ Semua region dari hypervisor tiap template
    raw?.categories?.forEach((c: any) => {
      c.templateCategory.groups.forEach((g: any) => {
        g.templates.forEach((t: any) => {
          const regionName = t.hypervisor?.region?.name;
          if (regionName) regionSet.add(regionName);
        });
      });
    });

    // Buat daftar semua region yang ada di hypervisor regional
    const allRegions = Array.from(regionSet);

    // 3️⃣ Mapping categories & templates
    const categories: ClientTemplateCategoryDTO[] =
      raw?.categories?.map((c: any) => ({
        id: c.templateCategory.id,
        name: c.templateCategory.name,
        groups: c.templateCategory.groups.map((g: any) => ({
          id: g.id,
          name: g.name,
          templates: g.templates
            .filter((t: any) => t.hypervisor?.isMaster) // hanya master
            .map((t: any) => ({
              id: t.id,
              name: t.name,
              os: t.type,
              hypervisorName: t.hypervisor?.name || '',
              hypervisorType: t.hypervisor?.type || '',
              hypervisorRegionId: t.hypervisor?.region?.id ?? null,
              hypervisorRegionName: t.hypervisor?.region?.name ?? null,
              isMasterHypervisor: t.hypervisor?.isMaster ?? false,
              availableRegions: allRegions, // semua regional
            })),
        })),
      })) ?? [];

    return {
      publicId: p.publicId,
      name: p.name,
      description: p.description,
      specs: {
        cpu: raw?.cpu ?? null,
        ram: raw?.ram ?? null,
        disk: raw?.disk ?? null,
        bandwidth: raw?.bandwidth ?? null,
      },
      pricing: raw?.productPricing?.map((pr: any) => ({
        id: pr.id,
        durationLabel: pr.pricingDuration?.label ?? '',
        months: pr.pricingDuration?.months ?? 0,
        price: pr.price ?? 0,
        backupPrice: pr.backupPrice ?? null,
      })) ?? [],
      backupPolicy: raw?.backupPolicy ? { id: raw.backupPolicy.id, name: raw.backupPolicy.name } : null,
      categories,
      regions: allRegions,
    };
  }

  private mapToAdminDTO(p: any): AdminProductDTO {
    return {
      ...this.mapToClientDTO(p),
      id: p.id,
      rawProductId: p.rawProductId,
      isActive: p.isActive,
      backupPolicy: p.rawProduct?.backupPolicy
        ? { id: p.rawProduct.backupPolicy.id, name: p.rawProduct.backupPolicy.name }
        : null,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  }
}
