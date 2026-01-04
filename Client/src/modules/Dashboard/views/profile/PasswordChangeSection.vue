<!-- src/views/Profile/PasswordChangeSection.vue -->
<template>
  <div class="box mt-5">
    <h2 class="subtitle is-5">Change Password</h2>
    <div class="field">
      <label class="label">New Password</label>
      <div class="control">
        <input
          v-model="newPassword"
          class="input"
          type="password"
          placeholder="Enter new password"
          :disabled="otpRequested"
        />
      </div>
    </div>
    <div class="field is-grouped is-grouped-centered mt-3">
      <div class="control">
        <button
          class="button is-warning"
          :disabled="!newPassword || otpRequested"
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
            Confirm Password Change
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const emit = defineEmits<{
  (e: 'request-otp', password: string): void;
  (e: 'confirm', otp: string): void;
}>();

const newPassword = ref('');
const otp = ref('');
const otpRequested = ref(false);

const handleRequestOtp = () => {
  emit('request-otp', newPassword.value);
  otpRequested.value = true;
  newPassword.value = ''; // Kosongkan setelah request
};

const handleConfirm = () => {
  if (otp.value.trim()) {
    emit('confirm', otp.value.trim());
    otp.value = '';
    otpRequested.value = false; // Reset setelah konfirmasi (bisa juga tunggu sukses dari parent)
  }
};
</script>