// src/api/clientAuth.ts
import apiClientPublic from '@/utils/apiClientPublic';
import apiClientAuth from '@/utils/apiClient';

/* ======================================================
 * REGISTER
 * ==================================================== */
// Step 1: Request OTP (public, no token)
export const requestRegisterOTP = (username: string, email: string, password: string) =>
  apiClientPublic.post('/client/register/request-otp', { username, email, password });

// Resend OTP register
export const resendRegisterOTP = (email: string) =>
  apiClientPublic.post('/client/register/resend-otp', { email });

// Step 2: Verify OTP & complete registration (public)
export const completeRegister = (email: string, otp: string) =>
  apiClientPublic.post('/client/register/complete', { email, otp });

/* ======================================================
 * LOGIN
 * ==================================================== */
// Step 1: Email + Password (request OTP)
export const loginClient = (email: string, password: string) =>
  apiClientPublic.post('/client/login', { email, password });

// Resend OTP login
export const resendLoginOTP = (email: string) =>
  apiClientPublic.post('/client/login/resend-otp', { email });

// Step 2: Verify OTP
export const verifyLoginOTP = (email: string, otp: string) =>
  apiClientPublic.post('/client/login/verify', { email, otp });

/* ======================================================
 * FORGOT PASSWORD
 * ==================================================== */
// Step 1: Request OTP
export const requestForgotPasswordOTP = (email: string) =>
  apiClientPublic.post('/client/forgot-password/request', { email });

// Resend OTP forgot password
export const resendForgotPasswordOTP = (email: string) =>
  apiClientPublic.post('/client/forgot-password/resend-otp', { email });

// Step 2: Verify OTP → get resetToken
export const verifyForgotPasswordOTP = (email: string, otp: string) =>
  apiClientPublic.post('/client/forgot-password/verify-otp', { email, otp });

// Step 3: Reset password
export const resetForgotPassword = (resetToken: string, newPassword: string) =>
  apiClientPublic.post('/client/forgot-password/reset', { resetToken, newPassword });

/* ======================================================
 * SESSION & LOGOUT (requires token)
 * ==================================================== */
// Refresh session
export const refreshClientSession = () =>
  apiClientAuth.post('/client/refresh');

// Logout
export const logoutClient = () =>
  apiClientAuth.post('/client/logout');

/* ======================================================
 * CURRENT CLIENT (requires token)
 * ==================================================== */
// Get current logged-in client
export const getCurrentClient = () =>
  apiClientAuth.get('/client/me');

/* ======================================================
 * CLIENT PROFILE (UPDATE) (requires token)
 * ==================================================== */
// Request update profile (username/email langsung, password via OTP)
export const updateClientProfile = (data: {
  username?: string;
  email?: string;
  newPassword?: string;
}) => apiClientAuth.patch('/client/profile', data);

// Konfirmasi update password via OTP
export const confirmUpdatePassword = (otp: string) =>
  apiClientAuth.post('/client/profile/password/confirm', { otp });

// Konfirmasi update email via OTP
export const confirmUpdateEmail = (otp: string) =>
  apiClientAuth.post('/client/profile/email/confirm', { otp });
