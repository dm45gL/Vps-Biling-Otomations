<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/composables/auth/useAuth';

const auth = useAuth();
const router = useRouter();
const loggingOut = ref(false);

const displayName = computed(() => {
  return auth.user.value?.email?.split('@')[0] || 'Admin'; // contoh: "dgalih233"
  // atau tampilkan full email: auth.user.value?.email || 'Admin'
});

const handleLogout = async () => {
  if (loggingOut.value) return;
  loggingOut.value = true;
  try {
    await auth.performLogout();
    router.push('/login');
  } catch (error) {
    console.error('Logout error:', error);
    router.push('/login');
  } finally {
    loggingOut.value = false;
  }
};
</script>

<template>
  <div class="dashboard">
    <header class="dashboard-header">
      <h1>Selamat Datang, {{ displayName }}!</h1>
        <p>Role: {{ auth.user.value?.role || '–' }}</p>

    </header>

    <div class="actions">
      <button
        @click="handleLogout"
        :disabled="loggingOut"
        class="btn btn-danger"
      >
        {{ loggingOut ? 'Sedang Logout...' : 'Logout' }}
      </button>
    </div>
  </div>
</template>

