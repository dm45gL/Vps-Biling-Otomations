// src/utils/apiClient.ts
import axios, { AxiosError } from 'axios';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';

import { refreshSessionInternal } from '@/api/auth';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

// Flag agar refresh hanya sekali
let isRefreshing = false;
// Queue untuk menahan request saat token sedang refresh
let pendingRequests: Array<(token?: string) => void> = [];

// Extend AxiosRequestConfig agar bisa pakai _retry
interface CustomRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomRequestConfig;
    const status = error.response?.status;
    const url = originalRequest?.url;

    const ignored = ['/admin/me', '/admin/refresh'];

    // 401 normal (tidak perlu refresh)
    if (status === 401 && ignored.some((e) => url?.includes(e))) {
      return Promise.reject(error);
    }

    // Token expired
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        try {
          await refreshSessionInternal(); // lakukan refresh token
          isRefreshing = false;

          // jalankan semua request tertunda
          pendingRequests.forEach((cb) => cb());
          pendingRequests = [];

          return apiClient(originalRequest);
        } catch (err) {
          isRefreshing = false;
          pendingRequests = [];
          // redirect ke login jika refresh gagal
          window.location.href = '/login';
          return Promise.reject(err);
        }
      }

      // Jika sudah ada refresh berjalan, tunggu sampai selesai
      return new Promise((resolve, reject) => {
        pendingRequests.push(() => {
          apiClient(originalRequest)
            .then(resolve)
            .catch(reject);
        });
      });
    }

    return Promise.reject(error);
  }
);

export default apiClient;
