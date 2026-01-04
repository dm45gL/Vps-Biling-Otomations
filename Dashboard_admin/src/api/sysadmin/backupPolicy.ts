// src/api/backupPolicyApi.ts
import apiClient from '@/utils/apiClient';

// CREATE Backup Policy
export const createBackupPolicy = (data: {
  name: string;
  cron?: string | null;
  retentionDays: number;
  isSystem?: boolean;
  maxStorageGB: number;
  maxDailyBackup: number;
}) => apiClient.post('/api/backup-policy/policies', data);

// LIST Backup Policies
export const listBackupPolicies = () =>
  apiClient.get('/api/backup-policy/policies');

// UPDATE Backup Policy
export const updateBackupPolicy = (id: string, data: Partial<{
  name: string;
  cron?: string | null;
  retentionDays: number;
  isSystem?: boolean;
  maxStorageGB: number;
  maxDailyBackup: number;
}>) => apiClient.put(`/api/backup-policy/policies/${id}`, data);

// DELETE Backup Policy
export const deleteBackupPolicy = (id: string) =>
  apiClient.delete(`/api/backup-policy/policies/${id}`);

// RUN Backup (manual)
export const runBackup = (policyId: string) =>
  apiClient.post(`/api/backup-policy/run/${policyId}`);

// UPLOAD Backup
export const uploadBackup = (file: File, policyId?: string) => {
  const formData = new FormData();
  formData.append('file', file);
  if (policyId) formData.append('policyId', policyId);

  return apiClient.post('/api/backup-policy/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// DOWNLOAD Backup
export const downloadBackup = (backupId: string) =>
  apiClient.get(`/api/backup-policy/download/${backupId}`);
