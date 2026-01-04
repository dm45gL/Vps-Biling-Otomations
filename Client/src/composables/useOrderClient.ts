import { ref } from 'vue';
import { createOrder } from '@/api/order';
import type { CreateOrderRequest, CreateOrderResponse } from '@/api/order';

export function useOrderClient() {
  const result = ref<CreateOrderResponse | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // ─── Create Order + Invoice (Checkout) ─────────
  const checkout = async (data: CreateOrderRequest) => {
    loading.value = true;
    error.value = null;

    // Pastikan billingAddress tersedia
    if (!data.billingAddress) {
      throw new Error('Billing address is required');
    }

    try {
      const res = await createOrder(data);
      result.value = res.data.data;
      return result.value;
    } catch (err: any) {
      error.value =
        err?.response?.data?.error ||
        err?.message ||
        'Failed to create order';
      result.value = null;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // ─── Reset state ─────────
  const reset = () => {
    result.value = null;
    error.value = null;
  };

  return {
    result,
    loading,
    error,
    checkout,
    reset,
  };
}
