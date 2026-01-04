// dto/public-product.dto.ts
export type PublicProductDTO = {
  publicId: string;
  name: string;
  description?: string;

  specs: {
    name: string;
    cpu?: number;
    ram?: number;
    disk?: number;
    bandwidth?: number;
  };

  backupPolicy?: {
    name: string;
    description?: string;
  } | null;

  pricing: {
    durationLabel: string;
    months: number;
    price: number;
    backupPrice?: number | null;
  }[];
};
