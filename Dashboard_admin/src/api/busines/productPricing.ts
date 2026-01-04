import apiClient from '@/utils/apiClient';

// ─── Tipe untuk pricing ─────────────────────────
export type ProductPricingItem = {
  id: string;
  price: number;
  backupPrice?: number | null;
  isActive: boolean;
  rawProductId: string;
  months: number;
  createdAt: string;
  updatedAt: string;
};

// ─── Create Batch ──────────────────────────────
export const createPricingBatch = (data: {
  rawProductId: string;
  pricings: { months: number; price: number; backupPrice?: number | null }[];
}) =>
  apiClient.post<{ success: boolean; data: ProductPricingItem[] }>(
    '/api/product-pricing/batch',
    data
  );

// ─── List by Raw Product ───────────────────────
export const listPricingByRawProduct = (rawProductId: string) =>
  apiClient.get<{ success: boolean; data: ProductPricingItem[] }>(
    `/api/product-pricing/${rawProductId}`
  );

// ─── Update Single Item ────────────────────────
export const updatePricing = (
  id: string,
  data: Partial<{ price?: number; backupPrice?: number | null; isActive?: boolean }>
) =>
  apiClient.patch<{ success: boolean; data: ProductPricingItem }>(
    `/api/product-pricing/${id}`,
    data
  );

// ─── Delete Single Item ────────────────────────
export const deletePricing = (id: string) =>
  apiClient.delete<{ success: boolean }>(`/api/product-pricing/${id}`);
