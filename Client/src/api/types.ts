// ─── Tipe Product Pricing ───────────────────
export type ProductPricingItem = {
  id: string;
  price: number;
  backupPrice?: number | null;
  isActive: boolean;
  pricingDuration: {
    id: string;
    months: number;
    label: string;
  };
};

// ─── Tipe Public Product ───────────────────
export type PublicProductItem = {
  id: string;
  rawProductId: string;
  publicId: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  rawProduct: {
    id: string;
    name: string;
    productPricing: ProductPricingItem[]; // konsisten dengan backend
  };
};
