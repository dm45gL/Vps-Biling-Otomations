<template>
  <div class="auth-layout">
    <div class="auth-card">
      <!-- Brand -->
      <div class="auth-brand">
        <h1 class="auth-title">
          Infra<span class="auth-accent">Panel</span>
        </h1>
        <p class="auth-desc">Securely access your infrastructure management console</p>
      </div>

      <!-- Error -->
      <Transition name="fade">
        <div v-if="error" class="auth-alert">
          <i class="fas fa-times-circle"></i>
          {{ error }}
        </div>
      </Transition>

      <!-- Form Utama -->
      <form @submit.prevent="handleSubmit" class="auth-form">
        <div class="form-field">
          <label for="email" class="form-label">Work email</label>
          <div class="input-wrapper">
            <i class="fas fa-envelope icon-left"></i>
            <input
              id="email"
              v-model="email"
              type="email"
              class="form-input"
              placeholder="you@yourcompany.com"
              autocomplete="username"
              autocapitalize="off"
              spellcheck="false"
              required
              :disabled="loading"
            />
          </div>
        </div>

        <div class="form-field">
          <div class="label-row">
            <label for="password" class="form-label">Password</label>
            <router-link to="/forgot-password" class="form-link">Reset password</router-link>
          </div>
          <div class="input-wrapper">
            <i class="fas fa-lock icon-left"></i>
            <input
              id="password"
              :type="showPassword ? 'text' : 'password'"
              v-model="password"
              class="form-input"
              autocomplete="current-password"
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
          <span v-if="!loading">Continue to dashboard</span>
          <span v-else class="spinner"></span>
        </button>
      </form>

      <!-- Divider with text -->
      <div class="divider my-6">
        <span>or continue with</span>
      </div>

      <!-- Social Auth -->
      <div class="social-auth">
        <button
          class="social-btn google"
          @click="loginWithGoogle"
          :disabled="loading"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span>Continue with Google</span>
        </button>

        <button
          class="social-btn github"
          @click="loginWithGitHub"
          :disabled="loading"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
          </svg>
          <span>Continue with GitHub</span>
        </button>
      </div>

      <!-- Trust & Security -->
      <div class="auth-trust mt-6">
        <div class="trust-badge">
          <i class="fas fa-shield-alt"></i>
          <span>End-to-end encrypted • SOC 2 compliant</span>
        </div>
      </div>

      <!-- Register CTA -->
      <div class="auth-footer mt-5">
        <p class="auth-footer-text">
          New to InfraPanel?
          <router-link to="/register" class="auth-footer-link">Request organization access</router-link>
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
const { login, loading, error } = useClientAuth();

const email = ref('');
const password = ref('');
const showPassword = ref(false);

const togglePassword = () => {
  showPassword.value = !showPassword.value;
};

const handleSubmit = async () => {
  const success = await login(email.value, password.value);

  if (success) {
    // ✅ TIDAK ADA EMAIL DI URL
    router.push('/login/verify');
  }
};

/* ───────── SOCIAL AUTH (tetap sama) ───────── */

const loginWithGoogle = () => {
  if (loading.value) return;
  loading.value = true;

  console.log('Initiate Google OAuth');

  setTimeout(() => {
    loading.value = false;
  }, 1500);
};

const loginWithGitHub = () => {
  if (loading.value) return;
  loading.value = true;

  console.log('Initiate GitHub OAuth');

  setTimeout(() => {
    loading.value = false;
  }, 1500);
};
</script>

<style scoped>
/* ... (semua style sebelumnya tetap sama sampai .divider) ... */

/* ===== DIVIDER ===== */
.divider {
  position: relative;
  height: 1px;
  background: #eaeef7;
  text-align: center;
  margin: 2rem 0;
}
.divider span {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  padding: 0 16px;
  color: #7a7f94;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.3px;
}

/* ===== SOCIAL AUTH ===== */
.social-auth {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.social-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  height: 48px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid #d1d5db;
  background: white;
  color: #3a3a4a;
}

.social-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
  border-color: #c1c9ff;
}

.social-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}





/* ===== SISA STYLE (trust, footer, alert, dll) tetap sama ===== */
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

.form-link {
  font-size: 13px;
  color: #6a5acd;
  text-decoration: none;
  font-weight: 500;
  letter-spacing: 0.3px;
  transition: color 0.2s;
}
.form-link:hover {
  color: #5a4dbd;
  text-decoration: underline;
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
.form-input::placeholder {
  color: #b0b7ca;
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

@media (max-width: 768px) {
  .auth-card {
    padding: 2rem;
  }
  .auth-title {
    font-size: 28px;
  }
}
</style>