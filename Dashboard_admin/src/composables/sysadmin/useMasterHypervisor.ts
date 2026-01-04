import { ref } from 'vue';
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

// ─── Composables ────────────────────────────────

export function useMasterHypervisor() {
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Set hypervisor sebagai master
  const setMaster = async (hypervisorId: string) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await apiClient.post<{ success: boolean; message: string; data: Hypervisor }>(
        `/api/master/set-master/${hypervisorId}`
      );
      return response.data;
    } catch (err: any) {
      error.value = err.message || 'Failed to set master';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Unset master hypervisor di region
  const unsetMaster = async (regionId: string) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await apiClient.post<{ success: boolean; message: string; data: { count: number } }>(
        `/api/master/unset-master/${regionId}`
      );
      return response.data;
    } catch (err: any) {
      error.value = err.message || 'Failed to unset master';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Sinkronisasi template master ke semua hypervisor regional
  const syncTemplates = async (regionId: string) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await apiClient.post<SyncTemplatesResult>(
        `/api/master/sync-templates/${regionId}`
      );
      return response.data;
    } catch (err: any) {
      error.value = err.message || 'Failed to sync templates';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    error,
    setMaster,
    unsetMaster,
    syncTemplates,
  };
}
