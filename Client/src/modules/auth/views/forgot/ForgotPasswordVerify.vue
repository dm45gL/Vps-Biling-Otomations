<template>
  <div class="auth-layout">
    <div class="auth-card">
      <!-- Header -->
      <div class="auth-header has-text-centered mb-5">
        <div class="mb-3">
          <i class="fas fa-key auth-icon"></i>
        </div>
        <h1 class="auth-title">Verifikasi OTP</h1>
        <p class="auth-desc">
          Masukkan kode OTP yang dikirim ke<br />
          <strong>{{ maskedForgotEmail }}</strong>

        </p>
      </div>

      <!-- Countdown & Resend -->
      <div class="otp-timer has-text-centered mb-5">
        <p class="timer-text" :class="{ 'expired': isExpired }">
          Kode kadaluarsa dalam <strong>{{ formattedTime }}</strong>
        </p>
        <button
          v-if="isExpired"
          class="resend-button"
          @click="resendOtp"
          :disabled="isResending"
        >
          {{ isResending ? 'Mengirim...' : 'Kirim Ulang OTP' }}
        </button>
      </div>

      <!-- Error -->
      <Transition name="fade">
        <div v-if="error" class="auth-alert">
          <i class="fas fa-exclamation-circle"></i>
          {{ error }}
        </div>
      </Transition>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="auth-form">
        <div class="form-field">
          <label for="otp" class="form-label">Kode OTP (6 digit)</label>
          <div class="input-wrapper">
            <i class="fas fa-key icon-left"></i>
            <input
              id="otp"
              ref="otpInput"
              v-model="otp"
              type="text"
              class="form-input monospace"
              inputmode="numeric"
              maxlength="6"
              autocomplete="one-time-code"
              placeholder="123456"
              required
              :disabled="loading || isExpired"
              @input="handleOtpInput"
            />
          </div>
        </div>

        <button
          type="submit"
          class="btn-submit"
          :class="{ 'is-loading': loading }"
          :disabled="loading || otp.length !== 6 || isExpired"
        >
          <span v-if="!loading">Verifikasi & Lanjutkan</span>
          <span v-else class="spinner"></span>
        </button>
      </form>

      <!-- Trust note -->
      <div class="auth-trust mt-5">
        <div class="trust-badge">
          <i class="fas fa-shield-alt"></i>
          <span>Kode berlaku 5 menit • Tidak ada data disimpan</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useClientAuth } from '@/composables/auth/useClientAuth';

const router = useRouter();
const {
  verifyForgotPassword,
  resendForgotPasswordOTP,
  loading,
  error,
  maskedForgotEmail,
} = useClientAuth();

const otp = ref('');
const otpInput = ref<HTMLInputElement | null>(null);
const timeLeft = ref(300); // 5 menit
const isExpired = ref(false);
const isResending = ref(false);

let timer: ReturnType<typeof setInterval> | null = null;

// Timer
const startTimer = () => {
  if (timer) clearInterval(timer);
  timer = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--;
    } else {
      clearInterval(timer!);
      isExpired.value = true;
    }
  }, 1000);
};

const formattedTime = computed(() => {
  const mins = Math.floor(timeLeft.value / 60);
  const secs = timeLeft.value % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
});

// Input OTP
const handleOtpInput = () => {
  otp.value = otp.value.replace(/\D/g, '').slice(0, 6);
  if (otp.value.length === 6) handleSubmit();
};

// Resend OTP (TANPA EMAIL)
const resendOtp = async () => {
  if (isResending.value || loading.value) return;
  isResending.value = true;

  try {
    await resendForgotPasswordOTP();
    otp.value = '';
    timeLeft.value = 300;
    isExpired.value = false;
    startTimer();
  } finally {
    isResending.value = false;
  }
};

// Submit OTP (TANPA EMAIL)
const handleSubmit = async () => {
  if (otp.value.length !== 6 || isExpired.value) return;

  const success = await verifyForgotPassword(otp.value);
  if (success) {
    router.push('/reset-password'); // ✅ URL BERSIH
  }
};

// Lifecycle
onMounted(() => {
  if (!maskedForgotEmail.value) {
    router.replace('/forgot-password');
    return;
  }

  startTimer();
  setTimeout(() => otpInput.value?.focus(), 100);
});

onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
});
</script>


<style scoped>
/* ===== LAYOUT ===== */
.auth-layout {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(128deg, #f8f7ff 0%, #f0efff 45%, #b5b0e3ff 100%);
  padding: 2rem 1.25rem;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.auth-card {
  width: 100%;
  max-width: 420px;
  background: #ffffff;
  border-radius: 16px;
  padding: 2.5rem;
  box-shadow:
    0 4px 20px -2px rgba(91, 62, 150, 0.08),
    0 1px 4px rgba(0, 0, 0, 0.04);
  border: 1px solid #eaeef7;
}

/* ===== HEADER ===== */
.auth-icon {
  font-size: 28px;
  color: #6a5acd;
  background: #f8f9fe;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

.auth-title {
  font-size: 26px;
  font-weight: 700;
  color: #111827;
  margin: 16px 0 8px;
}

.auth-desc {
  color: #5a5a6a;
  font-size: 15px;
  line-height: 1.5;
  margin: 0;
}

/* ===== TIMER ===== */
.otp-timer {
  margin-bottom: 24px;
}

.timer-text {
  font-size: 15px;
  color: #3a3a4a;
  margin: 0;
}
.timer-text.expired {
  color: #b91c1c;
}

.resend-button {
  background: none;
  border: none;
  color: #6a5acd;
  font-size: 14px;
  font-weight: 600;
  margin-top: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.2s;
}
.resend-button:hover:not(:disabled) {
  background: #f8f9fe;
}
.resend-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ===== FORM ===== */
.form-field {
  margin-bottom: 24px;
}

.form-label {
  font-size: 13px;
  font-weight: 600;
  color: #3a3a4a;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
  display: block;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  background: #ffffff;
  transition: border-color 0.25s, box-shadow 0.25s;
}

.input-wrapper:focus-within {
  border-color: #6a5acd;
  box-shadow: 0 0 0 3px rgba(106, 90, 205, 0.15);
}

.icon-left {
  color: #94a3b8;
  margin: 0 14px;
  font-size: 16px;
  width: 16px;
  text-align: center;
}

.form-input {
  flex: 1;
  height: 48px;
  border: none;
  outline: none;
  font-size: 18px;
  background: transparent;
  font-family: inherit;
  padding-right: 14px;
  text-align: center;
}

.monospace {
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Courier New', monospace;
  letter-spacing: 3px;
}

/* ===== BUTTON ===== */
.btn-submit {
  width: 100%;
  height: 50px;
  background: #6a5acd;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  letter-spacing: 0.3px;
  position: relative;
}
.btn-submit:hover:not(:disabled) {
  background: #5a4dbd;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(106, 90, 205, 0.3);
}
.btn-submit:disabled {
  opacity: 0.85;
  transform: none;
}

.spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ===== ALERT ===== */
.auth-alert {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fef2f2;
  color: #b91c1c;
  padding: 14px 18px;
  border-radius: 10px;
  font-size: 14px;
  margin-bottom: 24px;
  border: 1px solid #fecaca;
  font-weight: 500;
  animation: fadeIn 0.2s ease;
}
.auth-alert i {
  font-size: 18px;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ===== TRUST BADGE ===== */
.auth-trust {
  text-align: center;
}
.trust-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #f8f9fe;
  color: #5b3e96;
  padding: 8px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid #eaeef7;
}
.trust-badge i {
  font-size: 14px;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 768px) {
  .auth-card {
    padding: 2rem;
  }
  .auth-title {
    font-size: 24px;
  }
}
</style>