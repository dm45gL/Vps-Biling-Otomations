import { ref } from 'vue';
import type { ClientPublicProduct } from '@/api/publicProduct';
import { listPublicProductsClient } from '@/api/publicProduct';

export function useActiveProducts() {
  const products = ref<ClientPublicProduct[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchProducts = async () => {
    loading.value = true;
    error.value = null;
    try {
      const res = await listPublicProductsClient();
      if (res.data.success) {
        products.value = res.data.data;
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch products';
    } finally {
      loading.value = false;
    }
  };

  return {
    products,
    loading,
    error,
    fetchProducts
  };
}
