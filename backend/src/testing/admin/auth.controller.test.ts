/* ======================================================
   ADMIN AUTH CONTROLLER – FULL UNIT TEST (FINAL, CLEAN)
   ====================================================== */

import {
  adminLogin,
  adminLoginVerify,
  RefreshAccessToken,
  Logout,
  adminForgotPasswordRequest,
  adminForgotPasswordVerifyOTP,
  adminForgotPasswordSetNewPassword,
  getAdminMe,
  adminResendOtp,
} from '../../modules/auth/controllers/auth.controller';

import redis from '../../core/db/redis';
import { prisma } from '../../core/db/client';
import { requestOtp, verifyOtp } from '../../core/security/otp.service';
import { comparePassword, hashPassword } from '../../core/utils/bcrypt';
import { signJwt } from '../../core/auth/jwt';
import { mockReq, mockRes } from '../helpers/mockExpress';

/* ===================== MOCK EMAIL GUARD ===================== */
jest.mock('../../core/security/emailGuard', () => ({
  isEmailSafeForProduction: jest.fn(async () => ({
    valid: true,
    reason: null,
  })),
}));

/* ===================== MOCK REDIS ===================== */
jest.mock('../../core/db/redis', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  },
}));

/* ===================== MOCK PRISMA ===================== */
jest.mock('../../core/db/client', () => ({
  prisma: {
    admin: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

/* ===================== MOCK OTP ===================== */
jest.mock('../../core/security/otp.service', () => ({
  requestOtp: jest.fn(),
  verifyOtp: jest.fn(),
}));

/* ===================== MOCK BCRYPT ===================== */
jest.mock('../../core/utils/bcrypt', () => ({
  comparePassword: jest.fn(),
  hashPassword: jest.fn(),
}));

/* ===================== MOCK JWT ===================== */
jest.mock('../../core/auth/jwt', () => ({
  signJwt: jest.fn(),
}));

/* ===================== CAST MOCK ===================== */

const mockedRedis = redis as unknown as {
  get: jest.Mock;
  set: jest.Mock;
  del: jest.Mock;
};

const mockedPrisma = prisma as unknown as {
  admin: {
    findUnique: jest.Mock;
    update: jest.Mock;
  };
};

const mockedRequestOtp = requestOtp as jest.Mock;
const mockedVerifyOtp = verifyOtp as jest.Mock;
const mockedComparePassword = comparePassword as jest.Mock;
const mockedHashPassword = hashPassword as jest.Mock;
const mockedSignJwt = signJwt as jest.Mock;

/* ===================== TEST SUITE ===================== */

describe('ADMIN AUTH CONTROLLER – FULL UNIT TEST (FINAL)', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // 🔕 MATIKAN SEMUA LOG
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  /* ───────────── LOGIN STEP 1 ───────────── */
  it('adminLogin → success', async () => {
    mockedPrisma.admin.findUnique.mockResolvedValue({
      id: '1',
      email: 'admin@test.com',
      password: 'hashed',
    });

    mockedComparePassword.mockResolvedValue(true);
    mockedRequestOtp.mockResolvedValue({ success: true });
    mockedRedis.set.mockResolvedValue('OK');

    const req = mockReq({
      body: { email: 'admin@test.com', password: 'Password123' },
    });
    const res = mockRes();

    await adminLogin(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'OTP sent to your email',
      }),
    );
  });

  it('adminLogin → wrong password', async () => {
    mockedPrisma.admin.findUnique.mockResolvedValue({
      password: 'hashed',
    });

    mockedComparePassword.mockResolvedValue(false);

    const req = mockReq({
      body: { email: 'admin@test.com', password: 'WrongPass1' },
    });
    const res = mockRes();

    await adminLogin(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  /* ───────────── LOGIN VERIFY ───────────── */
  it('adminLoginVerify → success', async () => {
    mockedRedis.get.mockResolvedValue('pending');
    mockedVerifyOtp.mockResolvedValue({ success: true });

    mockedPrisma.admin.findUnique.mockResolvedValue({
      id: '1',
      role: 'ADMIN',
    });

    mockedSignJwt.mockReturnValue('jwt');

    const req = mockReq({
      body: { email: 'admin@test.com', otp: '123456' },
    });
    const res = mockRes();

    await adminLoginVerify(req, res);

    expect(res.cookie).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      message: 'Login successful',
      adminId: '1',
      role: 'ADMIN',
    });
  });

  /* ───────────── REFRESH TOKEN ───────────── */
  it('RefreshAccessToken → success', async () => {
    mockedRedis.get.mockResolvedValue('1');
    mockedRedis.del.mockResolvedValue(1);
    mockedSignJwt.mockReturnValue('new-jwt');

    const req = mockReq({
      cookies: { refreshToken: 'refresh' },
    });
    const res = mockRes();

    await RefreshAccessToken(req, res);

    expect(res.json).toHaveBeenCalledWith({
      message: 'Access token refreshed',
    });
  });

  /* ───────────── LOGOUT ───────────── */
  it('Logout → success', async () => {
    mockedRedis.del.mockResolvedValue(1);

    const req = mockReq({
      cookies: { refreshToken: 'refresh' },
    });
    const res = mockRes();

    await Logout(req, res);

    expect(res.json).toHaveBeenCalledWith({
      message: 'Logout successful',
    });
  });

  /* ───────────── FORGOT PASSWORD ───────────── */
  it('adminForgotPasswordRequest → success', async () => {
    mockedPrisma.admin.findUnique.mockResolvedValue({ id: '1' });
    mockedRequestOtp.mockResolvedValue({ success: true });

    const req = mockReq({
      body: { email: 'admin@test.com' },
    });
    const res = mockRes();

    await adminForgotPasswordRequest(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'OTP sent to your email',
      }),
    );
  });

  it('adminForgotPasswordVerifyOTP → success', async () => {
    mockedVerifyOtp.mockResolvedValue({ success: true });

    const req = mockReq({
      body: { email: 'admin@test.com', otp: '123456' },
    });
    const res = mockRes();

    await adminForgotPasswordVerifyOTP(req, res);

    expect(res.json).toHaveBeenCalledWith({
      message: 'OTP valid',
    });
  });

  it('adminForgotPasswordSetNewPassword → success', async () => {
    mockedHashPassword.mockResolvedValue('hashed');
    mockedPrisma.admin.update.mockResolvedValue({});

    const req = mockReq({
      body: { email: 'admin@test.com', newPassword: 'Password123' },
    });
    const res = mockRes();

    await adminForgotPasswordSetNewPassword(req, res);

    expect(res.json).toHaveBeenCalledWith({
      message: 'Password updated successfully',
    });
  });

  /* ───────────── GET ADMIN ME ───────────── */
  it('getAdminMe → success', async () => {
    mockedPrisma.admin.findUnique.mockResolvedValue({
      id: '1',
      email: 'admin@test.com',
      username: 'admin',
      role: 'ADMIN',
    });

    const req = mockReq({
      user: { id: '1', type: 'ADMIN' },
    });
    const res = mockRes();

    await getAdminMe(req, res);

    expect(res.json).toHaveBeenCalled();
  });

  /* ───────────── RESEND OTP ───────────── */
  it('adminResendOtp → success', async () => {
    mockedRedis.get.mockResolvedValue('pending');
    mockedRequestOtp.mockResolvedValue({ success: true });
    mockedRedis.set.mockResolvedValue('OK');

    const req = mockReq({
      body: { email: 'admin@test.com' },
    });
    const res = mockRes();

    await adminResendOtp(req, res);

    expect(res.json).toHaveBeenCalledWith({
      message: 'OTP berhasil dikirim ulang ke email Anda',
    });
  });
});
