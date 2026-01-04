<!-- src/views/Profile/ProfileInfoSection.vue -->
<template>
  <div class="mb-5">
    <div class="field">
      <label class="label">Username</label>
      <div class="control">
        <input
          v-model="localUsername"
          class="input"
          type="text"
          placeholder="Your username"
        />
      </div>
    </div>

    <div class="field">
      <label class="label">Email</label>
      <div class="control">
        <input
          v-model="localEmail"
          class="input"
          type="email"
          placeholder="your@email.com"
        />
      </div>
    </div>

    <div class="field is-grouped is-grouped-centered mt-4">
      <div class="control">
        <button
          class="button is-primary"
          :disabled="!hasChanges"
          @click="handleSave"
        >
          Save Profile
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

const props = defineProps<{
  client: {
    username: string;
    email: string;
  };
}>();

const emit = defineEmits<{
  (e: 'save', data: { username?: string; email?: string }): void;
}>();

const localUsername = ref(props.client.username);
const localEmail = ref(props.client.email);

// Sinkronisasi ulang jika props berubah (misal: setelah update)
watch(() => props.client, (newVal) => {
  localUsername.value = newVal.username;
  localEmail.value = newVal.email;
});

const hasChanges = computed(() => {
  return (
    localUsername.value !== props.client.username ||
    localEmail.value !== props.client.email
  );
});

const handleSave = () => {
  const updates: { username?: string; email?: string } = {};
  if (localUsername.value !== props.client.username) {
    updates.username = localUsername.value;
  }
  if (localEmail.value !== props.client.email) {
    updates.email = localEmail.value;
  }
  emit('save', updates);
};
</script>