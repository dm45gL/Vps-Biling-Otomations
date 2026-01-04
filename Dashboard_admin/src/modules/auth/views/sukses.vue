<template>
  <div class="success-container">
    <div class="success-card">
      <!-- Success Icon -->
      <div class="icon-wrapper">
        <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
          <linearGradient id="checkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#6A5BEF" />
            <stop offset="100%" stop-color="#8A7CF0" />
          </linearGradient>
          <circle cx="24" cy="24" r="22" fill="url(#checkGradient)" />
          <path
            d="M16 24l6 6 12-12"
            stroke="white"
            stroke-width="4"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>

      <h1 class="title">Password berhasil diperbarui!</h1>
      <p class="subtitle">Anda akan diarahkan ke halaman login...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

onMounted(() => {
  const timer = setTimeout(() => {
    router.push('/login');
  }, 2000);

  // Cleanup timer jika komponen di-unmount sebelum redirect
  onUnmounted(() => {
    clearTimeout(timer);
  });
});

// Tambahkan onUnmounted untuk keamanan
import { onUnmounted } from 'vue';
</script>

<style scoped>
.success-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #f9f8ff;
  padding: 16px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.success-card {
  text-align: center;
  max-width: 400px;
  padding: 0 16px;
}

.icon-wrapper {
  width: 80px;
  height: 80px;
  margin: 0 auto 24px;
}

.title {
  font-size: 22px;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.subtitle {
  font-size: 14px;
  color: #6b7280;
  margin-top: 8px;
  line-height: 1.5;
}
</style>