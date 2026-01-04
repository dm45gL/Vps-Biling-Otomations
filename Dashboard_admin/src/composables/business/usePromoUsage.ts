// src/composables/sysadmin/promo/usePromoUsage.ts
import { ref } from 'vue';
import {
  listPromoUsage,
  getPromoUsageSummary,
  downloadPromoUsageCsv,
  type PromoUsageItem,
  type PromoUsageSummary
} from '@/api/busines/promoUsage.api';

export function usePromoUsage() {
  const usages = ref<PromoUsageItem[]>([]);
  const summary = ref<PromoUsageSummary | null>(null);
  const loadingUsages = ref(false);
  const loadingSummary = ref(false);
  const error = ref<string | null>(null);

  const fetchUsages = async (promoId: string, params?: { skip?: number; take?: number }) => {
    if (!promoId) return;
    loadingUsages.value = true;
    error.value = null;
    try {
      const res = await listPromoUsage(promoId, params);
      usages.value = res.data.data;
    } catch (err: any) {
      error.value = err?.response?.data?.error || err.message || 'Failed to fetch usages';
    } finally {
      loadingUsages.value = false;
    }
  };

  const fetchSummary = async (promoId: string) => {
    if (!promoId) return;
    loadingSummary.value = true;
    error.value = null;
    try {
      const res = await getPromoUsageSummary(promoId);
      summary.value = res.data.data;
    } catch (err: any) {
      error.value = err?.response?.data?.error || err.message || 'Failed to fetch summary';
    } finally {
      loadingSummary.value = false;
    }
  };

  const downloadCsv = async (promoId: string) => {
    if (!promoId) {
      error.value = 'Please select a promo first';
      return;
    }
    try {
      await downloadPromoUsageCsv(promoId);
    } catch (err: any) {
      error.value = err?.response?.data?.error || err.message || 'Failed to download CSV';
    }
  };

  return {
    usages,
    summary,
    loadingUsages,
    loadingSummary,
    error,
    fetchUsages,
    fetchSummary,
    downloadCsv,
  };
}