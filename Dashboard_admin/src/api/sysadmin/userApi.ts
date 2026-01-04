import apiClient from '@/utils/apiClient';

export interface User {
  id: string;
  username: string;   
  email: string;
  role: string;
  createdAt: string;
}

// API calls
export const getUsers = () => apiClient.get<User[]>('sysadmin/users');
export const getUserById = (id: string) => apiClient.get<User>(`sysadmin/users/${id}`);
export const createUser = (data: Partial<User> & { password: string }) => apiClient.post('sysadmin/create-user', data);
export const updateUser = (id: string, data: Partial<User>) => apiClient.put(`sysadmin/users/${id}`, data);
export const deleteUser = (id: string) => apiClient.delete(`sysadmin/users/${id}`);
