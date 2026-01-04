<template>
  <div class="login-container">
    <div class="login-card">
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
        <h1 class="brand-title">InfraPanel</h1>
        <p class="brand-subtitle">Secure access to your infrastructure</p>
      </div>

      <!-- Error -->
      <div v-if="errorMessage" class="error-banner">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M8 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM7.25 7.25h1.5v4.5h-1.5V7.25zM8 4.75a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1z"
            fill="currentColor"
          />
        </svg>
        <span>{{ errorMessage }}</span>
      </div>

      <!-- Form -->
      <form @submit.prevent="onSubmit" class="login-form">
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

        <div class="form-group">
          <label for="password" class="form-label">Password</label>
          <div class="password-wrapper">
            <input
              :type="showPassword ? 'text' : 'password'"
              v-model="password"
              class="form-input"
              id="password"
              placeholder="••••••••"
              required
              :disabled="loading"
            />
            <button
              type="button"
              class="password-toggle"
              @click="togglePassword"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
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

        <button type="submit" class="submit-button" :disabled="loading">
          <span v-if="!loading">Login</span>
          <span v-else class="spinner"></span>
        </button>
      </form>

      <!-- Divider -->
      <div class="divider">
        <span>or continue with</span>
      </div>

      <!-- Social Login -->
      <div class="social-buttons">
        <button class="social-btn google" @click="loginWithGoogle" :disabled="loading">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span>Continue with Google</span>
        </button>
        <button class="social-btn github" @click="loginWithGitHub" :disabled="loading">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
          </svg>
          <span>Continue with GitHub</span>
        </button>
      </div>

      <div class="footer-link">
        <router-link to="/forgot-password" class="forgot-link">Forgot password?</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/composables/auth/useAuth';

const email = ref('');
const password = ref('');
const showPassword = ref(false);
const loading = ref(false);
const errorMessage = ref('');
const router = useRouter();
const auth = useAuth();

const togglePassword = () => (showPassword.value = !showPassword.value);
const clearError = () => (errorMessage.value = '');

const onSubmit = async () => {
  clearError();
  loading.value = true;
  try {
    const result = await auth.performLogin(email.value, password.value);
    if (result.needsOTP) {
      router.push('/verify-otp');
    } else {
      const role = auth.user.value?.role;
      const path =
        role === 'SYSADMIN'
          ? '/sysadmin'
          : role === 'FINANCE'
          ? '/finance'
          : role === 'BUSINESS'
          ? '/business'
          : '/dashboard';
      router.push(path);
    }
  } catch (err: any) {
    errorMessage.value = 'Password atau email Anda salah';
  } finally {
    loading.value = false;
  }
};

const loginWithGoogle = () => {
  clearError();
  loading.value = true;
  // Simulasi — ganti dengan real auth
  setTimeout(() => (loading.value = false), 1200);
};
const loginWithGitHub = () => {
  clearError();
  loading.value = true;
  setTimeout(() => (loading.value = false), 1200);
};
</script>

<style scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #f9f8ff;
  padding: 16px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.login-card {
  background: white;
  border-radius: 20px;
  padding: 40px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
}

.branding {
  text-align: center;
  margin-bottom: 32px;
}

.logo {
  width: 60px;
  height: 60px;
  margin: 0 auto 16px;
}

.brand-title {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.brand-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 8px 0 0;
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fef2f2;
  color: #b91c1c;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 14px;
  margin-bottom: 24px;
  border: 1px solid #fecaca;
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

.divider {
  text-align: center;
  position: relative;
  margin: 28px 0;
  color: #9ca3af;
  font-size: 13px;
}

.divider::before,
.divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 42%;
  height: 1px;
  background: #e5e7eb;
}

.divider::before {
  left: 0;
}

.divider::after {
  right: 0;
}

.social-buttons {
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
  padding: 12px;
  border-radius: 12px;
  font-weight: 500;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #e5e7eb;
  background: white;
}

.social-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.social-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.google {
  color: #374151;
}

.github {
  color: #374151;
}

.footer-link {
  text-align: center;
}

.forgot-link {
  color: #6A5BEF;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
}

.forgot-link:hover {
  text-decoration: underline;
}
</style>