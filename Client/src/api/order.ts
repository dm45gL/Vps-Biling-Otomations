import apiClient from '@/utils/apiClient';

// ─── Types ──────────────────────────────────────

export type BillingAddress = {
  fullName: string;
  email: string;
  companyName?: string;
  country: string;
  state: string;
  city: string;
  addressLine1: string;
  addressLine2?: string;
  postalCode: string;
  phone: string;
};

export type CreateOrderRequest = {
  pricingId: string;
  promoId?: string;
  backupEnabled?: boolean;
  region?: string;       // ← pilih region dari frontend
  templateId?: string;   // ← pilih template dari frontend
  billingAddress: BillingAddress; // wajib dikirim
};

export type OrderPricing = {
  rawPrice: number;
  backupPrice: number;
  discount: number;
  finalPrice: number;
  durationMonths: number;
};

export type PromoApplied = {
  id: string;
  type: string;
  value: number;
} | null;

export type CreateOrderResponse = {
  orderId: string;
  invoiceId: string;
  invoiceUrl: string;
  expiresAt: string;
  pricing: OrderPricing;
  backupEnabled: boolean;
  promoApplied: PromoApplied;
  billingAddress: BillingAddress;
  region?: string;       // optional, bisa dikembalikan dari backend
  templateId?: string;   // optional, bisa dikembalikan dari backend
};

// ─── CLIENT API ─────────────────────────────────

// Create order + invoice (checkout)
export const createOrder = (data: CreateOrderRequest) =>
  apiClient.post<{ success: boolean; data: CreateOrderResponse }>(
    '/api/orders',
    data
  );
