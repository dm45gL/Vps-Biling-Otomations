import { ref } from "vue";
import type { AdminProductDTO } from "@/api/busines/publicProduct.api";
import {
  listPublicProductsAdmin,
  createPublicProduct,
  updatePublicProduct,
  setPublicProductActive,
  deletePublicProduct
} from "@/api/busines/publicProduct.api";


export function useAdminPublicProducts() {
  const products = ref<AdminProductDTO[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // --- Fetch all products ---
  const fetchProducts = async () => {
    loading.value = true;
    error.value = null;
    try {
      const res = await listPublicProductsAdmin();
      products.value = res.data.data;
    } catch (err: any) {
      error.value = err.message || "Failed to fetch products";
    } finally {
      loading.value = false;
    }
  };

  // --- Create product ---
  const createProduct = async (data: {
    rawProductId: string;
    name: string;
    description?: string;
  }) => {
    const res = await createPublicProduct(data);
    products.value.push(res.data.data);
    return res.data.data;
  };

  // --- Update product ---
  const updateProduct = async (
    id: string,
    data: { name?: string; description?: string }
  ) => {
    const res = await updatePublicProduct(id, data);
    const idx = products.value.findIndex((p) => p.id === id);
    if (idx >= 0) products.value[idx] = res.data.data;
    return res.data.data;
  };

  // --- Toggle Active / Inactive ---
  const toggleProductActive = async (id: string, isActive: boolean) => {
    const res = await setPublicProductActive(id, isActive);
    const idx = products.value.findIndex((p) => p.id === id);
    if (idx >= 0) products.value[idx] = res.data.data;
    return res.data.data;
  };

  // --- Delete product ---
  const removeProduct = async (id: string) => {
    await deletePublicProduct(id);
    products.value = products.value.filter((p) => p.id !== id);
  };

  return {
    products,
    loading,
    error,
    fetchProducts,
    createProduct,
    updateProduct,
    toggleProductActive,
    removeProduct
  };
}
