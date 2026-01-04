// modules/client/routes/auth.routes.ts

import { Router } from 'express';
import * as authCtrl from '../controllers/auth.controller';
import { authenticate } from '../../../middleware/auth.middleware';

const router = Router();

/* =====================================================
 * REGISTER
 * =================================================== */
router.post('/register/request-otp', authCtrl.requestRegisterOtp);
router.post('/register/complete', authCtrl.completeRegister);
// Resend OTP register
router.post('/register/resend-otp', authCtrl.resendRegisterOtp);

/* =====================================================
 * LOGIN (OTP)
 * =================================================== */
router.post('/login', authCtrl.loginClient);
router.post('/login/verify', authCtrl.loginVerify);
// Resend OTP login
router.post('/login/resend-otp', authCtrl.resendLoginOtp);

/* =====================================================
 * FORGOT PASSWORD (3 STEP)
 * =================================================== */
// Step 1: Request OTP
router.post('/forgot-password/request', authCtrl.forgotPasswordRequest);

// Step 1b: Resend OTP forgot password
router.post('/forgot-password/resend-otp', authCtrl.resendForgotPasswordOtp);

// Step 2: Verify OTP → get resetToken
router.post('/forgot-password/verify-otp', authCtrl.forgotPasswordVerifyOtp);

// Step 3: Reset password (resetToken + new password)
router.post('/forgot-password/reset', authCtrl.forgotPasswordReset);

/* =====================================================
 * AUTH SESSION
 * =================================================== */
// Refresh access token
router.post('/refresh', authCtrl.refreshAccessToken);

// Get current client profile
router.get('/me', authenticate, authCtrl.getClientMe);

// Logout
router.post('/logout', authCtrl.logout);

/* =====================================================
 * CLIENT PROFILE (UPDATE)
 * =================================================== */
router.patch('/profile', authenticate, authCtrl.updateClientProfile); 
router.post('/profile/password/confirm', authenticate, authCtrl.confirmUpdatePassword); 
router.post('/profile/email/confirm', authenticate, authCtrl.confirmUpdateEmail);

export default router;
