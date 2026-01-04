import apiClient from '@/utils/apiClient';

// ── ADMIN LOGIN ─────────────────────────────
export const login = (email: string, password: string) =>
  apiClient.post('/admin/login', { email, password });

export const verifyOTP = (email: string, otp: string) =>
  apiClient.post('/admin/login/verify', { email, otp });

// ── ADMIN FORGOT PASSWORD ───────────────────
// Step 1: Request OTP
export const requestForgotPassword = (email: string) =>
  apiClient.post('/admin/forgot-password/request', { email });

// Step 2: Verify OTP
export const verifyForgotPasswordOTP = (email: string, otp: string) =>
  apiClient.post('/admin/forgot-password/verify-otp', { email, otp });

// Step 3: Set new password
export const setNewForgotPassword = (email: string, newPassword: string) =>
  apiClient.post('/admin/forgot-password/set-new-password', { email, newPassword });

// ── RESEND OTP ─────────────────────────────
export const requestOTPResend = (email: string) =>
  apiClient.post('/admin/login/resend-otp', { email });

// ── CURRENT USER ───────────────────────────
export const getCurrentUser = () => apiClient.get('/admin/me');

// ── REFRESH SESSION ────────────────────────
export const refreshSessionInternal = () => apiClient.post('/admin/refresh');

// ── LOGOUT ─────────────────────────────────
export const logout = () => apiClient.post('/admin/logout');
