import { ref } from 'vue';
import {
  createPricingBatch,
  listPricingByRawProduct,
  updatePricing,
  deletePricing,
  type ProductPricingItem,
} from '@/api/busines/productPricing';

export function useProductPricing() {
  const pricings = ref<ProductPricingItem[]>([]);
  const loading = ref({
    fetching: false,
    creating: false,
    updating: false,
    deleting: false,
  });
  const error = ref<string | null>(null);

  const normalizeBackupPrice = (value?: number | null) =>
    value === undefined ? undefined : value ?? null;

  // ─── Fetch by raw product ─────────────────────
  const fetchByRawProduct = async (rawProductId: string) => {
    loading.value.fetching = true;
    error.value = null;

    try {
      const res = await listPricingByRawProduct(rawProductId);
      // Ambil array dari res.data.data
      pricings.value = Array.isArray(res.data.data) ? res.data.data : [];
    } catch (err: any) {
      console.error('[fetchByRawProduct] error:', err);
      error.value =
        err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to fetch pricings';
      pricings.value = [];
    } finally {
      loading.value.fetching = false;
    }
  };

  // ─── Create batch ────────────────────────────
  const addBatch = async (
    rawProductId: string,
    batch: { months: number; price: number; backupPrice?: number | null }[]
  ) => {
    loading.value.creating = true;
    error.value = null;

    const normalizedBatch = batch.map(p => ({
      ...p,
      backupPrice: normalizeBackupPrice(p.backupPrice),
    }));

    try {
      const res = await createPricingBatch({ rawProductId, pricings: normalizedBatch });
      pricings.value = Array.isArray(res.data.data) ? res.data.data : [];
    } catch (err: any) {
      console.error('addBatch error:', err);
      error.value =
        err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to create batch';
    } finally {
      loading.value.creating = false;
    }
  };

  // ─── Update single item ─────────────────────
  const updateItem = async (
    id: string,
    data: Partial<{ price?: number; backupPrice?: number | null; isActive?: boolean }>
  ) => {
    loading.value.updating = true;
    error.value = null;

    const normalizedData = {
      ...data,
      backupPrice: normalizeBackupPrice(data.backupPrice),
    };

    try {
      const res = await updatePricing(id, normalizedData);
      pricings.value = pricings.value.map(p => (p.id === id ? res.data.data : p));
    } catch (err: any) {
      console.error('updateItem error:', err);
      error.value =
        err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to update pricing';
    } finally {
      loading.value.updating = false;
    }
  };

  // ─── Delete single item ─────────────────────
  const removeItem = async (id: string, rawProductId?: string) => {
    loading.value.deleting = true;
    error.value = null;

    try {
      await deletePricing(id);
      if (rawProductId) {
        await fetchByRawProduct(rawProductId);
      } else {
        pricings.value = pricings.value.filter(p => p.id !== id);
      }
    } catch (err: any) {
      console.error('removeItem error:', err);
      error.value =
        err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to delete pricing';
    } finally {
      loading.value.deleting = false;
    }
  };

  return {
    pricings,
    loading,
    error,
    fetchByRawProduct,
    addBatch,
    updateItem,
    removeItem,
  };
}
