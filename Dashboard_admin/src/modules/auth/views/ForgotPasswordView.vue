<template>
  <div class="forgot-password-container">
    <div class="forgot-password-card">
      <!-- Branding -->
      <div class="branding">
        <div class="logo">
          <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#6A5BEF" />
              <stop offset="100%" stop-color="#8A7CF0" />
            </linearGradient>
            <path
              d="M24 6C14 6 6 14 6 24s8 18 18 18 18-8 18-18S34 6 24 6zm0 32C16.3 38 10 31.7 10 24S16.3 10 24 10s14 6.3 14 14-6.3 14-14 14z"
              fill="url(#logoGradient)"
            />
            <path
              d="M24 16a8 8 0 100 16 8 8 0 000-16zm0 12a4 4 0 110-8 4 4 0 010 8z"
              fill="white"
            />
          </svg>
        </div>
        <h1 class="brand-title">Lupa Password?</h1>
        <p class="brand-subtitle">
          Masukkan email Anda untuk mendapatkan OTP, kemudian verifikasi kode dan buat password baru
        </p>
      </div>

      <!-- Messages -->
      <div v-if="errorMessage" class="message error">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM7.25 7.25h1.5v4.5h-1.5V7.25zM8 4.75a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1z" fill="currentColor" />
        </svg>
        <span>{{ errorMessage }}</span>
      </div>

      <div v-if="successMessage" class="message success">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 16a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm3.78-9.78a.5.5 0 0 1 0 .7l-3.5 3.5a.5.5 0 0 1-.7 0l-1.5-1.5a.5.5 0 0 1 .7-.7L7.5 9.94l3.08-3.08a.5.5 0 0 1 .7 0z" fill="currentColor" />
        </svg>
        <span>{{ successMessage }}</span>
      </div>

      <!-- Step 1: Request OTP -->
      <form v-if="step === 1" @submit.prevent="requestOTP" class="step-form">
        <div class="form-group">
          <label for="email" class="form-label">Email</label>
          <input
            id="email"
            type="email"
            v-model="email"
            class="form-input"
            placeholder="you@gmail.com"
            required
            :disabled="loading"
          />
        </div>
        <button type="submit" class="submit-button" :disabled="loading">
          <span v-if="!loading">Kirim OTP</span>
          <span v-else class="spinner"></span>
        </button>
      </form>

      <!-- Step 2: Verify OTP -->
      <form v-if="step === 2" @submit.prevent="verifyOTP" class="step-form">
        <div class="form-group">
          <label for="otp" class="form-label">Kode OTP</label>
          <input
            id="otp"
            type="text"
            v-model="otp"
            class="form-input"
            placeholder="6 digit OTP"
            required
            :disabled="loading"
            inputmode="numeric"
            maxlength="6"
          />
        </div>
        <button type="submit" class="submit-button" :disabled="loading">
          <span v-if="!loading">Verifikasi OTP</span>
          <span v-else class="spinner"></span>
        </button>
      </form>

      <!-- Step 3: Set New Password -->
      <form v-if="step === 3" @submit.prevent="setNewPassword" class="step-form">
        <!-- New Password -->
        <div class="form-group">
          <label for="newPassword" class="form-label">Password Baru</label>
          <div class="password-wrapper">
            <input
              :type="showPassword ? 'text' : 'password'"
              v-model="newPassword"
              class="form-input"
              id="newPassword"
              placeholder="••••••••"
              required
              :disabled="loading"
            />
            <button
              type="button"
              class="password-toggle"
              @click="showPassword = !showPassword"
              :disabled="loading"
            >
              <svg v-if="showPassword" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                <path d="M12 20c-5.5 0-10-4.5-10-10s4.5-10 10-10 10 4.5 10 10-4.49 10-10 10Z" />
                <path d="M2 12s9-5 9-5 9 5 9 5" />
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3.5 12c0-3.5 2.5-6.5 6.5-6.5" />
                <path d="M12 20c3.5 0 6.5-3 6.5-6.5" />
                <path d="M21.5 12c0 3.5-2.5 6.5-6.5 6.5" />
                <path d="M3 12h18" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Confirm Password -->
        <div class="form-group">
          <label for="confirmPassword" class="form-label">Konfirmasi Password</label>
          <div class="password-wrapper">
            <input
              :type="showConfirmPassword ? 'text' : 'password'"
              v-model="confirmPassword"
              class="form-input"
              id="confirmPassword"
              placeholder="••••••••"
              required
              :disabled="loading"
            />
            <button
              type="button"
              class="password-toggle"
              @click="showConfirmPassword = !showConfirmPassword"
              :disabled="loading"
            >
              <svg v-if="showConfirmPassword" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                <path d="M12 20c-5.5 0-10-4.5-10-10s4.5-10 10-10 10 4.5 10 10-4.49 10-10 10Z" />
                <path d="M2 12s9-5 9-5 9 5 9 5" />
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3.5 12c0-3.5 2.5-6.5 6.5-6.5" />
                <path d="M12 20c3.5 0 6.5-3 6.5-6.5" />
                <path d="M21.5 12c0 3.5-2.5 6.5-6.5 6.5" />
                <path d="M3 12h18" />
              </svg>
            </button>
          </div>
        </div>

        <button type="submit" class="submit-button" :disabled="loading">
          <span v-if="!loading">Perbarui Password</span>
          <span v-else class="spinner"></span>
        </button>
      </form>

      <!-- Back to Login -->
      <div class="footer-link">
        <router-link to="/login" class="back-link">← Kembali ke Login</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/composables/auth/useAuth';

const email = ref('');
const otp = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const step = ref(1);
const loading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const showPassword = ref(false);
const showConfirmPassword = ref(false);

const router = useRouter();
const auth = useAuth();

const clearMessages = () => {
  errorMessage.value = '';
  successMessage.value = '';
};

const requestOTP = async () => {
  clearMessages();
  loading.value = true;
  try {
    await auth.requestForgotPassword(email.value);
    step.value = 2;
    successMessage.value = `OTP berhasil dikirim ke email ${email.value}`;
  } catch (err: any) {
    errorMessage.value = err.message || 'Gagal mengirim OTP';
  } finally {
    loading.value = false;
  }
};

const verifyOTP = async () => {
  clearMessages();
  loading.value = true;
  try {
    await auth.verifyForgotPasswordOTP(otp.value);
    step.value = 3;
    successMessage.value = 'OTP berhasil diverifikasi. Silakan buat password baru.';
  } catch (err: any) {
    errorMessage.value = err.message || 'Kode OTP tidak valid';
  } finally {
    loading.value = false;
  }
};

const setNewPassword = async () => {
  clearMessages();

  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = 'Password dan konfirmasi tidak cocok';
    return;
  }

  loading.value = true;
  try {
    await auth.setNewForgotPassword(newPassword.value);
    router.push('/sukses');
  } catch (err: any) {
    if (err.response?.data?.details) {
      const details = err.response.data.details;
      const messages: string[] = [];
      for (const key in details) {
        if (details[key]?._errors) messages.push(...details[key]._errors);
      }
      errorMessage.value = messages.join(', ');
    } else {
      errorMessage.value = err.message || 'Password harus memiliki setidaknya 8 karakter, huruf besar, huruf kecil, dan angka';
    }
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.forgot-password-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #f9f8ff;
  padding: 16px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.forgot-password-card {
  background: white;
  border-radius: 20px;
  padding: 40px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
}

.branding {
  text-align: center;
  margin-bottom: 28px;
}

.logo {
  width: 60px;
  height: 60px;
  margin: 0 auto 16px;
}

.brand-title {
  font-size: 22px;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.brand-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 8px 0 0;
}

.message {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 14px;
  margin-bottom: 24px;
}

.message.error {
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

.message.success {
  background: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 14px 16px;
  font-size: 15px;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  background: white;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #8A7CF0;
  box-shadow: 0 0 0 3px rgba(138, 124, 240, 0.15);
}

.form-input:disabled {
  background-color: #f9fafb;
  cursor: not-allowed;
}

.password-wrapper {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  padding: 4px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.password-toggle:hover:not(:disabled) {
  background: #f3f4f6;
  color: #4b5563;
}

.password-toggle:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.submit-button {
  width: 100%;
  padding: 14px;
  font-size: 16px;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, #6A5BEF, #5D4AE5);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.submit-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #5D4AE5, #4F3FD9);
}

.submit-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
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

.footer-link {
  text-align: center;
  margin-top: 24px;
}

.back-link {
  color: #6A5BEF;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
}

.back-link:hover {
  text-decoration: underline;
}
</style>