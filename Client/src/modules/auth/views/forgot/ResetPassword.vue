<template>
  <div class="auth-layout">
    <div class="auth-card">
      <!-- Header -->
      <div class="auth-header has-text-centered mb-6">
        <div class="mb-3">
          <i class="fas fa-lock auth-icon"></i>
        </div>
        <h1 class="auth-title">Atur Ulang Password</h1>
        <p class="auth-desc">
          Buat password baru yang aman untuk akun Anda
        </p>
      </div>

      <!-- Error (hanya setelah submit, dan pesan disesuaikan) -->
      <Transition name="fade">
        <div v-if="displayedError" class="auth-alert">
          <i class="fas fa-exclamation-circle"></i>
          {{ displayedError }}
        </div>
      </Transition>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="auth-form">
        <!-- New Password -->
        <div class="form-field">
          <label for="newPassword" class="form-label">Password Baru</label>
          <div class="input-wrapper">
            <i class="fas fa-lock icon-left"></i>
            <input
              id="newPassword"
              :type="showPassword ? 'text' : 'password'"
              v-model="newPassword"
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

        <!-- Confirm Password -->
        <div class="form-field">
          <label for="confirmPassword" class="form-label">Konfirmasi Password</label>
          <div class="input-wrapper">
            <i class="fas fa-lock icon-left"></i>
            <input
              id="confirmPassword"
              :type="showConfirm ? 'text' : 'password'"
              v-model="confirmPassword"
              class="form-input"
              autocomplete="new-password"
              placeholder="••••••••"
              required
              :disabled="loading"
            />
            <button
              type="button"
              class="icon-button"
              @click="toggleConfirm"
              :disabled="loading"
              aria-label="Toggle confirm password visibility"
            >
              <i v-if="showConfirm" class="fas fa-eye-slash"></i>
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
          <span v-if="!loading">Simpan Password Baru</span>
          <span v-else class="spinner"></span>
        </button>
      </form>

      <!-- Trust Note -->
      <div class="auth-trust mt-5">
        <div class="trust-badge">
          <i class="fas fa-shield-alt"></i>
          <span>Password dienkripsi • Tidak pernah dikirim via email</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useClientAuth } from '@/composables/auth/useClientAuth';

const router = useRouter();
const {
  resetPassword,
  loading,
  error,
  hasForgotResetToken,
} = useClientAuth();

const newPassword = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);
const showConfirm = ref(false);
const hasSubmitted = ref(false);

// Guard: token HARUS ada
onMounted(() => {
  if (!hasForgotResetToken.value) {
    router.replace('/forgot-password');
  }
});

const togglePassword = () => (showPassword.value = !showPassword.value);
const toggleConfirm = () => (showConfirm.value = !showConfirm.value);

// Error yang ditampilkan (hanya setelah submit)
const displayedError = computed(() => {
  if (!hasSubmitted.value) return null;

  if (newPassword.value !== confirmPassword.value) {
    return 'Password tidak cocok. Harap periksa kembali.';
  }

  if (error.value) {
    const err = error.value.toLowerCase();

    if (
      err.includes('password') ||
      err.includes('validation') ||
      err.includes('format')
    ) {
      return 'Password harus mengandung huruf besar, huruf kecil, angka, dan karakter khusus.';
    }

    return error.value;
  }

  return null;
});

// Submit
const handleSubmit = async () => {
  hasSubmitted.value = true;

  if (newPassword.value !== confirmPassword.value) return;

  const success = await resetPassword(newPassword.value);
  if (success) {
    router.replace('/login');
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