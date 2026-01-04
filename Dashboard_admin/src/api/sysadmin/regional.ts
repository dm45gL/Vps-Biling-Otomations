import apiClient from '@/utils/apiClient';


export interface Region {
  id: string;
  code: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

// CRUD Regional
export const getAllRegions = () => apiClient.get<Region[]>('/regions');
export const getRegionById = (id: string) => apiClient.get<Region>(`/regions/${id}`);
export const createRegion = (data: Partial<Region>) => apiClient.post<Region>('/regions', data);
export const updateRegion = (id: string, data: Partial<Region>) => apiClient.put<Region>(`/regions/${id}`, data);
export const deleteRegion = (id: string) => apiClient.delete(`/regions/${id}`);
