import { z } from 'zod';

/* =========================================================
 * TRANSFORM & REUSABLE SCHEMAS
 * ======================================================= */

const emailTransform = (val: string) => val.trim().toLowerCase();
const stringTrim = (val: string) => val.trim();

const otpSchema = z
  .string()
  .length(6, { message: 'OTP must be 6 digits' })
  .regex(/^\d+$/, { message: 'OTP must be numeric' })
  .transform(stringTrim);

const passwordSchema = z
  .string()
  .min(8, { message: 'Password must be at least 8 characters' })
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain uppercase, lowercase, and number',
  })
  .transform(stringTrim);

/* =========================================================
 * REGISTER
 * ======================================================= */

// Register - Step 1: Request OTP
export const registerRequestSchema = z.object({
  email: z
    .string()
    .email({ message: 'Invalid email format' })
    .transform(emailTransform),

  username: z
    .string()
    .min(3, { message: 'Username must be at least 3 characters' })
    .max(30, { message: 'Username too long' })
    .regex(/^[a-zA-Z0-9_]+$/, {
      message: 'Username only letters, numbers, and underscores',
    })
    .transform(stringTrim),

  password: passwordSchema,
});

// Register - Step 2: Verify OTP & Complete
export const registerCompleteSchema = z.object({
  email: z
    .string()
    .email({ message: 'Invalid email format' })
    .transform(emailTransform),

  otp: otpSchema,
});

/* =========================================================
 * LOGIN
 * ======================================================= */

// Login - Step 1: Email & Password
export const loginRequestSchema = z.object({
  email: z
    .string()
    .email({ message: 'Invalid email format' })
    .transform(emailTransform),

  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .transform(stringTrim),
});

// Login - Step 2: Verify OTP
export const loginVerifySchema = z.object({
  email: z
    .string()
    .email({ message: 'Invalid email format' })
    .transform(emailTransform),

  otp: otpSchema,
});

/* =========================================================
 * FORGOT PASSWORD (3 STEP)
 * ======================================================= */

// Step 1: Request OTP
export const forgotPasswordRequestSchema = z.object({
  email: z
    .string()
    .email({ message: 'Invalid email format' })
    .transform(emailTransform),
});

// Step 2: Verify OTP (NO password here)
export const forgotPasswordVerifyOtpSchema = z.object({
  email: z
    .string()
    .email({ message: 'Invalid email format' })
    .transform(emailTransform),

  otp: otpSchema,
});

// Step 3: Reset Password (use resetToken)
export const forgotPasswordResetSchema = z.object({
  resetToken: z
    .string()
    .min(32, { message: 'Invalid or expired reset token' })
    .transform(stringTrim),

  newPassword: passwordSchema,
});
// ── UPDATE CLIENT PROFILE ─────────────

export const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3, 'Username minimal 3 karakter')
    .max(30, 'Username maksimal 30 karakter')
    .regex(/^[a-zA-Z0-9._]+$/, 'Username hanya boleh huruf, angka, titik, underscore')
    .optional(),
  email: z
    .string()
    .email('Format email tidak valid')
    .optional(),
  newPassword: z
    .string()
    .min(8, 'Password minimal 8 karakter')
    .regex(/[a-z]/, 'Password harus mengandung huruf kecil')
    .regex(/[A-Z]/, 'Password harus mengandung huruf besar')
    .regex(/[0-9]/, 'Password harus mengandung angka')
    .regex(/[^A-Za-z0-9]/, 'Password harus mengandung simbol')
    .optional(),
}).refine((data) => data.username || data.email || data.newPassword, {
  message: 'Minimal satu field harus diisi',
});




