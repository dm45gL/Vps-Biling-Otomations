import { ref } from 'vue';
import { getClientOrders } from '@/api/clientOrder';
import type { ClientOrder } from '@/api/clientOrder';

export function useClientOrders(clientId: string) {
  const orders = ref<ClientOrder[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchOrders = async () => {
    loading.value = true;
    error.value = null;
    try {
      const response = await getClientOrders(clientId);
      if (response.data.success) {
        orders.value = response.data.data;
      } else {
        error.value = 'Failed to fetch orders';
      }
    } catch (err: any) {
      console.error(err);
      error.value = err?.message || 'Unknown error';
    } finally {
      loading.value = false;
    }
  };

  // langsung fetch saat composable dipakai
  fetchOrders();

  return {
    orders,
    loading,
    error,
    fetchOrders, // bisa dipanggil manual jika ingin refresh
  };
}
