<template>
  <div class="auth-layout">
    <div class="auth-card">
      <!-- Header -->
      <div class="auth-header has-text-centered mb-6">
        <div class="mb-3">
          <i class="fas fa-key auth-icon"></i>
        </div>
        <h1 class="auth-title">Lupa Password?</h1>
        <p class="auth-desc">
          Masukkan email akun Anda untuk menerima<br />
          kode verifikasi OTP
        </p>
      </div>

      <!-- Error -->
      <Transition name="fade">
        <div v-if="errorMessage" class="auth-alert">
          <i class="fas fa-exclamation-circle"></i>
          {{ errorMessage }}
        </div>
      </Transition>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="auth-form">
        <div class="form-field">
          <label for="email" class="form-label">Work Email</label>
          <div class="input-wrapper">
            <i class="fas fa-envelope icon-left"></i>
            <input
              id="email"
              v-model="email"
              type="email"
              class="form-input"
              placeholder="you@yourcompany.com"
              autocomplete="email"
              required
              :disabled="loading"
            />
          </div>
        </div>

        <button
          type="submit"
          class="btn-submit"
          :class="{ 'is-loading': loading }"
          :disabled="loading"
        >
          <span v-if="!loading">Kirim Kode Verifikasi</span>
          <span v-else class="spinner"></span>
        </button>
      </form>

      <!-- Trust Note -->
      <div class="auth-trust mt-5">
        <div class="trust-badge">
          <i class="fas fa-shield-alt"></i>
          <span>Tidak ada data yang disimpan • Hanya untuk verifikasi</span>
        </div>
      </div>

      <!-- Back to Login -->
      <div class="auth-footer has-text-centered mt-5">
        <p class="auth-footer-text">
          Ingat password Anda?
          <router-link to="/login" class="auth-footer-link">Kembali ke login</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useClientAuth } from '@/composables/auth/useClientAuth';

const router = useRouter();
const {
  requestForgotPassword,
  loading,
  error,
} = useClientAuth();

const email = ref('');

// Error reactive
const errorMessage = computed(() => error.value);

const handleSubmit = async () => {
  if (!email.value || loading.value) return;

  const success = await requestForgotPassword(email.value);
  if (success) {
    // ❌ TIDAK kirim email ke URL
    router.push('/forgot-password/verify');
  }
};
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
  max-width: 440px;
  background: #ffffff;
  border-radius: 16px;
  padding: 2.75rem;
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
  font-size: 28px;
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

.input-wrapper:hover:not(.is-disabled) {
  border-color: #a7a0d3;
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
  font-size: 16px;
  background: transparent;
  font-family: inherit;
  padding-right: 14px;
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
  opacity: 0.9;
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

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
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

/* ===== FOOTER ===== */
.auth-footer-text {
  font-size: 14px;
  color: #5a5a6a;
  text-align: center;
  line-height: 1.5;
  margin: 0;
}
.auth-footer-link {
  color: #6a5acd;
  font-weight: 600;
  text-decoration: none;
  letter-spacing: 0.4px;
  transition: color 0.2s;
}
.auth-footer-link:hover {
  color: #5a4dbd;
  text-decoration: underline;
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
