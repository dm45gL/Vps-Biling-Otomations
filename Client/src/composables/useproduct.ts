// import { ref } from 'vue';
// import type { ClientPublicProduct } from '@/api/publicProduct';
// import { listPublicProductsClient, getPublicProductDetail } from '@/api/publicProduct';

// export const useClientPublicProduct = () => {
//   const products = ref<ClientPublicProduct[]>([]);
//   const loading = ref(false);
//   const error = ref<string | null>(null);

//   const fetchProducts = async () => {
//     loading.value = true;
//     error.value = null;
//     try {
//       const res = await listPublicProductsClient();
//       if (!res?.data?.success || !res.data.data) {
//         throw new Error('Failed to fetch products');
//       }
//       products.value = res.data.data as ClientPublicProduct[];
//     } catch (err: any) {
//       error.value = err.message || 'Failed to fetch products';
//     } finally {
//       loading.value = false;
//     }
//   };

//   const fetchProductDetail = async (publicId: string) => {
//     loading.value = true;
//     error.value = null;
//     try {
//       const res = await getPublicProductDetail(publicId);
//       if (!res?.data?.success || !res.data.data) {
//         throw new Error('Product not found');
//       }
//       return res.data.data as ClientPublicProduct;
//     } catch (err: any) {
//       error.value = err.message || 'Failed to fetch product detail';
//       throw err;
//     } finally {
//       loading.value = false;
//     }
//   };

//   return {
//     products,
//     loading,
//     error,
//     fetchProducts,
//     fetchProductDetail
//   };
// };
