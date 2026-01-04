import apiClient from '@/utils/apiClient';

// ─── Types ──────────────────────────────────────
export type VPS = {
  id: string;
  hostname: string;
  status: string;
  ip: string;
  region: string;
  createdAt: string;
};

export type Product = {
  name: string;
  cpu: number;
  ram: number;
  disk: number;
  bandwidth: number;
  duration: string;
};

export type ClientOrder = {
  id: string;
  status: string;
  rawPrice: number;
  discount: number;
  finalPrice: number;
  months: number;
  nextBillingDate: string;
  createdAt: string;
  product: Product;
  vps: VPS[];
};

// ─── CLIENT ORDERS API ──────────────────────────

// Ambil semua order milik client
export const getClientOrders = (clientId: string) =>
  apiClient.get<{ success: boolean; data: ClientOrder[] }>(
    `/api/client/order/${clientId}`
  );
