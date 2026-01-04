<template>
  <div class="p-4">
    <h2 class="mb-4">Profil Saya</h2>

    <!-- Loading -->
    <div v-if="loading" class="text-center my-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <!-- Error -->
    <div v-if="errorMessage" class="alert alert-danger">
      {{ errorMessage }}
    </div>

    <!-- Profil Info -->
    <div v-if="user" class="card shadow-sm">
      <div class="card-body">
        <div class="row mb-2">
          <div class="col-md-3 fw-bold">Nama:</div>
          <div class="col-md-9">{{ user.name || '-' }}</div>
        </div>
        <div class="row mb-2">
          <div class="col-md-3 fw-bold">Email:</div>
          <div class="col-md-9">{{ user.email }}</div>
        </div>
        <div class="row mb-2">
          <div class="col-md-3 fw-bold">Role:</div>
          <div class="col-md-9">{{ user.role }}</div>
        </div>
        <div class="row mb-2">
          <div class="col-md-3 fw-bold">Dibuat:</div>
          <div class="col-md-9">{{ formatDate(user.createdAt) }}</div>
        </div>
        <div class="row mb-2">
          <div class="col-md-3 fw-bold">Diubah:</div>
          <div class="col-md-9">{{ formatDate(user.updatedAt) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getCurrentUser } from '@/api/auth';

interface User {
  id: string;
  name?: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

const user = ref<User | null>(null);
const loading = ref(true);
const errorMessage = ref('');

const fetchUser = async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
    const res = await getCurrentUser();
    user.value = res.data;
  } catch (err: any) {
    errorMessage.value = err?.response?.data?.error || 'Gagal memuat profil';
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleString();
};

onMounted(fetchUser);
</script>

<style scoped>
.card {
  max-width: 600px;
}
</style>
