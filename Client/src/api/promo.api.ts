import apiClient from '@/utils/apiClient';

// ─── Types ──────────────────────────────────────
export type PromoType = 'PERCENT' | 'AMOUNT';

export type PromoValidationResult = {
  promoId: string;
  discount: number;
  finalAmount: number;
};

// ─── CLIENT API ─────────────────────────────────

// Validate promo (checkout preview)
export const validatePromo = (data: {
  code: string;
  amount: number;
}) =>
  apiClient.post<{ success: boolean; data: PromoValidationResult }>(
    '/api/promos/validate',
    data
  );

// Use promo (after order success)
export const usePromo = (promoId: string) =>
  apiClient.post<{ success: boolean }>(
    `/api/promos/${promoId}/use`
  );
