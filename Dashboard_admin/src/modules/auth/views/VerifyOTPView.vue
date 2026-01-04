<!-- src/views/auth/VerifyOTPView.vue -->
<template>
  <div class="otp-container">
    <div class="otp-card">
      <div class="logo">
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M16 6a10 10 0 100 20 10 10 0 000-20zM16 8a8 8 0 110 16 8 8 0 010-16z" />
          <circle cx="16" cy="16" r="3" />
        </svg>
      </div>
      <h1 class="card-title">Verifikasi OTP</h1>
      <p class="card-subtitle">Masukkan kode 6 digit yang dikirim ke:</p>
      <p class="email-highlight">{{ auth.pendingEmailForOTP.value }}</p>

      <!-- Error or Success Message -->
      <div v-if="message" :class="['message', { 'message-error': isError, 'message-success': !isError }]">
        {{ message }}
      </div>

      <!-- OTP Form -->
      <form @submit.prevent="verify" class="otp-form">
        <div class="input-group">
          <input
            v-model="otp"
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            maxlength="6"
            placeholder="123456"
            required
            :disabled="loading"
            class="otp-input"
            @input="formatOTP"
          />
        </div>

        <button
          type="submit"
          :disabled="loading || otp.length !== 6"
          class="btn primary"
        >
          <span v-if="!loading">Verifikasi</span>
          <span v-else>Memverifikasi...</span>
        </button>

        <button
          type="button"
          @click="resend"
          :disabled="loading"
          class="btn secondary"
        >
          <span v-if="!loading">Kirim Ulang OTP</span>
          <span v-else>Mengirim...</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/composables/auth/useAuth';
import type { AdminRole } from '@/types/auth';

const otp = ref('');
const loading = ref(false);
const message = ref('');
const isError = ref(false);
const router = useRouter();
const auth = useAuth();

// Redirect jika tidak ada email pending
onMounted(() => {
  if (!auth.pendingEmailForOTP.value) {
    router.push('/login');
  }
});

// Helper redirect berdasarkan role
function redirectByRole(role: AdminRole | undefined) {
  switch (role) {
    case 'SYSADMIN': return '/sysadmin';
    case 'FINANCE': return '/finance';
    case 'BUSINESS': return '/business';
    default: return '/login';
  }
}

// Format input OTP: hanya angka, maks 6 digit
const formatOTP = (e: Event) => {
  const input = e.target as HTMLInputElement;
  let value = input.value.replace(/\D/g, '');
  if (value.length > 6) value = value.slice(0, 6);
  otp.value = value;
};

// Verifikasi OTP
const verify = async () => {
  if (otp.value.length !== 6) {
    message.value = 'OTP harus terdiri dari 6 digit angka';
    isError.value = true;
    return;
  }

  loading.value = true;
  message.value = '';
  isError.value = false;

  try {
    await auth.performOTPVerify(otp.value);
    const role = auth.user.value?.role;
    router.push(redirectByRole(role));
  } catch (err: any) {
    message.value = 'OTP salah atau telah kadaluarsa';
    isError.value = true;
  } finally {
    loading.value = false;
  }
};

// Kirim ulang OTP
const resend = async () => {
  if (!auth.pendingEmailForOTP.value) return;
  
  loading.value = true;
  message.value = '';
  isError.value = false;

  try {
    await auth.resendOTP();
    message.value = 'OTP berhasil dikirim ulang';
    isError.value = false;
  } catch (err: any) {
    message.value = err?.response?.data?.error || 'Gagal mengirim ulang OTP';
    isError.value = true;
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
/* === Global === */
.otp-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8fafc;
  padding: 1rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.otp-card {
  width: 100%;
  max-width: 440px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
  padding: 2.5rem;
  position: relative;
}

/* === Logo & Branding === */
.logo {
  width: 48px;
  height: 48px;
  margin: 0 auto 1.5rem;
  color: #4f46e5;
}

.card-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #0f172a;
  text-align: center;
  margin-bottom: 0.5rem;
}

.card-subtitle {
  font-size: 0.9375rem;
  color: #64748b;
  text-align: center;
  margin-bottom: 0.25rem;
}

.email-highlight {
  font-weight: 600;
  color: #4f46e5;
  text-align: center;
  margin-bottom: 1.5rem;
  font-size: 0.9375rem;
  word-break: break-all;
}

/* === Message === */
.message {
  padding: 0.75rem 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
  text-align: center;
}

.message-error {
  background: #fef2f2;
  color: #ef4444;
  border: 1px solid #fecaca;
}

.message-success {
  background: #f0fdf4;
  color: #16a34a;
  border: 1px solid #bbf7d0;
}

/* === OTP Input === */
.otp-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.input-group {
  margin-bottom: 0;
}

.otp-input {
  width: 100%;
  padding: 0.875rem 1rem;
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: 8px;
  text-align: center;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
  color: #0f172a;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.otp-input:focus {
  outline: none;
  border-color: #4f46e5;
  background: white;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
}

.otp-input::placeholder {
  color: #cbd5e1;
}

/* === Buttons === */
.btn {
  width: 100%;
  padding: 0.875rem;
  font-weight: 600;
  font-size: 1rem;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.btn.primary {
  background: #4f46e5;
  color: white;
}

.btn.primary:hover:not(:disabled) {
  background: #4338ca;
  transform: translateY(-1px);
}

.btn.secondary {
  background: #f1f5f9;
  color: #334155;
}

.btn.secondary:hover:not(:disabled) {
  background: #e2e8f0;
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

/* === Responsif === */
@media (max-width: 480px) {
  .otp-card {
    padding: 2rem;
  }
  .otp-input {
    font-size: 1.125rem;
    letter-spacing: 6px;
  }
  .card-title {
    font-size: 1.5rem;
  }
}
</style>