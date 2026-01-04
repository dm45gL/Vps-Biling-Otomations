<!-- src/views/Profile/EmailChangeSection.vue -->
<template>
  <div class="box mt-5">
    <h2 class="subtitle is-5">Change Email</h2>
    <div class="field">
      <label class="label">New Email</label>
      <div class="control">
        <input
          v-model="newEmail"
          class="input"
          type="email"
          placeholder="new@email.com"
          :disabled="otpRequested"
        />
      </div>
    </div>
    <div class="field is-grouped is-grouped-centered mt-3">
      <div class="control">
        <button
          class="button is-info"
          :disabled="!newEmail || otpRequested"
          @click="handleRequestOtp"
        >
          Request OTP
        </button>
      </div>
    </div>

    <!-- OTP Input -->
    <div v-if="otpRequested" class="mt-4">
      <div class="field">
        <label class="label">Enter OTP</label>
        <div class="control">
          <input
            v-model="otp"
            class="input"
            type="text"
            placeholder="6-digit code"
            @keyup.enter="handleConfirm"
          />
        </div>
      </div>
      <div class="field is-grouped is-grouped-centered mt-2">
        <div class="control">
          <button
            class="button is-success"
            :disabled="!otp.trim()"
            @click="handleConfirm"
          >
            Confirm Email Change
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const emit = defineEmits<{
  (e: 'request-otp', email: string): void;
  (e: 'confirm', otp: string): void;
}>();

const newEmail = ref('');
const otp = ref('');
const otpRequested = ref(false);

const handleRequestOtp = () => {
  emit('request-otp', newEmail.value);
  otpRequested.value = true;
  newEmail.value = '';
};

const handleConfirm = () => {
  if (otp.value.trim()) {
    emit('confirm', otp.value.trim());
    otp.value = '';
    otpRequested.value = false;
  }
};
</script>