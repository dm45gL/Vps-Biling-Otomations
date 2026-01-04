// src/api/backupStorageApi.ts
import apiClient from '@/utils/apiClient';

/* ──────────────────────────────────────────────────────────
   Types (match Prisma enums & backend response)
────────────────────────────────────────────────────────── */
export type BackupProvider = 'S3' | 'AZURE' | 'NFS';
export type BackupStorageType = 'PRIMARY' | 'SECONDARY';
export type BackupStorageStatus = 'ACTIVE' | 'INACTIVE' | 'ERROR';

export interface BackupStorage {
  id: string;
  name: string;
  provider: BackupProvider;
  storageType: BackupStorageType;

  endpoint?: string;
  bucket?: string;
  accessKey?: string;
  secretKey?: string;
  region?: string;
  directory?: string;

  totalSpace?: number;
  usedSpace?: number;
  totalSpaceGB?: number;
  usedSpaceGB?: number;

  isDefault?: boolean;
  status: BackupStorageStatus;

  createdAt: string;
  updatedAt: string;
}

/* ──────────────────────────────────────────────────────────
   Generic API Response Type
────────────────────────────────────────────────────────── */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
}

/* ──────────────────────────────────────────────────────────
   CRUD API
────────────────────────────────────────────────────────── */
export const createBackupStorage = (data: Partial<BackupStorage>) =>
  apiClient.post<ApiResponse<BackupStorage>>('/api/backup-storage', data);

export const getAllBackupStorages = () =>
  apiClient.get<ApiResponse<BackupStorage[]>>('/api/backup-storage');

export const getBackupStorageById = (id: string) =>
  apiClient.get<ApiResponse<BackupStorage>>(`/api/backup-storage/${id}`);

export const updateBackupStorage = (id: string, data: Partial<BackupStorage>) =>
  apiClient.put<ApiResponse<BackupStorage>>(`/api/backup-storage/${id}`, data);

export const deleteBackupStorage = (id: string) =>
  apiClient.delete<ApiResponse<null>>(`/api/backup-storage/${id}`);

/* ──────────────────────────────────────────────────────────
   SET DEFAULT STORAGE
────────────────────────────────────────────────────────── */
export const setDefaultBackupStorage = (id: string) =>
  apiClient.post<ApiResponse<{ status: BackupStorageStatus }>>(
    `/api/backup-storage/${id}/default`
  );

/* ──────────────────────────────────────────────────────────
   VALIDATE STORAGE
────────────────────────────────────────────────────────── */
export const validateStorage = (id: string) =>
  apiClient.post<ApiResponse<{ status: BackupStorageStatus }>>(
    `/api/backup-storage/${id}/validate`
  );

/* ──────────────────────────────────────────────────────────
   ENABLE / DISABLE STORAGE
────────────────────────────────────────────────────────── */
export const enableStorage = (id: string) =>
  apiClient.post<ApiResponse<BackupStorage>>(`/api/backup-storage/${id}/enable`);

export const disableStorage = (id: string) =>
  apiClient.post<ApiResponse<BackupStorage>>(`/api/backup-storage/${id}/disable`);

/* ──────────────────────────────────────────────────────────
   PICK ACTIVE STORAGE (Load Balancing)
────────────────────────────────────────────────────────── */
export const pickActiveStorage = () =>
  apiClient.get<ApiResponse<BackupStorage>>('/api/backup-storage/pick-active');
