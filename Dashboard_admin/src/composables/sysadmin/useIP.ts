// composables/useIP.ts
import { ref } from 'vue';
import * as IPApi from '@/api/sysadmin/IP_Api';
import type {
  IPAddress,
  IPStatus,
  IPType,
  CIDRResult,
} from '@/api/sysadmin/IP_Api';

export const useIP = () => {
  const ips = ref<IPAddress[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // ── FETCH ALL IPs ─────────────────────────
  const fetchIPs = async (regionId?: string): Promise<void> => {
    loading.value = true;
    error.value = null;
    try {
      const response = await IPApi.getIPs(regionId);
      if (response.data.success) {
        ips.value = response.data.data;
      } else {
        throw new Error('Failed to fetch IPs');
      }
    } catch (err: unknown) {
      console.error(err);
      error.value =
        err instanceof Error ? err.message : 'Failed to fetch IPs';
    } finally {
      loading.value = false;
    }
  };

  // ── CREATE SINGLE IP ─────────────────────
  const createIP = async (data: {
    ip: string;
    type: IPType;
    regionId: string;
    status?: IPStatus;
    note?: string;
    gateway?: string;
    netmask?: number;
    dns?: string;
  }): Promise<IPAddress> => {
    try {
      const res = await IPApi.createIP(data);
      if (res.data.success) {
        ips.value.push(res.data.data);
        return res.data.data;
      }
      throw new Error('Failed to create IP');
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  // ── UPDATE IP ────────────────────────────
  const updateIP = async (
    id: string,
    data: Partial<{
      type: IPType;
      status: IPStatus;
      note: string;
      gateway: string;
      netmask: number;
      dns: string;
      regionId: string;
    }>
  ): Promise<IPAddress> => {
    try {
      const res = await IPApi.updateIP(id, data);
      if (res.data.success) {
        const index = ips.value.findIndex(ip => ip.id === id);
        if (index !== -1) ips.value[index] = res.data.data;
        return res.data.data;
      }
      throw new Error('Failed to update IP');
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  // ── DELETE IP ────────────────────────────
  const deleteIP = async (id: string): Promise<void> => {
    try {
      const res = await IPApi.deleteIP(id);
      if (res.data.success) {
        ips.value = ips.value.filter(ip => ip.id !== id);
        return;
      }
      throw new Error('Failed to delete IP');
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  // ── CREATE IPs FROM CIDR ─────────────────
  const createFromCidr = async (data: {
    cidr: string;
    type: IPType;
    regionId: string;
    status?: IPStatus;
    note?: string;
    dns?: string;
  }): Promise<{
    insertedCount: number;
    results: CIDRResult[];
  }> => {
    try {
      const res = await IPApi.createIPsFromCidr(data);
      if (res.data.success) {
        await fetchIPs(data.regionId); // refresh by region
        return {
          insertedCount: res.data.insertedCount,
          results: res.data.results,
        };
      }
      throw new Error('Failed to generate IPs from CIDR');
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  return {
    ips,
    loading,
    error,
    fetchIPs,
    createIP,
    updateIP,
    deleteIP,
    createFromCidr,
  };
};

export type IPComposableReturn = ReturnType<typeof useIP>;
