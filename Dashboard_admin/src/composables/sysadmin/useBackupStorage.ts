// src/composables/useBackupStorages.ts
import { ref, computed } from "vue";
import apiClient from "@/utils/apiClient";

// ─────────────────────────────────────────────
// SANITIZER — hanya hapus undefined, null
// TIDAK menghapus string kosong (biar user bisa clear field)
// ─────────────────────────────────────────────
const sanitizePayload = (obj: any) => {
  const clean: any = {};

  Object.keys(obj).forEach((key) => {
    const val = obj[key];

    if (val !== undefined && val !== null) {
      clean[key] = val;
    }
  });

  return clean;
};

// Types backend
export type BackupProvider = "S3" | "AZURE" | "NFS";
export type BackupStorageStatus = "ACTIVE" | "INACTIVE" | "ERROR";

export interface BackupStorage {
  id: string;
  name: string;
  provider: BackupProvider;

  storageType: "PRIMARY" | "SECONDARY";
  isDefault: boolean;

  status: BackupStorageStatus;
  usedSpace?: number;
  totalSpace?: number;
  detailError?: string | null;

  endpoint?: string;
  bucket?: string;
  directory?: string;

  accessKey?: string;
  secretKey?: string;
  region?: string;

  createdAt: string;
  updatedAt: string;
}

// Backend validation response
export type ValidateResponse = {
  status: BackupStorageStatus;
  usedSpace?: number;
  totalSpace?: number;
  detailError?: string | null;
};

// Mapper backend → FE
const mapStorage = (s: any): BackupStorage => ({
  ...s,
  isDefault: s.isDefault ?? s.storageType === "PRIMARY",
});

// ─────────────────────────────────────────────
// MAIN COMPOSABLE
// ─────────────────────────────────────────────
export const useBackupStorages = () => {
  const storages = ref<BackupStorage[]>([]);
  const error = ref<string | null>(null);

  // Fetch list
  const fetchBackupStorages = async (params?: any) => {
    try {
      const res = await apiClient.get("/api/backup-storage", { params });
      storages.value = (res.data?.data ?? []).map(mapStorage);
    } catch (err: any) {
      error.value = err?.response?.data?.error ?? err.message;
    }
  };

  // Create
  const createBackupStorage = async (payload: Partial<BackupStorage>) => {
    const sanitized = sanitizePayload(payload);
    const res = await apiClient.post("/api/backup-storage", sanitized);
    return mapStorage(res.data.data);
  };

  // Update
  const updateBackupStorage = async (id: string, payload: Partial<BackupStorage>) => {
    const sanitized = sanitizePayload(payload);
    const res = await apiClient.put(`/api/backup-storage/${id}`, sanitized);
    return mapStorage(res.data.data);
  };

  // Delete
  const deleteBackupStorage = async (id: string) => {
    const res = await apiClient.delete(`/api/backup-storage/${id}`);
    return res.data.success;
  };

  // Set default
  const setDefaultBackupStorage = async (id: string) => {
    const res = await apiClient.post(`/api/backup-storage/${id}/default`);
    return mapStorage(res.data.data);
  };

  // Enable / Disable
  const enableStorage = async (id: string) => {
    const res = await apiClient.post(`/api/backup-storage/${id}/enable`);
    return mapStorage(res.data.data);
  };

  const disableStorage = async (id: string) => {
    const res = await apiClient.post(`/api/backup-storage/${id}/disable`);
    return mapStorage(res.data.data);
  };

  // Validate
  const validateStorage = async (id: string): Promise<ValidateResponse> => {
    const res = await apiClient.post(`/api/backup-storage/${id}/validate`);
    return res.data.data;
  };

  // Pick active storage
  const pickStorageForBackup = async () => {
    const res = await apiClient.get("/api/backup-storage/pick-active");
    return res.data.data ? mapStorage(res.data.data) : null;
  };

  // UI helpers
  const primaryStorage = computed(() =>
    storages.value.find((s) => s.storageType === "PRIMARY")
  );

  const secondaryStorages = computed(() =>
    storages.value.filter((s) => s.storageType === "SECONDARY")
  );

  const groupedByProvider = computed(() =>
    storages.value.reduce((acc: any, s) => {
      if (!acc[s.provider]) acc[s.provider] = [];
      acc[s.provider].push(s);
      return acc;
    }, {})
  );

  const visibleFields = (provider: BackupProvider | undefined) => {
    if (!provider) return ["name"];

    switch (provider) {
      case "S3":
        return ["name", "endpoint", "bucket", "accessKey", "secretKey", "region", "totalSpace"];
      case "AZURE":
        return ["name", "endpoint", "bucket", "accessKey", "secretKey", "totalSpace"];
      case "NFS":
        return ["name", "directory", "totalSpace"];
      default:
        return ["name"];
    }
  };

  const fieldLabels: Record<string, string> = {
    name: "Storage Name",
    endpoint: "Endpoint URL",
    bucket: "Bucket / Container",
    accessKey: "Access Key",
    secretKey: "Secret Key",
    region: "Region",
    directory: "Directory Path",
    totalSpace: "Total Space (MB)",
    usedSpace: "Used Space (MB)",
  };

  const formattedLabel = (key: string) => fieldLabels[key] ?? key;

  return {
    storages,
    error,

    fetchBackupStorages,
    createBackupStorage,
    updateBackupStorage,
    deleteBackupStorage,

    enableStorage,
    disableStorage,
    validateStorage,
    setDefaultBackupStorage,

    pickStorageForBackup,

    primaryStorage,
    secondaryStorages,
    groupedByProvider,
    visibleFields,
    formattedLabel,
  };
};
