import apiClient from '@/utils/apiClient';


export interface Hypervisor {
  id: string;
  name: string;
  type: 'PROXMOX' | 'VMWARE';
  host: string;
  username: string;
  token?: string;
  status?: 'ONLINE' | 'OFFLINE';
  regionId?: string;
  isMaster?: boolean;
  createdAt: string;
  updatedAt: string;
}


// ─── CRUD Hypervisor ──────────────────────────────
export const createHypervisor = (data: Partial<Hypervisor>) =>
  apiClient.post<Hypervisor>('/hypervisors', data);

export const getAllHypervisors = () =>
  apiClient.get<Hypervisor[]>('/hypervisors');

export const getHypervisorById = (id: string) =>
  apiClient.get<Hypervisor>(`/hypervisors/${id}`);

export const updateHypervisor = (id: string, data: Partial<Hypervisor>) =>
  apiClient.put<Hypervisor>(`/hypervisors/${id}`, data);

export const deleteHypervisor = (id: string) =>
  apiClient.delete(`/hypervisors/${id}`);
