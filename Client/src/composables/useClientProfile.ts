// composables/useClientProfile.ts
import { ref } from 'vue';
import { useClientAuth } from './auth/useClientAuth';
import {
  updateClientProfile as apiUpdateProfile,
  confirmUpdatePassword as apiConfirmPassword,
  confirmUpdateEmail as apiConfirmEmail,
} from '@/api/clientAuth';

/**
 * Composable khusus untuk operasi PEMBARUAN profil (bukan fetch data utama).
 * Mengandalkan `useClientAuth` sebagai sumber data client.
 */
export function useClientProfile() {
  const { client, fetchCurrentClient } = useClientAuth(); // ← gunakan shared state

  const loading = ref(false);
  const error = ref<string | null>(null);
  const success = ref<string | null>(null);

  // ── UPDATE PROFILE (username/email langsung, password via OTP)
  const updateProfile = async (data: { username?: string; email?: string; newPassword?: string }) => {
    loading.value = true;
    error.value = null;
    success.value = null;

    try {
      const res = await apiUpdateProfile(data);
      success.value = res.data.message;

      // Update lokal jika perubahan langsung (tanpa OTP)
      if (client.value) {
        if (data.username) client.value.username = data.username;
        if (data.email && !data.newPassword) client.value.email = data.email;
      }

      return res.data;
    } catch (err: any) {
      error.value = err?.response?.data?.error || 'Failed to update profile';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // ── CONFIRM PASSWORD UPDATE
  const confirmPasswordUpdate = async (otp: string) => {
    loading.value = true;
    error.value = null;
    success.value = null;

    try {
      const res = await apiConfirmPassword(otp);
      success.value = res.data.message;
      return res.data;
    } catch (err: any) {
      error.value = err?.response?.data?.error || 'Failed to confirm password';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // ── CONFIRM EMAIL UPDATE
  const confirmEmailUpdate = async (otp: string) => {
    loading.value = true;
    error.value = null;
    success.value = null;

    try {
      const res = await apiConfirmEmail(otp);
      success.value = res.data.message;

      // Perbarui email di shared state setelah konfirmasi sukses
      if (client.value && res.data?.email) {
        client.value.email = res.data.email;
      }

      return res.data;
    } catch (err: any) {
      error.value = err?.response?.data?.error || 'Failed to confirm email';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // ── EXPOSE fetchClient sebagai alias ke fetchCurrentClient (opsional)
  const fetchClient = fetchCurrentClient;

  return {
    client,           // ← reactive ref dari useClientAuth
    loading,
    error,
    success,
    fetchClient,      // untuk kompatibilitas (misal dipanggil di onMounted)
    updateProfile,
    confirmPasswordUpdate,
    confirmEmailUpdate,
  };
}