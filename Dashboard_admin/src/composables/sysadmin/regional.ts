// composables/useRegion.ts
import { ref } from 'vue';
import * as api from'@/api/sysadmin/regional';
import type { Region } from '@/api/sysadmin/regional';

export function useRegion() {
  const regions = ref<Region[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchRegions = async () => {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.getAllRegions();
      regions.value = res.data;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch regions';
    } finally {
      loading.value = false;
    }
  };

  const getRegion = async (id: string) => {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.getRegionById(id);
      return res.data;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch region';
      return null;
    } finally {
      loading.value = false;
    }
  };

  const createRegion = async (data: Partial<Region>) => {
    try {
      const res = await api.createRegion(data);
      regions.value.push(res.data);
      return res.data;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to create region');
    }
  };

  const updateRegion = async (id: string, data: Partial<Region>) => {
    try {
      const res = await api.updateRegion(id, data);
      const index = regions.value.findIndex(r => r.id === id);
      if (index !== -1) regions.value[index] = res.data;
      return res.data;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to update region');
    }
  };

  const deleteRegion = async (id: string) => {
    try {
      await api.deleteRegion(id);
      regions.value = regions.value.filter(r => r.id !== id);
    } catch (err: any) {
      throw new Error(err.message || 'Failed to delete region');
    }
  };

  return {
    regions,
    loading,
    error,
    fetchRegions,
    getRegion,
    createRegion,
    updateRegion,
    deleteRegion,
  };
}
