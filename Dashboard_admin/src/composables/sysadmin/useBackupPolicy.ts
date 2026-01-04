import { ref } from "vue";
import {
  createBackupPolicy as apiCreate,
  listBackupPolicies as apiList,
  updateBackupPolicy as apiUpdate,
  deleteBackupPolicy as apiDelete,
  runBackup as apiRun,
  uploadBackup as apiUpload,
  downloadBackup as apiDownload,
} from "@/api/sysadmin/backupPolicy";


type CronOption = {
  type: "daily" | "weekly" | "monthly";
  hour?: number;    // 0-23
  minute?: number;  // 0-59
  dayOfWeek?: number; // 0-6, 0 = Sunday
  dayOfMonth?: number; // 1-31
};

export function generateCron(option: CronOption): string {
  const minute = option.minute ?? 0;
  const hour = option.hour ?? 2; // default jam 2 pagi

  switch (option.type) {
    case "daily":
      return `${minute} ${hour} * * *`; // setiap hari jam tertentu
    case "weekly":
      if (option.dayOfWeek === undefined)
        throw new Error("dayOfWeek harus diisi untuk weekly cron");
      return `${minute} ${hour} * * ${option.dayOfWeek}`;
    case "monthly":
      if (option.dayOfMonth === undefined)
        throw new Error("dayOfMonth harus diisi untuk monthly cron");
      return `${minute} ${hour} ${option.dayOfMonth} * *`;
    default:
      throw new Error("Option type tidak valid");
  }
}


export function useBackupPolicy() {
  const policies = ref<any[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Fetch all policies
  const fetchPolicies = async () => {
    loading.value = true;
    error.value = null;
    try {
      const res = await apiList();
      policies.value = res.data.data;
    } catch (err: any) {
      error.value = err.message || "Failed to fetch policies";
    } finally {
      loading.value = false;
    }
  };

  // Create policy
  const createPolicy = async (data: {
    name: string;
    cron?: string | null;
    retentionDays: number;
    isSystem?: boolean;
    maxStorageGB: number;
    maxDailyBackup: number;
  }) => {
    loading.value = true;
    error.value = null;
    try {
      const res = await apiCreate(data);
      policies.value.push(res.data.data);
      return res.data.data;
    } catch (err: any) {
      error.value = err.message || "Failed to create policy";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Update policy
  const updatePolicy = async (id: string, data: Partial<{
    name: string;
    cron?: string | null;
    retentionDays: number;
    isSystem?: boolean;
    maxStorageGB: number;
    maxDailyBackup: number;
  }>) => {
    loading.value = true;
    error.value = null;
    try {
      const res = await apiUpdate(id, data);
      const index = policies.value.findIndex((p) => p.id === id);
      if (index !== -1) policies.value[index] = res.data.data;
      return res.data.data;
    } catch (err: any) {
      error.value = err.message || "Failed to update policy";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Delete policy
  const deletePolicy = async (id: string) => {
    loading.value = true;
    error.value = null;
    try {
      await apiDelete(id);
      policies.value = policies.value.filter((p) => p.id !== id);
    } catch (err: any) {
      error.value = err.message || "Failed to delete policy";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Run backup
  const runBackup = async (policyId: string) => {
    loading.value = true;
    error.value = null;
    try {
      const res = await apiRun(policyId);
      return res.data.data;
    } catch (err: any) {
      error.value = err.message || "Failed to run backup";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Upload backup file
  const uploadBackup = async (file: File, policyId?: string) => {
    loading.value = true;
    error.value = null;
    try {
      const res = await apiUpload(file, policyId);
      return res.data.data;
    } catch (err: any) {
      error.value = err.message || "Failed to upload backup";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Download backup info
  const downloadBackup = async (backupId: string) => {
    loading.value = true;
    error.value = null;
    try {
      const res = await apiDownload(backupId);
      return res.data;
    } catch (err: any) {
      error.value = err.message || "Failed to download backup";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    policies,
    loading,
    error,
    fetchPolicies,
    createPolicy,
    updatePolicy,
    deletePolicy,
    runBackup,
    uploadBackup,
    downloadBackup,
  };
}
