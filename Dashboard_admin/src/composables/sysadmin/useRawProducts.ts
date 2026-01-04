import { ref } from "vue";
import {
  createRawProduct,
  listRawProducts,
  getRawProductById,
  updateRawProduct,
  deleteRawProduct,
} from "@/api/sysadmin/rawProduct";

export function useRawProducts() {
  const rawProducts = ref<any[]>([]);
  const selectedProduct = ref<any | null>(null);

  const loading = ref(false);
  const error = ref<string | null>(null);

  // ===============================
  // FETCH LIST
  // ===============================
  const fetchRawProducts = async () => {
    loading.value = true;
    error.value = null;

    try {
      const res = await listRawProducts();
      rawProducts.value = res.data.data; // FIX !!
    } catch (err: any) {
      error.value = err?.response?.data?.error || "Failed to load products";
    } finally {
      loading.value = false;
    }
  };

  // ===============================
  // FETCH SINGLE
  // ===============================
  const fetchRawProductById = async (id: string) => {
    loading.value = true;
    error.value = null;

    try {
      const res = await getRawProductById(id);
      selectedProduct.value = res.data.data; // FIX !!
    } catch (err: any) {
      error.value = err?.response?.data?.error || "Failed to load product";
    } finally {
      loading.value = false;
    }
  };

  // ===============================
  // CREATE
  // ===============================
  const addRawProduct = async (data: {
    name: string;
    cpu: number;
    ram: number;
    disk: number;
    bandwidth: number;
    templateCategoryIds: string[];
    backupPolicyId?: string | null;
  }) => {
    loading.value = true;
    error.value = null;

    try {
      const res = await createRawProduct(data);
      await fetchRawProducts();
      return res.data.data; // FIX !!
    } catch (err: any) {
      error.value = err?.response?.data?.error || "Failed to create product";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // ===============================
  // UPDATE
  // ===============================
  const updateRawProductById = async (
    id: string,
    data: Partial<{
      name: string;
      cpu: number;
      ram: number;
      disk: number;
      bandwidth: number;
      templateCategoryIds: string[];
      backupPolicyId?: string | null;
    }>
  ) => {
    loading.value = true;
    error.value = null;

    try {
      const res = await updateRawProduct(id, data);
      await fetchRawProducts();
      return res.data.data; // FIX !!
    } catch (err: any) {
      error.value = err?.response?.data?.error || "Failed to update product";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // ===============================
  // DELETE
  // ===============================
  const deleteRawProductById = async (id: string) => {
    loading.value = true;
    error.value = null;

    try {
      await deleteRawProduct(id);
      await fetchRawProducts();
    } catch (err: any) {
      error.value = err?.response?.data?.error || "Failed to delete product";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    rawProducts,
    selectedProduct,
    loading,
    error,

    fetchRawProducts,
    fetchRawProductById,
    addRawProduct,
    updateRawProductById,
    deleteRawProductById,
  };
}
