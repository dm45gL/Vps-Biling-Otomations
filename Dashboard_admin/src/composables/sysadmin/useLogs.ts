// src/composables/useLogs.ts
import { ref, onUnmounted } from "vue";
import { subscribeLogs } from "@/api/sysadmin/loging";
import type { LogMessage } from "@/api/sysadmin/loging";

const logs = ref<LogMessage[]>([]);
const error = ref<string | null>(null);
let evtSource: EventSource | null = null;
let isStarted = false;

export const useLogs = () => {
  // start SSE sekali
  if (!isStarted) {
    evtSource = subscribeLogs((log) => {
      logs.value.push(log);
      // batasi maksimal log 1000 untuk performa
      if (logs.value.length > 1000) logs.value.shift();
    });

    evtSource.onerror = (err) => {
      console.error("SSE error:", err);
      error.value = "SSE connection error";
      evtSource?.close();
      isStarted = false;
    };

    isStarted = true;
  }

  // cleanup saat semua komponen unmounted
  onUnmounted(() => {
    if (evtSource) {
      evtSource.close();
      evtSource = null;
      isStarted = false;
    }
  });

  return {
    logs,
    error,
  };
};
