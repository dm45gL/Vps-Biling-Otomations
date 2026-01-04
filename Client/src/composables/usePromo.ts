import { ref } from 'vue';
import {
  validatePromo,
  usePromo,
} from '@/api//promo.api';
import type { PromoValidationResult } from '@/api/promo.api';

export function usePromoClient() {
  const result = ref<PromoValidationResult | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // ─── Validate Promo (Checkout Preview) ─────────
  const validate = async (data: { code: string; amount: number }) => {
    loading.value = true;
    error.value = null;
    try {
      const res = await validatePromo(data);
      result.value = res.data.data;
      return result.value;
    } catch (err: any) {
      error.value = err?.response?.data?.error || 'Invalid promo';
      result.value = null;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // ─── Use Promo (After Payment Success) ─────────
  const apply = async (promoId: string) => {
    loading.value = true;
    error.value = null;
    try {
      await usePromo(promoId);
      result.value = null;
    } catch (err: any) {
      error.value = err?.response?.data?.error || 'Failed to use promo';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const reset = () => {
    result.value = null;
    error.value = null;
  };

  return {
    result,
    loading,
    error,
    validate,
    apply,
    reset,
  };
}
