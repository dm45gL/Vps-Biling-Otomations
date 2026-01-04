// modules/client/controllers/auth.controller.ts
import { Request, Response } from 'express';
import redis from '../../../core/db/redis';
import { prisma } from '../../../core/db/client';
import { hashPassword, comparePassword } from '../../../core/utils/bcrypt';
import { signJwt } from '../../../core/auth/jwt';
import { requestOtp, verifyOtp } from '../../../core/security/otp.service';
import {
  registerRequestSchema,
  registerCompleteSchema,
  loginRequestSchema,
  loginVerifySchema,
  forgotPasswordRequestSchema,
  forgotPasswordVerifyOtpSchema,
  forgotPasswordResetSchema,
  updateProfileSchema
} from '../dto/auth.dto';
import crypto from 'crypto';
import { isValidEmailFormat, isDisposableEmail, hasValidMxRecord } from '../../../core/security/emailGuard';
import logger from '../../../core/utils/loger';

// ── UTILS ─────────────
const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');
export const generateRefreshToken = (): string => crypto.randomBytes(64).toString('hex');

export const saveRefreshToken = async (clientId: string, refreshToken: string) => {
  const hashedToken = hashToken(refreshToken);
  await redis.set(`refresh:${hashedToken}`, clientId, { EX: 12 * 60 * 60 });
};

// Rate limit OTP (max 3x / 5 menit)
const checkOtpRateLimit = async (key: string) => {
  const current = await redis.get(key);
  if (current && Number.parseInt(current) >= 3) return false;
  await redis.incr(key);
  await redis.expire(key, 5 * 60);
  return true;
};

// Validasi email produksi
const validateEmailProduction = async (email: string) => {
  if (!isValidEmailFormat(email)) throw new Error('Format email tidak valid');
  if (isDisposableEmail(email)) throw new Error('Email sementara tidak diperbolehkan');
  if (!(await hasValidMxRecord(email))) throw new Error('Domain email tidak dapat menerima email');
};

// ── REGISTER ─────────────
export const requestRegisterOtp = async (req: Request, res: Response) => {
  try {
    const result = registerRequestSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: 'Validation failed', details: result.error.format() });

    const { username, email, password } = result.data;
    await validateEmailProduction(email);

    const emailExists = await prisma.client.findUnique({ where: { email } });
    const usernameExists = await prisma.client.findUnique({ where: { username } });
    if (emailExists || usernameExists) return res.status(400).json({ error: 'Email or username already taken' });

    const hashedPassword = await hashPassword(password);
    await redis.set(`register:${email}`, JSON.stringify({ username, hashedPassword }), { EX: 300 });

    if (!(await checkOtpRateLimit(`resend:register:${email}`)))
      return res.status(429).json({ error: 'OTP request limit reached. Try later.' });

    const otpResult = await requestOtp(email);
    if (!otpResult.success) {
      await redis.del(`register:${email}`);
      return res.status(429).json({ error: otpResult.message });
    }

    logger.info(`OTP registration requested for ${email}`);
    return res.json({ message: 'OTP sent to your email' });
  } catch (err: unknown) {
  if (err instanceof Error) {
    logger.error('requestRegisterOtp error: %o', err.message);
  } else {
    logger.error('requestRegisterOtp unknown error: %o', err);
  }
  return res.status(500).json({ error: 'Failed to process registration' });
}

};

export const completeRegister = async (req: Request, res: Response) => {
  try {
    const result = registerCompleteSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: 'Validation failed', details: result.error.format() });

    const { email, otp } = result.data;
    const tempDataStr = await redis.get(`register:${email}`);
    if (!tempDataStr) return res.status(400).json({ error: 'Registration session expired' });

    const { username, hashedPassword } = JSON.parse(tempDataStr);
    const otpResult = await verifyOtp(email, otp);
    if (!otpResult.success) return res.status(400).json({ error: otpResult.message });

    const emailExists = await prisma.client.findUnique({ where: { email } });
    const usernameExists = await prisma.client.findUnique({ where: { username } });
    if (emailExists || usernameExists) {
      await redis.del(`register:${email}`);
      return res.status(400).json({ error: 'Email or username already taken' });
    }

    const client = await prisma.client.create({ data: { username, email, password: hashedPassword } });
    await redis.del(`register:${email}`);

    const token = signJwt(client.id, 'CLIENT');
    res.cookie('accessToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 1000 * 60 * 60,
    });

    logger.info(`Client registered successfully: ${email}`);
    return res.status(201).json({ message: 'Registration successful', clientId: client.id });
  }

  catch (err: unknown) {
  if (err instanceof Error) {
    logger.error('completeRegister error: %o', err.message);
  } else {
    logger.error('completeRegister unknown error: %o', err);
  }
  return res.status(500).json({ error: 'Failed to process completeRegister' });
}
};

// ── LOGIN ─────────────
export const loginClient = async (req: Request, res: Response) => {
  try {
    const result = loginRequestSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: 'Validation failed', details: result.error.format() });

    const { email, password } = result.data;
    await validateEmailProduction(email);

    const client = await prisma.client.findUnique({ where: { email } });
    if (!client || !(await comparePassword(password, client.password))) {
      return res.status(400).json({ error: 'Email or password incorrect' });
    }

    if (!(await checkOtpRateLimit(`resend:login:${email}`)))
      return res.status(429).json({ error: 'OTP request limit reached. Try later.' });

    const otpResult = await requestOtp(email);
    if (!otpResult.success) return res.status(429).json({ error: otpResult.message });

    await redis.set(`login:${email}`, 'pending', { EX: 300 });
    logger.info(`OTP login requested for ${email}`);
    return res.json({ message: 'OTP sent to your email' });
  }
   catch (err: unknown) {
  if (err instanceof Error) {
    logger.error('loginClient error: %o', err.message);
  } else {
    logger.error('loginClient unknown error: %o', err);
  }
  return res.status(500).json({ error: 'Failed to process loginClient' });
}

};

export const loginVerify = async (req: Request, res: Response) => {
  try {
    const result = loginVerifySchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: 'Validation failed', details: result.error.format() });

    const { email, otp } = result.data;
    const temp = await redis.get(`login:${email}`);
    if (!temp) return res.status(400).json({ error: 'OTP session expired or invalid' });

    const otpResult = await verifyOtp(email, otp);
    if (!otpResult.success) return res.status(400).json({ error: otpResult.message });

    const client = await prisma.client.findUnique({ where: { email } });
    if (!client) return res.status(404).json({ error: 'User not found' });

    const accessToken = signJwt(client.id, 'CLIENT');
    const refreshToken = generateRefreshToken();
    await saveRefreshToken(client.id, refreshToken);
    await redis.del(`login:${email}`);

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
    };

    res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 1000 * 60 * 60 });
    res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 12 * 60 * 60 * 1000 });

    logger.info(`Client logged in successfully: ${email}`);
    return res.json({ message: 'Login successful', clientId: client.id });
  }


   catch (err: unknown) {
  if (err instanceof Error) {
    logger.error('loginVerify error: %o', err.message);
  } else {
    logger.error('loginVerify unknown error: %o', err);
  }
  return res.status(500).json({ error: 'Failed to process loginVerify' });
}

};

// ── RESEND OTP ─────────────
export const resendRegisterOtp = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const tempDataStr = await redis.get(`register:${email}`);
    if (!tempDataStr) return res.status(400).json({ error: 'Registration session expired' });

    if (!(await checkOtpRateLimit(`resend:register:${email}`)))
      return res.status(429).json({ error: 'OTP resend limit reached. Try later.' });

    const otpResult = await requestOtp(email);
    if (!otpResult.success) return res.status(429).json({ error: otpResult.message });

    logger.info(`OTP resent for registration: ${email}`);
    return res.json({ message: 'OTP resent to your email' });



  } catch (err: unknown) {
  if (err instanceof Error) {
    logger.error('resendRegisterOtp error: %o', err.message);
  } else {
    logger.error('resendRegisterOtp unknown error: %o', err);
  }
  return res.status(500).json({ error: 'Failed to process resendRegisterOtp' });
}

};

export const resendLoginOtp = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const temp = await redis.get(`login:${email}`);
    if (!temp) return res.status(400).json({ error: 'Login session expired or invalid' });

    if (!(await checkOtpRateLimit(`resend:login:${email}`)))
      return res.status(429).json({ error: 'OTP resend limit reached. Try later.' });

    const otpResult = await requestOtp(email);
    if (!otpResult.success) return res.status(429).json({ error: otpResult.message });

    logger.info(`OTP resent for login: ${email}`);
    return res.json({ message: 'OTP resent to your email' });

   } catch (err: unknown) {
  if (err instanceof Error) {
    logger.error('resendLoginOtp error: %o', err.message);
  } else {
    logger.error('resendLoginOtp unknown error: %o', err);
  }
  return res.status(500).json({ error: 'Failed to process resend nOtp' });
}
};

export const resendForgotPasswordOtp = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const temp = await redis.get(`forgot:${email}`);
    if (!temp) return res.status(400).json({ error: 'Forgot password session expired' });

    if (!(await checkOtpRateLimit(`resend:forgot:${email}`)))
      return res.status(429).json({ error: 'OTP resend limit reached. Try later.' });

    const otpResult = await requestOtp(email);
    if (!otpResult.success) return res.status(429).json({ error: otpResult.message });

    logger.info(`OTP resent for forgot password: ${email}`);
    return res.json({ message: 'OTP resent to your email' });


    } catch (err: unknown) {
  if (err instanceof Error) {
    logger.error('resendForgotPasswordOtp error: %o', err.message);
  } else {
    logger.error('resendForgotPasswordOtp unknown error: %o', err);
  }
  return res.status(500).json({ error: 'Failed to process  resend OTP' });
}
};

// ── REFRESH / LOGOUT / FORGOT PASSWORD / PROFILE ─────────────
export const refreshAccessToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) return res.status(401).json({ error: 'No refresh token provided' });

    const hashedToken = hashToken(refreshToken);
    const clientId = await redis.get(`refresh:${hashedToken}`);
    if (!clientId) return res.status(401).json({ error: 'Invalid or expired refresh token' });

    const newAccessToken = signJwt(clientId, 'CLIENT');
    const newRefreshToken = generateRefreshToken();
    const newHashedToken = hashToken(newRefreshToken);

    await redis.set(`refresh:${newHashedToken}`, clientId, { EX: 12 * 60 * 60 });
    await redis.del(`refresh:${hashedToken}`);

    const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' as const, path: '/' };
    res.cookie('accessToken', newAccessToken, { ...cookieOptions, maxAge: 1000 * 60 * 60 });
    res.cookie('refreshToken', newRefreshToken, { ...cookieOptions, maxAge: 12 * 60 * 60 * 1000 });

    logger.info(`Access token refreshed for clientId: ${clientId}`);
    return res.json({ message: 'Access token refreshed' });
      } catch (err: unknown) {
  if (err instanceof Error) {
    logger.error('refreshAccessToken error: %o', err.message);
  } else {
    logger.error('refreshAccessToken unknown error: %o', err);
  }
  return res.status(500).json({ error: 'Failed to efresh access token' });
}
};

export const logout = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.cookies;
    if (refreshToken) {
      const hashedToken = hashToken(refreshToken);
      await redis.del(`refresh:${hashedToken}`);
    }

    const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' as const, expires: new Date(0), path: '/' };
    res.cookie('accessToken', '', cookieOptions);
    res.cookie('refreshToken', '', cookieOptions);

    logger.info(`Client logged out`);
    return res.json({ message: 'Logout successful' });


        } catch (err: unknown) {
  if (err instanceof Error) {
    logger.error('logout error: %o', err.message);
  } else {
    logger.error('logout unknown error: %o', err);
  }
  return res.status(500).json({ error: 'Failed to logout' });
}
};

export const forgotPasswordRequest = async (req: Request, res: Response) => {
  try {
    const parse = forgotPasswordRequestSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: 'Validation failed', details: parse.error.format() });
    }

    const { email } = parse.data;

    // Validasi email produksi, tetapi jika gagal, lanjutkan dengan respons umum
    try {
          await validateEmailProduction(email);
        } catch {
          logger.warn(`Email validation failed during forgot password for: ${email}`);
        }


    const client = await prisma.client.findUnique({ where: { email } });

    if (client) {
      // Hanya proses OTP jika klien ditemukan
      if (await checkOtpRateLimit(`resend:forgot:${email}`)) {
        const otpResult = await requestOtp(email);
        if (otpResult.success) {
          await redis.set(`forgot:${email}`, 'otp_pending', { EX: 300 });
          logger.info(`Forgot password OTP requested for ${email}`);
        } else {
          logger.error(`Failed to send OTP for ${email}: ${otpResult.message}`);
          // Fail silently untuk menghindari timing attack
        }
      } else {
        logger.warn(`Rate limit reached for forgot password: ${email}`);
      }
    } else {
      // Jika klien tidak ditemukan, log tapi tetap respons OK
      logger.warn(`Forgot password requested for non-existent client: ${email}`);
    }

    // Kirim respons sukses umum
    return res.json({
      message: 'If an account with that email exists, an OTP has been sent to your email.'
    });

  } catch (err: unknown) {
    if (err instanceof Error) {
      logger.error('forgotPasswordRequest error: %o', err.message);
    } else {
      logger.error('forgotPasswordRequest unknown error: %o', err);
    }
    return res.status(500).json({ error: 'Failed to process forgotPassword' });
  }
};


const generateResetToken = () => crypto.randomBytes(32).toString('hex');

export const forgotPasswordVerifyOtp = async (req: Request, res: Response) => {
  try {
    const parse = forgotPasswordVerifyOtpSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: 'Validation failed', details: parse.error.format() });

    const { email, otp } = parse.data;
    const temp = await redis.get(`forgot:${email}`);
    if (!temp) return res.status(400).json({ error: 'OTP session expired or invalid' });

    const otpResult = await verifyOtp(email, otp);
    if (!otpResult.success) return res.status(400).json({ error: 'OTP invalid' });

    const resetToken = generateResetToken();
    await redis.set(`forgot:verified:${resetToken}`, email, { EX: 600 });
    await redis.del(`forgot:${email}`);

    logger.info(`Forgot password OTP verified for ${email}`);
    return res.json({ message: 'OTP verified', resetToken });


    } catch (err: unknown) {
  if (err instanceof Error) {
    logger.error('forgotPasswordVerifyOtp error: %o', err.message);
  } else {
    logger.error('forgotPasswordVerifyOtp unknown error: %o', err);
  }
  return res.status(500).json({ error: 'Failed to verify OTP' });
}
};

export const forgotPasswordReset = async (req: Request, res: Response) => {
  try {
    const parse = forgotPasswordResetSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: 'Validation failed', details: parse.error.format() });

    const { resetToken, newPassword } = parse.data;
    const email = await redis.get(`forgot:verified:${resetToken}`);
    if (!email) return res.status(400).json({ error: 'Invalid or expired reset token' });

    const hashedPassword = await hashPassword(newPassword);
    await prisma.client.update({ where: { email }, data: { password: hashedPassword } });
    await redis.del(`forgot:verified:${resetToken}`);

    logger.info(`Password reset successfully for ${email}`);
    return res.json({ message: 'Password updated successfully' });



      } catch (err: unknown) {
  if (err instanceof Error) {
    logger.error('forgotPasswordReset error: %o', err.message);
  } else {
    logger.error('forgotPasswordReset unknown error: %o', err);
  }
  return res.status(500).json({ error: 'Failed to  reset password' });
}
};

// ── GET CURRENT CLIENT PROFILE ─────────────
export const getClientMe = async (req: Request, res: Response) => {
  try {
    // Pastikan user terautentikasi dan bertipe CLIENT
    if (!req.user || req.user.type !== 'CLIENT') {
      logger.warn(`Unauthorized access attempt to getClientMe`);
      return res.status(401).json({ error: 'Unauthorized: Client not authenticated' });
    }

    // Ambil data client dari DB
    const client = await prisma.client.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, username: true, createdAt: true, updatedAt: true },
    });

    if (!client) {
      logger.warn(`Client not found for id: ${req.user.id}`);
      return res.status(404).json({ error: 'Client not found' });
    }

    return res.json({ client });
      } catch (err: unknown) {
  if (err instanceof Error) {
    logger.error('getClientMe error: %o', err.message);
  } else {
    logger.error('getClientMe unknown error: %o', err);
  }
  return res.status(500).json({ error: 'Failed to fetch client profile' });
}
};



// ── UPDATE CLIENT PROFILE ─────────────
export const updateClientProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user || req.user.type !== 'CLIENT') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const parse = updateProfileSchema.safeParse(req.body);
    if (!parse.success)
      return res
        .status(400)
        .json({ error: 'Validation failed', details: parse.error.format() });

    const { username, email, newPassword } = parse.data;
    const clientId = req.user.id;

    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) return res.status(404).json({ error: 'Client not found' });

    type ClientUpdates = {
      username?: string;
      // email dan password tidak diupdate langsung di DB di sini, karena pakai OTP
    };

    const updates: ClientUpdates = {};

    // EDIT USERNAME
    if (username && username !== client.username) {
      const exists = await prisma.client.findUnique({ where: { username } });
      if (exists) return res.status(400).json({ error: 'Username already taken' });
      updates.username = username;
    }

    // EDIT EMAIL
    if (email && email !== client.email) {
      await validateEmailProduction(email);
      const exists = await prisma.client.findUnique({ where: { email } });
      if (exists) return res.status(400).json({ error: 'Email already taken' });

      const keyEmail = `profile:email:${clientId}`;
      await redis.set(keyEmail, email, { EX: 600 });

      const otpResult = await requestOtp(email);
      if (!otpResult.success) return res.status(429).json({ error: otpResult.message });

      return res.json({ message: 'OTP sent to new email. Confirm to update email.' });
    }

    // EDIT PASSWORD
    if (newPassword) {
      const hashedTemp = await hashPassword(newPassword);
      const keyPass = `profile:password:${clientId}`;
      await redis.set(keyPass, hashedTemp, { EX: 600 });

      const otpResult = await requestOtp(client.email);
      if (!otpResult.success) return res.status(429).json({ error: otpResult.message });

      return res.json({ message: 'OTP sent to email. Confirm to update password.' });
    }

    // Update username langsung
    if (Object.keys(updates).length > 0) {
      await prisma.client.update({ where: { id: clientId }, data: updates });
    }

    return res.json({ message: 'Profile updated successfully', updates });
  } catch (err: unknown) {
    if (err instanceof Error) {
      logger.error('updateClientProfile error: %o', err.message);
    } else {
      logger.error('updateClientProfile unknown error: %o', err);
    }
    return res.status(500).json({ error: 'Failed to update profile' });
  }
};


// ── KONFIRMASI PASSWORD VIA OTP ─────────────
export const confirmUpdatePassword = async (req: Request, res: Response) => {
  try {
    const { otp } = req.body;
    if (!req.user || req.user.type !== 'CLIENT') return res.status(401).json({ error: 'Unauthorized' });

    const clientId = req.user.id;
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) return res.status(404).json({ error: 'Client not found' });

    const keyPass = `profile:password:${clientId}`;
    const hashedTemp = await redis.get(keyPass);
    if (!hashedTemp) return res.status(400).json({ error: 'No pending password update' });

    // Verifikasi OTP
    const otpResult = await verifyOtp(client.email, otp);
    if (!otpResult.success) return res.status(400).json({ error: 'OTP invalid or expired' });

    // Update password
    await prisma.client.update({ where: { id: clientId }, data: { password: hashedTemp } });
    await redis.del(keyPass);

    return res.json({ message: 'Password updated successfully' });
  // } catch (err: any) {
  //   logger.error('confirmUpdatePassword error: %o', err);
  //   return res.status(500).json({ error: 'Failed to update password' });
  // }


        } catch (err: unknown) {
  if (err instanceof Error) {
    logger.error('confirmUpdatePassword error: %o', err.message);
  } else {
    logger.error('confirmUpdatePassword unknown error: %o', err);
  }
  return res.status(500).json({ error: 'Failed to  update password' });
}
};

// ── KONFIRMASI EMAIL VIA OTP ─────────────
export const confirmUpdateEmail = async (req: Request, res: Response) => {
  try {
    const { otp } = req.body;
    if (!req.user || req.user.type !== 'CLIENT') return res.status(401).json({ error: 'Unauthorized' });

    const clientId = req.user.id;
    const keyEmail = `profile:email:${clientId}`;
    const newEmail = await redis.get(keyEmail);
    if (!newEmail) return res.status(400).json({ error: 'No pending email update' });

    // Verifikasi OTP
    const otpResult = await verifyOtp(newEmail, otp);
    if (!otpResult.success) return res.status(400).json({ error: 'OTP invalid or expired' });

    await prisma.client.update({ where: { id: clientId }, data: { email: newEmail } });
    await redis.del(keyEmail);

    return res.json({ message: 'Email updated successfully' });

          } catch (err: unknown) {
  if (err instanceof Error) {
    logger.error('confirmUpdateEmail error: %o', err.message);
  } else {
    logger.error('confirmUpdateEmail unknown error: %o', err);
  }
  return res.status(500).json({ error: 'Failed to update email' });
}
};
