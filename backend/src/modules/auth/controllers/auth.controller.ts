import { Request, Response } from 'express';
import redis from '../../../core/db/redis';
import { prisma } from '../../../core/db/client';
import { hashPassword, comparePassword } from '../../../core/utils/bcrypt';
import { signJwt } from '../../../core/auth/jwt';
import { requestOtp, verifyOtp } from '../../../core/security/otp.service';
import {
  adminLoginRequestSchema,
  adminLoginVerifySchema,
  adminForgotPasswordRequestSchema,
  adminForgotPasswordVerifyOTPSchema,
  adminForgotPasswordSetNewPasswordSchema,
} from '../dto/auth.dto';
import crypto from 'crypto';
import logger from '../../../core/utils/loger';
import { isEmailSafeForProduction } from '../../../core/security/emailGuard';

// ── GENERATE REFRESH TOKEN ─────────────
export const generateRefreshToken = (): string => crypto.randomBytes(64).toString('hex'); // 128 karakter

// ── HASH TOKEN ─────────────
const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

// ── SAVE REFRESH TOKEN SAAT LOGIN ─────────────
export const saveRefreshToken = async (adminId: string, refreshToken: string) => {
  const hashedToken = hashToken(refreshToken);
  await redis.set(`admin:refresh:${hashedToken}`, adminId, { EX: 12 * 60 * 60 }); // 12 jam
};

// ── ADMIN LOGIN STEP 1: PASSWORD → OTP ─────────────
export const adminLogin = async (req: Request, res: Response) => {
  try {
    const result = adminLoginRequestSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: 'Validation failed', details: result.error.format() });

    const { email, password } = result.data;

    const emailCheck = await isEmailSafeForProduction(email);
    if (!emailCheck.valid) return res.status(400).json({ error: emailCheck.reason });

    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) return res.status(400).json({ error: 'Email or password incorrect' });

    const valid = await comparePassword(password, admin.password);
    if (!valid) return res.status(400).json({ error: 'Email or password incorrect' });

    const otpResult = await requestOtp(email);
    if (!otpResult.success) return res.status(429).json({ error: otpResult.message });

    await redis.set(`admin:login:${email}`, 'pending', { EX: 300 }); // 5 menit

    logger.info(`OTP requested for admin ${email}`);
    return res.json({ message: 'OTP sent to your email' });
  } catch (err) {
    logger.error('adminLogin error: %o', err);
    return res.status(500).json({ error: 'Admin login failed' });
  }
};

// ── ADMIN LOGIN STEP 2: VERIFY OTP → JWT + REFRESH TOKEN ───────────
export const adminLoginVerify = async (req: Request, res: Response) => {
  try {
    const result = adminLoginVerifySchema.safeParse(req.body);
    if (!result.success)
      return res.status(400).json({ error: 'Validation failed', details: result.error.format() });

    const { email, otp } = result.data;

    const temp = await redis.get(`admin:login:${email}`);
    if (!temp) return res.status(400).json({ error: 'OTP session expired or invalid' });

    const otpResult = await verifyOtp(email, otp);
    if (!otpResult.success) return res.status(400).json({ error: otpResult.message });

    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) return res.status(404).json({ error: 'Admin not found' });

    const accessToken = signJwt(admin.id, 'ADMIN');
    const refreshToken = generateRefreshToken();
    await saveRefreshToken(admin.id, refreshToken);

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60,
      path: '/',
    });
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 12 * 60 * 60 * 1000,
      path: '/',
    });

    await redis.del(`admin:login:${email}`);
    await redis.del(`admin:otp:${email}`);

    logger.info(`Admin ${admin.id} logged in successfully`);
    return res.json({ message: 'Login successful', adminId: admin.id, role: admin.role });
  } catch (err) {
    logger.error('adminLoginVerify error: %o', err);
    return res.status(500).json({ error: 'Admin login verification failed' });
  }
};

// ── REFRESH ACCESS TOKEN ADMIN ─────────────
export const RefreshAccessToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) return res.status(401).json({ error: 'No refresh token provided' });

    const hashedToken = hashToken(refreshToken);
    const adminId = await redis.get(`admin:refresh:${hashedToken}`);
    if (!adminId) return res.status(401).json({ error: 'Invalid or expired refresh token' });

    const newAccessToken = signJwt(adminId, 'ADMIN');
    const newRefreshToken = generateRefreshToken();
    await saveRefreshToken(adminId, newRefreshToken);

    await redis.del(`admin:refresh:${hashedToken}`);

    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60,
      path: '/',
    });
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 12 * 60 * 60 * 1000,
      path: '/',
    });

    logger.info(`Access token refreshed for admin ${adminId}`);
    return res.json({ message: 'Access token refreshed' });
  } catch (err) {
    logger.error('RefreshAccessToken error: %o', err);
    return res.status(500).json({ error: 'Failed to refresh access token' });
  }
};

// ── LOGOUT ADMIN ─────────────
export const Logout = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.cookies;
    if (refreshToken) {
      const hashedToken = hashToken(refreshToken);
      await redis.del(`admin:refresh:${hashedToken}`);
    }

    res.cookie('accessToken', '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', expires: new Date(0), path: '/' });
    res.cookie('refreshToken', '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', expires: new Date(0), path: '/' });

    logger.info('Admin logged out');
    return res.json({ message: 'Logout successful' });
  } catch (err) {
    logger.error('Logout error: %o', err);
    return res.status(500).json({ error: 'Logout failed' });
  }
};

// ── ADMIN FORGOT PASSWORD: Request OTP ─────────────
export const adminForgotPasswordRequest = async (req: Request, res: Response) => {
  try {
    const parse = adminForgotPasswordRequestSchema.safeParse(req.body);
    if (!parse.success)
      return res.status(400).json({ error: "Validation failed", details: parse.error.format() });

    const { email } = parse.data;

    const emailCheck = await isEmailSafeForProduction(email);
    if (!emailCheck.valid) return res.status(400).json({ error: emailCheck.reason });

    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) return res.status(404).json({ error: "Admin not found" });

    const otp = await requestOtp(email);
    if (!otp.success) return res.status(429).json({ error: otp.message });

    logger.info(`OTP requested for admin ${email}`);
    return res.json({ message: "OTP sent to your email" });
  } catch (err) {
    logger.error("adminForgotPasswordRequest error: %o", err);
    return res.status(500).json({ error: "Failed to request password reset" });
  }
};

// ── ADMIN FORGOT PASSWORD: Verify OTP ─────────────
export const adminForgotPasswordVerifyOTP = async (req: Request, res: Response) => {
  try {
    const parse = adminForgotPasswordVerifyOTPSchema.safeParse(req.body);
    if (!parse.success)
      return res.status(400).json({ error: "Validation failed", details: parse.error.format() });

    const { email, otp } = parse.data;
    const otpCheck = await verifyOtp(email, otp);
    if (!otpCheck.success) return res.status(400).json({ error: otpCheck.message });

    return res.json({ message: "OTP valid" });
  } catch (err) {
    logger.error("adminForgotPasswordVerifyOTP error: %o", err);
    return res.status(500).json({ error: "Failed to verify OTP" });
  }
};

// ── ADMIN FORGOT PASSWORD: Set New Password ─────────────
export const adminForgotPasswordSetNewPassword = async (req: Request, res: Response) => {
  try {
    const parse = adminForgotPasswordSetNewPasswordSchema.safeParse(req.body);
    if (!parse.success)
      return res.status(400).json({ error: "Validation failed", details: parse.error.format() });

    const { email, newPassword } = parse.data;
    const hashed = await hashPassword(newPassword);
    await prisma.admin.update({ where: { email }, data: { password: hashed } });

    logger.info(`Password updated for admin ${email}`);
    return res.json({ message: "Password updated successfully" });
  } catch (err) {
    logger.error("adminForgotPasswordSetNewPassword error: %o", err);
    return res.status(500).json({ error: "Failed to reset password" });
  }
};

// ── GET CURRENT ADMIN PROFILE ─────────────
export const getAdminMe = async (req: Request, res: Response) => {
  try {
    if (!req.user || req.user.type !== 'ADMIN')
      return res.status(401).json({ error: 'Unauthorized: Admin not authenticated' });

    const admin = await prisma.admin.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!admin) return res.status(404).json({ error: 'Admin not found' });

    return res.json({ admin });
  } catch (err) {
    logger.error('getAdminMe error: %o', err);
    return res.status(500).json({ error: 'Failed to fetch admin profile' });
  }
};

// ── ADMIN RESEND OTP ─────────────
export const adminResendOtp = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const session = await redis.get(`admin:login:${email}`);
    if (!session) return res.status(400).json({ error: 'No pending OTP session. Please login first.' });

    const otpResult = await requestOtp(email);
    if (!otpResult.success) return res.status(429).json({ error: otpResult.message });

    await redis.set(`admin:login:${email}`, 'pending', { EX: 300 });

    logger.info(`OTP resent for admin ${email}`);
    return res.json({ message: 'OTP berhasil dikirim ulang ke email Anda' });
  } catch (err) {
    logger.error('adminResendOtp error: %o', err);
    return res.status(500).json({ error: 'Failed to resend OTP' });
  }
};
