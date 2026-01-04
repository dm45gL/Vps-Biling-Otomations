// core/security/emailGuard.ts
import dns from 'dns/promises';

// ── List domain disposable / generator ─────────────
// Update secara berkala
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  '10minutemail.com',
  '10minutemail.net',
  'temp-mail.org',
  'tempmail.com',
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamail.org',
  'yopmail.com',
  'getnada.com',
  'trashmail.com',
  'fakeinbox.com',
  'dispostable.com',
  'maildrop.cc',
]);

// ── Cache MX lookup untuk mengurangi DNS query ─────────────
const mxCache = new Map<string, { valid: boolean; timestamp: number }>();
const MX_CACHE_TTL = 1000 * 60 * 60; // 1 jam

// ── Validasi format email (lebih ketat RFC 5322) ─────────────
export const isValidEmailFormat = (email: string): boolean => {
  const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
  return re.test(email);
};

// ── Cek apakah email disposable ─────────────
export const isDisposableEmail = (email: string): boolean => {
  const domain = email.split('@')[1]?.toLowerCase();
  return domain ? DISPOSABLE_DOMAINS.has(domain) : false;
};

// ── Cek MX record (domain bisa menerima email) ─────────────
export const hasValidMxRecord = async (email: string): Promise<boolean> => {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;

  // Cek cache dulu
  const cached = mxCache.get(domain);
  const now = Date.now();
  if (cached && now - cached.timestamp < MX_CACHE_TTL) {
    return cached.valid;
  }

  try {
    const records = await dns.resolveMx(domain);
    const valid = Array.isArray(records) && records.length > 0;
    mxCache.set(domain, { valid, timestamp: now });
    return valid;
  } catch {
    mxCache.set(domain, { valid: false, timestamp: now });
    return false;
  }
};

// ── Fungsi helper untuk PROD: validasi email lengkap ─────────────
export const isEmailSafeForProduction = async (email: string): Promise<{ valid: boolean; reason?: string }> => {
  if (!isValidEmailFormat(email)) return { valid: false, reason: 'Invalid email format' };
  if (isDisposableEmail(email)) return { valid: false, reason: 'Disposable email not allowed' };
  const mxValid = await hasValidMxRecord(email);
  if (!mxValid) return { valid: false, reason: 'Domain cannot receive emails (MX invalid)' };
  return { valid: true };
};
