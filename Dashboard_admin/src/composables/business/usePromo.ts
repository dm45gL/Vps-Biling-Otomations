import { ref } from 'vue';
import {
  listPromos,
  createPromo,
  updatePromo,
  deletePromo,
  getPromoById,
} from '@/api/busines/promo.api';

import type { Promo } from '@/api/busines/promo.api';

export function usePromoAdmin() {
  const promos = ref<Promo[]>([]);
  const promo = ref<Promo | null>(null);

  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchPromos = async () => {
    loading.value = true;
    error.value = null;
    try {
      const res = await listPromos();
      promos.value = res.data.data;
    } catch (err: any) {
      error.value = err?.response?.data?.error || 'Failed to load promos';
    } finally {
      loading.value = false;
    }
  };

  const fetchPromoById = async (id: string) => {
    loading.value = true;
    error.value = null;
    try {
      const res = await getPromoById(id);
      promo.value = res.data.data;
    } catch (err: any) {
      error.value = err?.response?.data?.error || 'Failed to load promo';
    } finally {
      loading.value = false;
    }
  };

  const create = async (data: any) => {
    loading.value = true;
    error.value = null;
    try {
      await createPromo(data);
      await fetchPromos();
    } finally {
      loading.value = false;
    }
  };

  const update = async (id: string, data: Partial<Promo>) => {
    loading.value = true;
    error.value = null;
    try {
      await updatePromo(id, data);
      await fetchPromos();
    } finally {
      loading.value = false;
    }
  };

  const remove = async (id: string) => {
    loading.value = true;
    error.value = null;
    try {
      await deletePromo(id);
      promos.value = promos.value.filter((p) => p.id !== id);
    } finally {
      loading.value = false;
    }
  };

  return {
    promos,
    promo,
    loading,
    error,
    fetchPromos,
    fetchPromoById,
    create,
    update,
    remove,
  };
}
