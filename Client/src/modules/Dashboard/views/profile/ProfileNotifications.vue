<!-- src/views/Profile/ProfileNotifications.vue -->
<template>
  <div v-if="error" class="notification is-danger mb-4">{{ error }}</div>
  <div v-if="success" class="notification is-success mb-4">{{ success }}</div>
</template>

<script setup lang="ts">
defineProps<{
  error?: string | null;
  success?: string | null;
}>();
</script>