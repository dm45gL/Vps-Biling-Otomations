<template>
  <div class="auth-layout">
    <div class="auth-card">
      <!-- Branding -->
      <div class="auth-brand has-text-centered mb-6">
        <h1 class="auth-title">
          Infra<span class="auth-accent">Panel</span>
        </h1>
        <p class="auth-desc">Buat akun organisasi untuk mengelola infrastruktur Anda</p>
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
          <label for="username" class="form-label">Username</label>
          <div class="input-wrapper">
            <i class="fas fa-user icon-left"></i>
            <input
              id="username"
              v-model="username"
              type="text"
              class="form-input"
              placeholder="contoh: bisnis_anda"
              autocomplete="username"
              required
              :disabled="loading"
            />
          </div>
        </div>

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

        <div class="form-field">
          <div class="label-row">
            <label for="password" class="form-label">Password</label>
            <span class="form-hint">Minimal 8 karakter</span>
          </div>
          <div class="input-wrapper">
            <i class="fas fa-lock icon-left"></i>
            <input
              id="password"
              :type="showPassword ? 'text' : 'password'"
              v-model="password"
              class="form-input"
              autocomplete="new-password"
              placeholder="••••••••"
              required
              :disabled="loading"
            />
            <button
              type="button"
              class="icon-button"
              @click="togglePassword"
              :disabled="loading"
              aria-label="Toggle password visibility"
            >
              <i v-if="showPassword" class="fas fa-eye-slash"></i>
              <i v-else class="fas fa-eye"></i>
            </button>
          </div>
        </div>

        <button
          type="submit"
          class="btn-submit"
          :class="{ 'is-loading': loading }"
          :disabled="loading"
        >
          <span v-if="!loading">Kirim OTP Verifikasi</span>
          <span v-else class="spinner"></span>
        </button>
      </form>

      <!-- Trust Note -->
      <div class="auth-trust mt-5">
        <div class="trust-badge">
          <i class="fas fa-shield-alt"></i>
          <span>Akun diverifikasi • Data terenkripsi</span>
        </div>
      </div>

      <!-- Login Link -->
      <div class="auth-footer has-text-centered mt-5">
        <p class="auth-footer-text">
          Sudah punya akun?
          <router-link to="/login" class="auth-footer-link">Masuk ke dashboard</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useClientAuth } from '@/composables/auth/useClientAuth';

const router = useRouter();
const { register, loading, error } = useClientAuth();

/* ───────── STATE ───────── */
const username = ref('');
const email = ref('');
const password = ref('');
const showPassword = ref(false);

/* ───────── UI ───────── */
const togglePassword = () => {
  showPassword.value = !showPassword.value;
};

/* ───────── SUBMIT ───────── */
const handleSubmit = async () => {
  if (!username.value || !email.value || !password.value) return;

  const success = await register(
    username.value.trim(),
    email.value.trim().toLowerCase(),
    password.value
  );

  if (success) {

    router.push('/register/verify');
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

/* ===== BRAND ===== */
.auth-brand {
  text-align: center;
  margin-bottom: 2rem;
}

.auth-title {
  font-size: 32px;
  font-weight: 800;
  letter-spacing: -0.8px;
  color: #d838e4;
  margin: 0;
  line-height: 1.15;
}
.auth-accent {
  color: #5b3e96;
}

.auth-desc {
  color: #5a5a6a;
  font-size: 15px;
  margin-top: 8px;
  font-weight: 400;
  line-height: 1.5;
}

/* ===== FORM ===== */
.form-field {
  margin-bottom: 24px;
}

.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.form-label {
  font-size: 13px;
  font-weight: 600;
  color: #3a3a4a;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-hint {
  font-size: 12px;
  color: #7a7f94;
  font-weight: 500;
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

.icon-button {
  width: 40px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  border-radius: 0 10px 10px 0;
  transition: color 0.2s, background 0.2s;
}
.icon-button:hover:not(:disabled) {
  color: #6a5acd;
  background: #f8f9fe;
}
.icon-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
    font-size: 28px;
  }
}
</style>