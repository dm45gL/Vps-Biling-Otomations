// // src/api/hypervisorApi.ts
// import apiClient from '@/utils/apiClient';

// export interface Hypervisor {
//   id: string;
//   name: string;
//   type: string;
//   host: string;
//   username: string;
//   token?: string;
//   status?: "ONLINE" | "OFFLINE";
//   createdAt: string;
//   updatedAt: string;
// }

// export interface VMStatus {
//   node: string;
//   cpuPercent: number;
//   ramUsedMB: number;
//   ramTotalMB?: number;
//   ramPercent?: number;
//   diskUsedGB: number;
//   diskTotalGB?: number;
//   diskPercent?: number;
//   totalVM: number;
// }

// export interface Template {
//   id: string;
//   hypervisorId: string;
//   node: string;
//   vmid: number;
//   name: string;
//   type: string;
//   groupId?: string;
//   createdAt: string;
//   updatedAt: string;
// }

// export interface TemplateGroup {
//   id: string;
//   name: string;
//   category?: TemplateCategory;
//   createdAt: string;
//   updatedAt: string;
// }

// export interface TemplateCategory {
//   id: string;
//   name: string;
//   groups?: TemplateGroup[];
//   createdAt: string;
//   updatedAt: string;
// }

// // ─── CRUD Hypervisor ──────────────────────────────
// export const createHypervisor = (data: Partial<Hypervisor>) =>
//   apiClient.post<Hypervisor>('/hypervisors', data);

// export const getAllHypervisors = () =>
//   apiClient.get<Hypervisor[]>('/hypervisors');

// export const getHypervisorById = (id: string) =>
//   apiClient.get<Hypervisor>(`/hypervisors/${id}`);

// export const updateHypervisor = (id: string, data: Partial<Hypervisor>) =>
//   apiClient.put<Hypervisor>(`/hypervisors/${id}`, data);

// export const deleteHypervisor = (id: string) =>
//   apiClient.delete(`/hypervisors/${id}`);

// // ─── Fitur tambahan ──────────────────────────────
// export const testProxmoxConnection = (id: string) =>
//   apiClient.get<{ success: boolean; message?: string }>(`/hypervisors/${id}/test`);

// export const fetchProxmoxTemplates = (id: string) =>
//   apiClient.get<Template[]>(`/hypervisors/${id}/templates`);

// // ─── Monitoring VM / Node ──────────────────────────────
// export const fetchVMStatus = (id: string) =>
//   apiClient.get<{ success: boolean; data: VMStatus[] }>(
//     `/hypervisors/vms/${id}`,
//     { withCredentials: true }
//   );

// // ─── Template Groups ──────────────────────────────
// export const createTemplateGroup = (name: string, categoryId?: string) =>
//   apiClient.post<TemplateGroup>('/hypervisors/templates/groups', { name, categoryId });

// export const assignTemplateToGroup = (templateId: string, groupId: string) =>
//   apiClient.post(`/hypervisors/templates/assign`, { templateId, groupId });

// export const unassignTemplateFromGroup = (templateId: string) =>
//   apiClient.post(`/hypervisors/templates/unassign`, { templateId });

// export const deleteTemplateGroup = (groupId: string) =>
//   apiClient.delete(`/hypervisors/templates/groups/${groupId}`);

// export const getAllTemplateGroups = () =>
//   apiClient.get<TemplateGroup[]>('/hypervisors/templates/groups');

// // ─── Template Categories ──────────────────────────────
// export const createTemplateCategory = (name: string) =>
//   apiClient.post<TemplateCategory>('/hypervisors/templates/categories', { name });

// export const listTemplateCategories = () =>
//   apiClient.get<TemplateCategory[]>('/hypervisors/templates/categories');

// export const deleteTemplateCategory = (categoryId: string) =>
//   apiClient.delete(`/hypervisors/templates/categories/${categoryId}`);

// export const assignGroupToCategory = (groupId: string, categoryId: string) =>
//   apiClient.post(`/hypervisors/templates/categories/assign-group`, { groupId, categoryId });

// export const unassignGroupFromCategory = (groupId: string) =>
//   apiClient.post(`/hypervisors/templates/categories/unassign-group`, { groupId });
