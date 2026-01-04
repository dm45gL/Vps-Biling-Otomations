import { refreshClientSession } from '@/api/clientAuth';
import axios, { AxiosError } from 'axios';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';


const apiClientClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

let isRefreshing = false;
let pendingRequests: Array<() => void> = [];

// Extend request config untuk _retry
interface CustomRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

apiClientClient.interceptors.response.use(
  (res: AxiosResponse) => res,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomRequestConfig;
    const status = error.response?.status;

    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        try {
          await refreshClientSession();
          isRefreshing = false;
          pendingRequests.forEach((cb) => cb());
          pendingRequests = [];
          // cast ke AxiosRequestConfig agar type-safe
          return apiClientClient(originalRequest as AxiosRequestConfig);
        } catch (err) {
          isRefreshing = false;
          pendingRequests = [];
          window.location.href = '/client/login';
          return Promise.reject(err);
        }
      }

      return new Promise((resolve, reject) => {
        pendingRequests.push(() => {
          apiClientClient(originalRequest as AxiosRequestConfig).then(resolve).catch(reject);
        });
      });
    }

    return Promise.reject(error);
  }
);

export default apiClientClient;
