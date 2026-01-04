
// import apiClient from '@/utils/apiClient';

// /* ─── PREVIEW TYPES ─────────────────────────── */

// export type CheckoutPreviewInput = {
//   pricingId: string;
//   promoCode?: string;
//   backupEnabled?: boolean;
// };

// export type CheckoutPreviewPricing = {
//   rawPrice: number;
//   backupCost: number;
//   discount: number;
//   finalPrice: number;
//   durationMonths: number;
// };

// export type PromoApplied = {
//   code: string;
//   type: 'PERCENT' | 'FIXED';
//   value: number;
// };

// export type CheckoutPreviewResponse = {
//   pricing: CheckoutPreviewPricing;
//   promoApplied?: PromoApplied;
// };

// /* ─── FINAL CHECKOUT TYPES ──────────────────── */

// export type CheckoutBillingAddressInput = {
//   fullName: string;
//   email: string;
//   companyName?: string;
//   country: string;
//   state: string;
//   city: string;
//   addressLine1: string;
//   addressLine2?: string;
//   postalCode: string;
//   phone: string;
// };

// export type CheckoutInput = {
//   pricingId: string;
//   promoCode?: string;
//   backupEnabled?: boolean;
//   billingAddress: CheckoutBillingAddressInput;
// };

// export type CheckoutResponse = {
//   orderId: string;
//   invoiceId: string;
//   invoiceUrl: string;
//   expiresAt: string;
//   pricing: CheckoutPreviewPricing;
//   backupEnabled: boolean;
//   promoApplied?: PromoApplied;
// };

// export type ApiResponse<T> = {
//   success: boolean;
//   data?: T;
//   error?: string;
// };

// /* ─── API CALLS ─────────────────────────────── */

// /** 🔍 PREVIEW (CALCULATOR ONLY) */
// export const checkoutPreview = (payload: CheckoutPreviewInput) =>
//   apiClient.post<ApiResponse<CheckoutPreviewResponse>>(
//     '/api/checkout/preview',
//     payload
//   );

// /** 🚀 FINAL CHECKOUT */
// export const checkout = (payload: CheckoutInput) =>
//   apiClient.post<ApiResponse<CheckoutResponse>>(
//     '/api/checkout',
//     payload
//   );
