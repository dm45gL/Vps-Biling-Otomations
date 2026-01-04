
// import { ref } from 'vue';
// import {
//   checkoutPreview,
//   checkout,
// } from '@/api/checkout.api';

// import type {
//   CheckoutPreviewInput,
//   CheckoutPreviewResponse,
//   CheckoutInput,
//   CheckoutResponse,
// } from '@/api/checkout.api';

// export function useCheckout() {
//   /* ─── STATE ───────────────────────────────── */

//   const previewLoading = ref(false);
//   const checkoutLoading = ref(false);

//   const error = ref<string | null>(null);

//   const previewData = ref<CheckoutPreviewResponse | null>(null);
//   const checkoutData = ref<CheckoutResponse | null>(null);

//   /* ─── PREVIEW (PRICE CALCULATOR) ───────────── */

//   const preview = async (payload: CheckoutPreviewInput) => {
//     previewLoading.value = true;
//     error.value = null;

//     try {
//       const response = await checkoutPreview(payload);
//       const resData = response.data;

//       if (resData.success && resData.data) {
//         previewData.value = resData.data;
//         return resData.data;
//       } else {
//         throw new Error(resData.error || 'Failed to calculate price');
//       }
//     } catch (err: any) {
//       error.value = err.message || 'Unknown error';
//       return null;
//     } finally {
//       previewLoading.value = false;
//     }
//   };

//   /* ─── FINAL CHECKOUT ───────────────────────── */

//   const submit = async (payload: CheckoutInput) => {
//     checkoutLoading.value = true;
//     error.value = null;

//     try {
//       const response = await checkout(payload);
//       const resData = response.data;

//       if (resData.success && resData.data) {
//         checkoutData.value = resData.data;

//         // 🔥 AUTO REDIRECT KE XENDIT INVOICE
//         window.location.href = resData.data.invoiceUrl;

//         return resData.data;
//       } else {
//         throw new Error(resData.error || 'Checkout failed');
//       }
//     } catch (err: any) {
//       error.value = err.message || 'Unknown error';
//       return null;
//     } finally {
//       checkoutLoading.value = false;
//     }
//   };

//   /* ─── EXPORT ───────────────────────────────── */

//   return {
//     // preview
//     preview,
//     previewLoading,
//     previewData,

//     // checkout
//     submit,
//     checkoutLoading,
//     checkoutData,

//     // shared
//     error,
//   };
// }
