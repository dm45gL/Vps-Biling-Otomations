// composables/useClientAuth.ts
import { ref, computed } from 'vue';
import * as clientApi from '@/api/clientAuth';

/* ───────── TYPES ───────── */
type Client = {
  id: string;
  email: string;
  username: string;
};

/* ───────── GLOBAL STATE ───────── */
const client = ref<Client | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

/* ───────── PENDING STATES (ANTI EMAIL DI URL) ───────── */
const pendingLoginEmail = ref<string | null>(null);
const pendingRegisterEmail = ref<string | null>(null);
const pendingForgotEmail = ref<string | null>(null);

/* ───────── FORGOT RESET TOKEN (ANTI TOKEN DI URL) ───────── */
const forgotResetToken = ref<string | null>(null);
const hasForgotResetToken = computed(() => !!forgotResetToken.value);

/* ───────── HELPERS ───────── */
const maskEmail = (email: string) => {
  const [name, domain] = email.split('@');
  if (!name || !domain) return '';
  if (name.length === 1) return `*@${domain}`;
  return `${name[0]}***@${domain}`;
};

/* ───────── MASKED EMAIL (READ-ONLY, UI ONLY) ───────── */
const maskedLoginEmail = computed(() =>
  pendingLoginEmail.value ? maskEmail(pendingLoginEmail.value) : null
);

const maskedRegisterEmail = computed(() =>
  pendingRegisterEmail.value ? maskEmail(pendingRegisterEmail.value) : null
);

const maskedForgotEmail = computed(() =>
  pendingForgotEmail.value ? maskEmail(pendingForgotEmail.value) : null
);

export const useClientAuth = () => {
  /* ───────────────── REGISTER FLOW ───────────────── */

  const register = async (
    username: string,
    email: string,
    password: string
  ) => {
    loading.value = true;
    error.value = null;

    try {
      await clientApi.requestRegisterOTP(username, email, password);
      pendingRegisterEmail.value = email;
      return true;
    } catch (err: any) {
      error.value = err?.response?.data?.error || 'Failed to request OTP';
      return false;
    } finally {
      loading.value = false;
    }
  };

  const resendRegisterOTP = async () => {
    if (!pendingRegisterEmail.value) return false;

    loading.value = true;
    error.value = null;

    try {
      await clientApi.resendRegisterOTP(pendingRegisterEmail.value);
      return true;
    } catch (err: any) {
      error.value = err?.response?.data?.error || 'Failed to resend OTP';
      return false;
    } finally {
      loading.value = false;
    }
  };

  const completeRegistration = async (otp: string) => {
    if (!pendingRegisterEmail.value) {
      error.value = 'Registration session expired';
      return null;
    }

    loading.value = true;
    error.value = null;

    try {
      const res = await clientApi.completeRegister(
        pendingRegisterEmail.value,
        otp
      );

      pendingRegisterEmail.value = null;
      await fetchCurrentClient();

      return res.data.clientId;
    } catch (err: any) {
      error.value =
        err?.response?.data?.error || 'Failed to complete registration';
      return null;
    } finally {
      loading.value = false;
    }
  };

  /* ───────────────── LOGIN FLOW ───────────────── */

  const login = async (email: string, password: string) => {
    loading.value = true;
    error.value = null;

    try {
      await clientApi.loginClient(email, password);
      pendingLoginEmail.value = email;
      return true;
    } catch (err: any) {
      error.value = err?.response?.data?.error || 'Login failed';
      return false;
    } finally {
      loading.value = false;
    }
  };

  const resendLoginOTP = async () => {
    if (!pendingLoginEmail.value) return false;

    loading.value = true;
    error.value = null;

    try {
      await clientApi.resendLoginOTP(pendingLoginEmail.value);
      return true;
    } catch (err: any) {
      error.value =
        err?.response?.data?.error || 'Failed to resend login OTP';
      return false;
    } finally {
      loading.value = false;
    }
  };

  const verifyLogin = async (otp: string) => {
    if (!pendingLoginEmail.value) {
      error.value = 'Login session expired';
      return null;
    }

    loading.value = true;
    error.value = null;

    try {
      const res = await clientApi.verifyLoginOTP(
        pendingLoginEmail.value,
        otp
      );

      pendingLoginEmail.value = null;
      await fetchCurrentClient();

      return res.data.clientId;
    } catch (err: any) {
      error.value =
        err?.response?.data?.error || 'OTP verification failed';
      return null;
    } finally {
      loading.value = false;
    }
  };

  /* ───────────────── FORGOT PASSWORD FLOW ───────────────── */

  const requestForgotPassword = async (email: string) => {
    loading.value = true;
    error.value = null;

    try {
      await clientApi.requestForgotPasswordOTP(email);
      pendingForgotEmail.value = email;
      return true;
    } catch (err: any) {
      error.value =
        err?.response?.data?.error || 'Failed to request OTP';
      return false;
    } finally {
      loading.value = false;
    }
  };

  const resendForgotPasswordOTP = async () => {
    if (!pendingForgotEmail.value) return false;

    loading.value = true;
    error.value = null;

    try {
      await clientApi.resendForgotPasswordOTP(pendingForgotEmail.value);
      return true;
    } catch (err: any) {
      error.value =
        err?.response?.data?.error || 'Failed to resend OTP';
      return false;
    } finally {
      loading.value = false;
    }
  };

  const verifyForgotPassword = async (otp: string) => {
    if (!pendingForgotEmail.value) {
      error.value = 'Reset session expired';
      return false;
    }

    loading.value = true;
    error.value = null;

    try {
      const res = await clientApi.verifyForgotPasswordOTP(
        pendingForgotEmail.value,
        otp
      );

      pendingForgotEmail.value = null;
      forgotResetToken.value = res.data.resetToken;

      return true;
    } catch (err: any) {
      error.value =
        err?.response?.data?.error || 'OTP verification failed';
      return false;
    } finally {
      loading.value = false;
    }
  };

  const resetPassword = async (newPassword: string) => {
    if (!forgotResetToken.value) {
      error.value = 'Reset session expired';
      return false;
    }

    loading.value = true;
    error.value = null;

    try {
      await clientApi.resetForgotPassword(
        forgotResetToken.value,
        newPassword
      );

      // bersihkan semua jejak
      forgotResetToken.value = null;
      pendingForgotEmail.value = null;

      return true;
    } catch (err: any) {
      error.value =
        err?.response?.data?.error || 'Failed to reset password';
      return false;
    } finally {
      loading.value = false;
    }
  };

  /* ───────────────── SESSION ───────────────── */

  const fetchCurrentClient = async () => {
    try {
      const res = await clientApi.getCurrentClient();
      client.value = res.data.client;
      return client.value;
    } catch {
      client.value = null;
      return null;
    }
  };

  const refreshSession = async () => {
    try {
      await clientApi.refreshClientSession();
      await fetchCurrentClient();
    } catch (err) {
      console.error('Refresh session failed', err);
    }
  };

  const logout = async () => {
    try {
      await clientApi.logoutClient();
      client.value = null;
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  /* ───────────────── EXPORT ───────────────── */

  return {
    client,
    loading,
    error,

    // masked email (UI only)
    maskedLoginEmail,
    maskedRegisterEmail,
    maskedForgotEmail,

    // forgot reset token state
    hasForgotResetToken,

    // register
    register,
    resendRegisterOTP,
    completeRegistration,

    // login
    login,
    resendLoginOTP,
    verifyLogin,

    // forgot
    requestForgotPassword,
    resendForgotPasswordOTP,
    verifyForgotPassword,
    resetPassword,

    // session
    fetchCurrentClient,
    refreshSession,
    logout,
  };
};
