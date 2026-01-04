// src/modules/Dashboard/views/profile/toast.ts
import { reactive } from 'vue';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

let nextId = 1;
export const toasts = reactive<Toast[]>([]);

export function addToast(message: string, type: 'success' | 'error' = 'success') {
  const id = nextId++;
  toasts.push({ id, message, type });
  setTimeout(() => removeToast(id), 3000);
}

export function removeToast(id: number) {
  const index = toasts.findIndex(t => t.id === id);
  if (index !== -1) toasts.splice(index, 1);
}
