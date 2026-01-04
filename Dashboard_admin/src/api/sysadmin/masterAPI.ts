import apiClient from '@/utils/apiClient';

// ─── Types ──────────────────────────────────────
export type Hypervisor = {
  id: string;
  name: string;
  regionId: string;
  type: string;
  host: string;
  isMaster: boolean;
};

export type SyncTemplatesResult = {
  success: boolean;
  message: string;
};

// ─── CLIENT API ─────────────────────────────────

// Set hypervisor sebagai master
export const setMasterHypervisor = (hypervisorId: string) =>
  apiClient.post<{ success: boolean; message: string; data: Hypervisor }>(
    `/api/master/set-master/${hypervisorId}`
  );

// Unset master hypervisor di region
export const unsetMasterHypervisor = (regionId: string) =>
  apiClient.post<{ success: boolean; message: string; data: { count: number } }>(
    `/api/master/unset-master/${regionId}`
  );

// Sinkronisasi template master ke semua hypervisor regional
export const syncMasterTemplates = (regionId: string) =>
  apiClient.post<SyncTemplatesResult>(
    `/api/master/sync-templates/${regionId}`
  );
