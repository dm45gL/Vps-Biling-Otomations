import apiClient from '@/utils/apiClient';

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

export type ClientSpecsDTO = {
  cpu: number | null;
  ram: number | null;
  disk: number | null;
  bandwidth: number | null;
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
  availableRegions?: string[];   
};


export type ClientTemplateGroupDTO = {
  id: string;
  name: string;
  templates: ClientTemplateDTO[];
};

export type ClientCategoryDTO = {
  id: string;
  name: string;
  groups: ClientTemplateGroupDTO[];
};

export type ClientBackupPolicyDTO = {
  id: string;
  name: string;
} | null;

export type ClientProductDTO = {
  publicId: string;
  name: string;
  description?: string;
  specs: ClientSpecsDTO;
  pricing: ClientPricingDTO[];
  backupPolicy?: ClientBackupPolicyDTO;
  categories?: ClientCategoryDTO[];
  regions: string[]; // daftar nama region hypervisor (pastikan selalu ada array)
};

// Alias
export type ClientPublicProduct = ClientProductDTO;

// ──────────────────────────────────────────────
// API
// ──────────────────────────────────────────────

// List semua produk aktif (landing page)
export const listPublicProductsClient = () =>
  apiClient.get<{ success: boolean; data: ClientPublicProduct[] }>(
    '/api/public-products'
  );

// Detail produk berdasarkan publicId (landing / checkout)
export const getPublicProductDetail = (publicId: string) =>
  apiClient.get<{ success: boolean; data: ClientPublicProduct }>(
    `/api/public-products/${publicId}`
  );
