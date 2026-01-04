import { ref } from "vue";
import {
  startVps,
  stopVps,
  reinstallVps,
  restoreVps,
} from "@/api/vps";

export function useVpsActions() {
  const loading = ref(false);
  const error = ref<string | null>(null);

  const run = async <T>(fn: () => Promise<T>) => {
    loading.value = true;
    error.value = null;
    try {
      return await fn();
    } catch (e: any) {
      error.value =
        e?.response?.data?.message ||
        e?.message ||
        "Unknown error";
      throw e;
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    error,

    start: (vpsId: string) =>
      run(() => startVps(vpsId)),

    stop: (vpsId: string) =>
      run(() => stopVps(vpsId)),

    reinstall: (vpsId: string, templateId: string) =>
      run(() =>
        reinstallVps(vpsId, { templateId })
      ),

    restore: (vpsId: string, backupId: string) =>
      run(() =>
        restoreVps(vpsId, { backupId })
      ),
  };
}
