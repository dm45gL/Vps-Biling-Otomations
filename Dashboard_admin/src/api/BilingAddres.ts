import apiClient from '@/utils/apiClient';

// ─── Types ──────────────────────────────────────
export type BillingAddress = {
  id: string;
  clientId: string;
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
  createdAt: string;
  updatedAt: string;
};

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

// ─── CLIENT API ─────────────────────────────────

// List all billing addresses for a client
export const listBillingAddresses = (clientId: string) =>
  apiClient.get<ApiResponse<BillingAddress[]>>(`/api/address/${clientId}`);

// Delete a billing address
export const deleteBillingAddress = (clientId: string, id: string) =>
  apiClient.delete<ApiResponse<null>>(`/api/address/${clientId}/${id}`);
