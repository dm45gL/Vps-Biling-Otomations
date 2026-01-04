import apiClient from '@/utils/apiClient';

export type AdminPricingDTO = {
  durationLabel: string;
  months: number;
  price: number;
  backupPrice?: number | null;
};

export type AdminSpecsDTO = {
  cpu: number;
  ram: number;
  disk: number;
  bandwidth: number;
};

export type AdminBackupPolicyDTO = {
  id: string;
  name: string;
};

export type AdminProductDTO = {
  id: string;
  publicId: string;
  rawProductId: string;
  name: string;
  description?: string;
  isActive: boolean;
  specs: AdminSpecsDTO;
  pricing: AdminPricingDTO[];
  backupPolicy?: AdminBackupPolicyDTO | null;
  createdAt: string;
  updatedAt: string;
};




// List semua produk (admin)
export const listPublicProductsAdmin = () =>
  apiClient.get<{ success: boolean; data: AdminProductDTO[] }>(
    '/api/public-products/admin/all'
  );

// Detail produk (admin)
export const getPublicProductDetailAdmin = (id: string) =>
  apiClient.get<{ success: boolean; data: AdminProductDTO }>(
    `/api/public-products/admin/${id}`
  );

// Create public product
export const createPublicProduct = (data: {
  rawProductId: string;
  name: string;
  description?: string;
}) =>
  apiClient.post<{ success: boolean; data: AdminProductDTO }>(
    '/api/public-products',
    data
  );

// Update public product
export const updatePublicProduct = (id: string, data: { name?: string; description?: string }) =>
  apiClient.patch<{ success: boolean; data: AdminProductDTO }>(
    `/api/public-products/${id}`,
    data
  );

// Set active / inactive
export const setPublicProductActive = (id: string, isActive: boolean) =>
  apiClient.patch<{ success: boolean; data: AdminProductDTO }>(
    `/api/public-products/${id}/active`,
    { isActive }
  );

// Delete public product
export const deletePublicProduct = (id: string) =>
  apiClient.delete<{ success: boolean }>(`/api/public-products/${id}`);
