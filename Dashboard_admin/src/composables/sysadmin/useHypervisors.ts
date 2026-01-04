import { ref, watch } from 'vue';
import apiClient from '@/utils/apiClient';

export interface Hypervisor {
  id: string;
  name: string;
  type: string;
  host: string;
  username: string;
  regionId?: string;
  regionName?: string;
  status: 'ONLINE' | 'OFFLINE' | null;
  isMaster: boolean; 

  createdAt: string;
  updatedAt: string;
}

export interface VMStatus {
  node: string;
  cpuPercent: number;
  ramUsedMB: number;
  ramTotalMB: number;
  ramPercent: number;
  diskUsedGB: number;
  diskTotalGB: number;
  diskPercent: number;
  totalVM: number;
}

export interface Template {
  id: string;
  name: string;
  os?: string;
  hypervisorId: string;
  groupId?: string | null;
}

export interface TemplateCategory {
  id: string;
  name: string;
  groups?: TemplateGroup[];
  createdAt: string;
  updatedAt: string;
}

export interface TemplateGroup {
  id: string;
  name: string;
  categoryId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const useHypervisors = () => {
  // ────────────── HYPERVISORS ──────────────
  const hypervisors = ref<Hypervisor[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchHypervisors = async () => {
    loading.value = true;
    error.value = null;
    try {
      const res = await apiClient.get('/hypervisors');
      hypervisors.value = res.data.data || res.data || [];
    } catch (err: any) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  const createHypervisor = async (payload: Partial<Hypervisor>) => {
    const res = await apiClient.post('/hypervisors', payload);
    hypervisors.value.push(res.data.data || res.data);
    return res.data.data || res.data;
  };

  const updateHypervisor = async (id: string, payload: Partial<Hypervisor>) => {
    const res = await apiClient.put(`/hypervisors/${id}`, payload);
    const index = hypervisors.value.findIndex(h => h.id === id);
    if (index !== -1) hypervisors.value[index] = res.data.data || res.data;
    return res.data.data || res.data;
  };

  const deleteHypervisor = async (id: string) => {
    const res = await apiClient.delete(`/hypervisors/${id}`);
    hypervisors.value = hypervisors.value.filter(h => h.id !== id);
    return res.data.success;
  };

  const testConnection = async (id: string) => {
    const res = await apiClient.get(`/hypervisors/${id}/test`);
    return res.data;
  };

  const syncHypervisorTemplates = async (id: string) => {
    const res = await apiClient.post(`/hypervisors/${id}/sync-templates`);
    return res.data;
  };

  // ────────────── TEMPLATES ──────────────
  const templates = ref<Template[]>([]);
  const loadingTemplates = ref(false);
  const templateError = ref<string | null>(null);
  const activeHypervisorId = ref<string | null>(null);

  const fetchTemplates = async (id: string) => {
    const res = await apiClient.get(`/hypervisors/${id}/templates`);
    return res.data.data || res.data || [];
  };

  watch(activeHypervisorId, async (id) => {
    if (!id) return;
    loadingTemplates.value = true;
    templateError.value = null;
    try {
      const res = await fetchTemplates(id);
      templates.value = res;
    } catch (err: any) {
      templateError.value = err.message;
    } finally {
      loadingTemplates.value = false;
    }
  });

  const setActiveHypervisor = (id: string) => {
    if (!id || activeHypervisorId.value === id) return;
    activeHypervisorId.value = id;
    fetchVMStatus();
    stopPolling();
    startPolling();
  };

  // ────────────── TEMPLATE GROUPS ──────────────
  const templateGroups = ref<TemplateGroup[]>([]);
  const loadingGroups = ref(false);
  const errorGroups = ref<string | null>(null);

  const fetchTemplateGroups = async () => {
    loadingGroups.value = true;
    errorGroups.value = null;
    try {
      const res = await apiClient.get('/hypervisors/templates/groups');
      templateGroups.value = res.data.data || res.data || [];
    } catch (err: any) {
      errorGroups.value = err.message;
    } finally {
      loadingGroups.value = false;
    }
  };

  const createTemplateGroup = async (name: string, categoryId?: string | null) => {
    const res = await apiClient.post('/hypervisors/templates/groups', { name, categoryId });
    return res.data.data || res.data;
  };

  const assignTemplateToGroup = async (templateId: string, groupId: string) => {
    const res = await apiClient.post('/hypervisors/templates/assign', { templateId, groupId });
    return res.data;
  };

  const unassignTemplateFromGroup = async (templateId: string) => {
    const res = await apiClient.post('/hypervisors/templates/unassign', { templateId });
    return res.data;
  };

  const deleteTemplateGroup = async (groupId: string) => {
    const res = await apiClient.delete(`/hypervisors/templates/groups/${groupId}`);
    return res.data.success;
  };

  // ────────────── TEMPLATE CATEGORIES ──────────────
  const templateCategories = ref<TemplateCategory[]>([]);
  const loadingCategories = ref(false);
  const errorCategories = ref<string | null>(null);

  const fetchTemplateCategories = async () => {
    loadingCategories.value = true;
    errorCategories.value = null;
    try {
      const res = await apiClient.get('/hypervisors/templates/categories');
      templateCategories.value = res.data.data || res.data || [];
    } catch (err: any) {
      errorCategories.value = err.message;
    } finally {
      loadingCategories.value = false;
    }
  };

  const createTemplateCategory = async (name: string) => {
    const res = await apiClient.post('/hypervisors/templates/categories', { name });
    return res.data.data || res.data;
  };

  const deleteTemplateCategory = async (categoryId: string) => {
    const res = await apiClient.delete(`/hypervisors/templates/categories/${categoryId}`);
    return res.data.success;
  };

  const assignGroupToCategory = async (groupId: string, categoryId: string) => {
    const res = await apiClient.post('/hypervisors/templates/categories/assign-group', { groupId, categoryId });
    return res.data;
  };

  const unassignGroupFromCategory = async (groupId: string) => {
    const res = await apiClient.post('/hypervisors/templates/categories/unassign-group', { groupId });
    return res.data;
  };

  // ────────────── VM MONITORING ──────────────
  const vmStatuses = ref<VMStatus[]>([]);
  const loadingVMs = ref(false);
  const errorVMs = ref<string | null>(null);

  const fetchVMStatus = async () => {
    if (!activeHypervisorId.value) return;
    try {
      const res = await apiClient.get<{ success: boolean; data: VMStatus[] }>(
        `/hypervisors/vms/${activeHypervisorId.value}`
      );
      if (res.data.success) {
        vmStatuses.value = res.data.data;
      } else {
        errorVMs.value = 'Failed to fetch VM status';
      }
    } catch (err: any) {
      errorVMs.value = err.message;
    }
  };

  let vmInterval: ReturnType<typeof setInterval> | null = null;
  const startPolling = () => {
    if (vmInterval) return;
    vmInterval = setInterval(fetchVMStatus, 5000);
  };
  const stopPolling = () => {
    if (vmInterval) clearInterval(vmInterval);
    vmInterval = null;
  };

  return {
    // Hypervisors
    hypervisors,
    loading,
    error,
    fetchHypervisors,
    createHypervisor,
    updateHypervisor,
    deleteHypervisor,
    testConnection,
    syncHypervisorTemplates,

    // Templates
    templates,
    loadingTemplates,
    templateError,
    fetchTemplates,

    // Active Hypervisor
    activeHypervisorId,
    setActiveHypervisor,
    vmStatuses,
    loadingVMs,
    errorVMs,
    fetchVMStatus,
    startPolling,
    stopPolling,

    // Template Groups
    templateGroups,
    loadingGroups,
    errorGroups,
    fetchTemplateGroups,
    createTemplateGroup,
    assignTemplateToGroup,
    unassignTemplateFromGroup,
    deleteTemplateGroup,

    // Template Categories
    templateCategories,
    loadingCategories,
    errorCategories,
    fetchTemplateCategories,
    createTemplateCategory,
    deleteTemplateCategory,
    assignGroupToCategory,
    unassignGroupFromCategory,
  };
};