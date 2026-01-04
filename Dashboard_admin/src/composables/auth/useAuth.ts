import { ref } from 'vue';
import {
  getCurrentUser,
  login as apiLogin,
  verifyOTP as apiVerifyOTP,
  logout as apiLogout,
  requestOTPResend as apiRequestOTPResend,
  requestForgotPassword as apiRequestForgotPassword,
  verifyForgotPasswordOTP as apiVerifyForgotPasswordOTP,
  setNewForgotPassword as apiSetNewForgotPassword,
} from '@/api/auth';
import type { NullableAdminProfile, AdminUserResponse } from '@/types/auth';

const user = ref<NullableAdminProfile>(null);
const isAuthenticated = ref(false);
const pendingEmailForOTP = ref<string | null>(null);
const loadingAuth = ref(true);

let initialFetchDone = false;

export function useAuth() {
  // ── FETCH USER ─────────────────────────────
  const fetchUser = async () => {
    if (initialFetchDone) return;
    initialFetchDone = true;
    loadingAuth.value = true;

    try {
      const res = await getCurrentUser();
      user.value = (res.data as AdminUserResponse).admin;
      isAuthenticated.value = true;
      pendingEmailForOTP.value = null;
    } catch (err: any) {
      if (err.response?.status !== 401) console.error('Unexpected auth error:', err);
      user.value = null;
      isAuthenticated.value = false;
      pendingEmailForOTP.value = null;
    } finally {
      loadingAuth.value = false;
    }
  };

  // ── LOGIN ──────────────────────────────────
  const performLogin = async (email: string, password: string) => {
    try {
      await apiLogin(email, password);
      pendingEmailForOTP.value = email;
      return { needsOTP: true };
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Login gagal';
      throw new Error(msg);
    }
  };

  const performOTPVerify = async (otp: string) => {
    if (!pendingEmailForOTP.value) throw new Error('Email tidak ditemukan untuk verifikasi OTP');
    await apiVerifyOTP(pendingEmailForOTP.value, otp);
    initialFetchDone = false;
    await fetchUser();
    pendingEmailForOTP.value = null;
  };

  // ── FORGOT PASSWORD ───────────────────────
  // Step 1: Request OTP
  const requestForgotPassword = async (email: string) => {
    try {
      await apiRequestForgotPassword(email);
      pendingEmailForOTP.value = email;
    } catch (err: any) {
      const code = err.response?.data?.code || err.response?.data?.type;
      if (code === 'EMAIL_NOT_FOUND' || code === 'email_not_found') {
        throw new Error('Email tidak terdaftar dalam sistem kami.');
      }
      throw new Error(err.response?.data?.message || 'Email anda tidak ditemukan!');
    }
  };

  // Step 2: Verify OTP
  const verifyForgotPasswordOTP = async (otp: string) => {
    if (!pendingEmailForOTP.value) throw new Error('Email tidak ditemukan untuk verifikasi OTP');
    await apiVerifyForgotPasswordOTP(pendingEmailForOTP.value, otp);
  };

  // Step 3: Set New Password
  const setNewForgotPassword = async (newPassword: string) => {
    if (!pendingEmailForOTP.value) throw new Error('Email tidak ditemukan untuk reset password');
    await apiSetNewForgotPassword(pendingEmailForOTP.value, newPassword);
    pendingEmailForOTP.value = null;
  };

  // ── RESEND OTP ───────────────────────────
  const resendOTP = async () => {
    if (!pendingEmailForOTP.value) throw new Error('Email tidak ditemukan');
    return apiRequestOTPResend(pendingEmailForOTP.value);
  };

  // ── LOGOUT ───────────────────────────────
  const performLogout = async () => {
    try { await apiLogout(); } catch (_) {}
    user.value = null;
    isAuthenticated.value = false;
    pendingEmailForOTP.value = null;
    initialFetchDone = false;
  };

  return {
    user,
    isAuthenticated,
    pendingEmailForOTP,
    loadingAuth,
    fetchUser,
    performLogin,
    performOTPVerify,
    requestForgotPassword,
    verifyForgotPasswordOTP,
    setNewForgotPassword,
    resendOTP,
    performLogout,
  };
}

export type AuthReturn = ReturnType<typeof useAuth>;
