import { Router } from 'express';
import * as authCtrl from '../controllers/auth.controller';
import { getAdminMe } from '../controllers/auth.controller';
import { authenticate } from '../../../middleware/auth.middleware';
import { requireAdminRole } from '../../../middleware/admin.middleware';

const router = Router();

// ── ADMIN LOGIN ─────────────────────────────
router.post('/login', authCtrl.adminLogin);
router.post('/login/verify', authCtrl.adminLoginVerify);

// ── ADMIN FORGOT PASSWORD ───────────────────
// Step 1: Request OTP
router.post('/forgot-password/request', authCtrl.adminForgotPasswordRequest);

// Step 2: Verify OTP
router.post('/forgot-password/verify-otp', authCtrl.adminForgotPasswordVerifyOTP);

// Step 3: Set new password
router.post('/forgot-password/set-new-password', authCtrl.adminForgotPasswordSetNewPassword);

// ── REFRESH ACCESS TOKEN ───────────────────
router.post('/refresh', authCtrl.RefreshAccessToken);

// ── GET CURRENT ADMIN PROFILE ──────────────
router.get('/me', authenticate, requireAdminRole, getAdminMe);

// ── LOGOUT ─────────────────────────────────
router.post('/logout', authCtrl.Logout);

// ── ADMIN RESEND OTP ───────────────────────
router.post('/login/resend-otp', authCtrl.adminResendOtp);

export default router;
