import { ref } from 'vue';
import apiClient from '@/utils/apiClient';

export interface User {
  id: string;
  email: string;
  username: string;
  role?: string; // hanya untuk admin
  createdAt: string;
}

const users = ref<User[]>([]);
const loading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

export const useUsers = () => {
  const fetchUsers = async () => {
    loading.value = true;
    errorMessage.value = '';
    try {
      const res = await apiClient.get('/sysadmin/users');
      // gabungkan clients & admins
      const allUsers: User[] = [
        ...res.data.clients.map((c: any) => ({ ...c, role: 'CLIENT' })),
        ...res.data.admins.map((a: any) => ({ ...a })),
      ];
      users.value = allUsers;
    } catch (err: any) {
      console.error(err);
      errorMessage.value = err?.response?.data?.error || 'Failed to load users';
    } finally {
      loading.value = false;
    }
  };

  const createUser = async (data: { email: string; username?: string; password: string; role: string }) => {
    loading.value = true;
    successMessage.value = '';
    errorMessage.value = '';
    try {
      const res = await apiClient.post('/sysadmin/create-user', data);
      successMessage.value = res.data.message;
      await fetchUsers();
    } catch (err: any) {
      errorMessage.value = err?.response?.data?.error || 'Failed to create user';
    } finally {
      loading.value = false;
    }
  };

  const updateUser = async (id: string, data: { email?: string; username?: string; password?: string; role?: string }) => {
    loading.value = true;
    successMessage.value = '';
    errorMessage.value = '';
    try {
      const res = await apiClient.put(`/sysadmin/users/${id}`, data);
      successMessage.value = res.data.message;
      await fetchUsers();
    } catch (err: any) {
      errorMessage.value = err?.response?.data?.error || 'Failed to update user';
    } finally {
      loading.value = false;
    }
  };

  const deleteUser = async (id: string) => {
    loading.value = true;
    successMessage.value = '';
    errorMessage.value = '';
    try {
      const res = await apiClient.delete(`/sysadmin/users/${id}`);
      successMessage.value = res.data.message;
      await fetchUsers();
    } catch (err: any) {
      errorMessage.value = err?.response?.data?.error || 'Failed to delete user';
    } finally {
      loading.value = false;
    }
  };

  const formatDate = (dateStr: string | Date) => {
    const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleString();
  };

  return { users, loading, errorMessage, successMessage, fetchUsers, createUser, updateUser, deleteUser, formatDate };
};
