import apiClient from '@/utils/apiClient';

export type LogMessage = {
  level: 'info' | 'warn' | 'error';
  msg: string;
  meta?: any;
  time: number;
};

/**
 * Subscribe to server logs via SSE
 * @param onMessage Callback setiap ada log baru
 * @returns EventSource instance (bisa dipakai untuk unsubscribe)
 */
export const subscribeLogs = (onMessage: (log: LogMessage) => void) => {

  const url = `${apiClient.defaults.baseURL || ''}/logs/stream`;
  const evtSource = new EventSource(url);

  evtSource.onmessage = (event) => {
    try {
      const log: LogMessage = JSON.parse(event.data);
      onMessage(log);
    } catch (err) {
      console.error("Failed to parse log:", err, event.data);
    }
  };

  evtSource.onerror = (err) => {
    console.error("SSE connection error:", err);
    // Auto close; bisa juga ditambahkan reconnection logic
    evtSource.close();
  };

  return evtSource; // untuk unsubscribe: evtSource.close()
};
