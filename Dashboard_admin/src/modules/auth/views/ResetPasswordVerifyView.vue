<template>
  <div class="d-flex justify-content-center align-items-center vh-100 bg-light">
    <div class="card shadow-lg p-4 p-md-5 rounded-4" style="max-width: 400px; width: 100%; position: relative;">

      <!-- Branding -->
      <div class="text-center mb-4">
        <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" class="mb-2" style="width:50px; height:50px;">
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#4f46e5" />
            <stop offset="100%" stop-color="#7c3aed" />
          </linearGradient>
          <path d="M24 6C14 6 6 14 6 24s8 18 18 18 18-8 18-18S34 6 24 6zm0 32C16.3 38 10 31.7 10 24S16.3 10 24 10s14 6.3 14 14-6.3 14-14 14z" fill="url(#logoGradient)"/>
          <path d="M24 16a8 8 0 100 16 8 8 0 000-16zm0 12a4 4 0 110-8 4 4 0 010 8z" fill="white"/>
        </svg>
        <h3 class="fw-bold mb-1">Lupa Password?</h3>
        <p class="text-muted small">Masukkan email Anda untuk mendapatkan OTP reset password</p>
      </div>

      <!-- Error -->
      <div v-if="errorMessage" class="alert alert-danger d-flex align-items-center py-2" role="alert">
        <i class="bi bi-exclamation-circle me-2"></i> {{ errorMessage }}
      </div>

      <!-- Form -->
      <form @submit.prevent="requestReset">
        <div class="mb-3">
          <label for="email" class="form-label fw-semibold">Email</label>
          <input type="email" v-model="email" class="form-control form-control-lg rounded-3" id="email" placeholder="you@gmail.com" required :disabled="loading">
        </div>

        <button type="submit" class="btn btn-primary btn-lg w-100 mb-3" :disabled="loading">
          <span v-if="!loading">Kirim OTP Reset</span>
          <span v-else class="spinner-border spinner-border-sm me-2" role="status"></span>
        </button>
      </form>

      <div class="text-center mt-3">
        <router-link to="/login" class="link-primary small">← Kembali ke Login</router-link>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/composables/auth/useAuth';

const email = ref('');
const loading = ref(false);
const errorMessage = ref('');
const router = useRouter();
const auth = useAuth();

const clearError = () => { errorMessage.value = ''; };

const requestReset = async () => {
  clearError();
  loading.value = true;
  try {
    await auth.requestForgotPassword(email.value);

    // Simpan email yang sedang melakukan reset untuk langkah berikutnya
    localStorage.setItem('resetEmail', email.value);
    router.push('/reset-password-verify');
  } catch (err: any) {
    errorMessage.value = err.message || 'Gagal mengirim OTP. Silakan coba lagi.';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.btn-primary {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  border: none;
}
.btn-primary:hover {
  background: linear-gradient(135deg, #4f46e5, #4338ca);
}

.form-control:focus {
  box-shadow: 0 0 0 0.2rem rgba(99, 102, 241, 0.25);
  border-color: #6366f1;
}
</style>
