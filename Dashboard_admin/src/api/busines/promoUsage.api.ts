// src/api/busines/promoUsage.api.ts
import apiClient from '@/utils/apiClient';

export type PromoUsageItem = {
  id: string;
  usedAt: string;
  client: {
    id: string;
    email: string;
  };
};

export type PromoUsageSummary = {
  usedCount: number;
  globalLimit: number | null;
  remaining: number | null;
  uniqueUsers: number;
};

export const listPromoUsage = (
  promoId: string,
  params?: { skip?: number; take?: number }
) =>
  apiClient.get<{
    success: boolean;
    data: PromoUsageItem[];
    meta: { total: number; skip: number; take: number };
  }>(`/api/promos/${promoId}/usages`, { params });

export const getPromoUsageSummary = (promoId: string) =>
  apiClient.get<{ success: boolean; data: PromoUsageSummary }>(
    `/api/promos/${promoId}/summary`
  );

// ✅ FIXED: Download CSV yang benar-benar bekerja
export const downloadPromoUsageCsv = async (promoId: string) => {
  if (!promoId) throw new Error('Promo ID is required');

  try {
    const response = await apiClient.get(`/api/promos/${promoId}/log/download`, {
      responseType: 'blob',
      headers: {
        Accept: 'text/csv,*/*',
      },
    });

    // Cek jika response error (JSON)
    if (response.data.type === 'application/json') {
      const text = await response.data.text();
      const err = JSON.parse(text);
      throw new Error(err.error || 'Download failed');
    }

    const url = window.URL.createObjectURL(response.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = `promo-${promoId}-log.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error: any) {
    console.error('Download CSV error:', error);
    throw error;
  }
};