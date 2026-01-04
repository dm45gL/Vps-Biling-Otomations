import apiClient from '@/utils/apiClient';

// ─── Types ──────────────────────────────────────
export type PromoType = 'PERCENT' | 'AMOUNT';

export type Promo = {
  id: string;
  code: string;
  type: PromoType;
  value: number;

  minOrderAmount: number | null;
  maxDiscount: number | null;

  startsAt: string;
  endsAt: string;

  globalLimit: number | null;
  userLimit: number | null;

  isActive: boolean;
  usedCount: number;

  createdAt: string;
  updatedAt: string;
};

// ─── ADMIN (BUSINESS) API ───────────────────────

// Create promo
export const createPromo = (data: {
  code: string;
  type: PromoType;
  value: number;
  minOrderAmount?: number | null;
  maxDiscount?: number | null;
  startsAt: string;
  endsAt: string;
  globalLimit?: number | null;
  userLimit?: number | null;
}) =>
  apiClient.post<{ success: boolean; data: Promo }>(
    '/api/promos',
    data
  );

// List promos
export const listPromos = () =>
  apiClient.get<{ success: boolean; data: Promo[] }>(
    '/api/promos'
  );

// Get promo by id
export const getPromoById = (id: string) =>
  apiClient.get<{ success: boolean; data: Promo }>(
    `/api/promos/${id}`
  );

// Update promo
export const updatePromo = (
  id: string,
  data: Partial<{
    code: string;
    type: PromoType;
    value: number;
    minOrderAmount: number | null;
    maxDiscount: number | null;
    startsAt: string;
    endsAt: string;
    globalLimit: number | null;
    userLimit: number | null;
    isActive: boolean;
  }>
) =>
  apiClient.put<{ success: boolean; data: Promo }>(
    `/api/promos/${id}`,
    data
  );

// Delete promo
export const deletePromo = (id: string) =>
  apiClient.delete<{ success: boolean }>(
    `/api/promos/${id}`
  );
