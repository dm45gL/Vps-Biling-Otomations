<template>
  <div class="profile-page">
    <div class="container is-max-widescreen">

      <!-- Loading -->
      <div v-if="loading" class="has-text-centered py-6">
        <div class="loading-spinner">
          <i class="fas fa-spinner fa-spin"></i>
        </div>
        <p class="mt-3 has-text-grey">Loading your profile...</p>
      </div>

      <!-- Konten Utama -->
      <div v-else-if="client" class="columns is-variable is-8">

        <!-- Kolom Kiri: Avatar & Info -->
        <div class="column is-4">
          <div class="profile-card">
            <div class="avatar-section">
              <div class="avatar-placeholder">
                {{ client.username.charAt(0).toUpperCase() }}
              </div>
            </div>
            <div class="info-section">
              <h3 class="username">{{ client.username }}</h3>
              <p class="email">{{ client.email }}</p>
            </div>
            <div class="action-section mt-5">
              <button
                v-if="!isEditing && !isVerifying"
                class="button is-primary is-fullwidth"
                @click="startEdit"
              >
                <span class="icon"><i class="fas fa-edit"></i></span>
                <span>Edit Profile</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Kolom Kanan: Form -->
        <div class="column is-8">
          <div class="profile-card">

            <!-- Mode Edit -->
            <div v-if="isEditing && !isVerifying">
              <h2 class="form-title">Edit Profile</h2>

              <div class="field">
                <label class="label">Username</label>
                <div class="control">
                  <div class="input-icon">
                    <i class="fas fa-user"></i>
                    <input
                      v-model="formData.username"
                      class="input"
                      type="text"
                      placeholder="Enter your username"
                    />
                  </div>
                </div>
              </div>

              <div class="field">
                <label class="label">Email Address</label>
                <div class="control">
                  <div class="input-icon">
                    <i class="fas fa-envelope"></i>
                    <input
                      v-model="formData.email"
                      class="input"
                      type="email"
                      placeholder="you@yourcompany.com"
                    />
                  </div>
                </div>
                <p v-if="isEmailChanged" class="help is-success mt-2">
                  <i class="fas fa-check-circle"></i> Email change requires verification
                </p>
              </div>

              <div class="field">
                <label class="label">
                  New Password
                  <span class="is-size-7 has-text-grey ml-2">(optional)</span>
                </label>
                <div class="control">
                  <div class="input-icon">
                    <i class="fas fa-lock"></i>
                    <input
                      v-model="formData.newPassword"
                      :type="showPassword ? 'text' : 'password'"
                      class="input"
                      placeholder="••••••••"
                      @input="validatePassword"
                    />
                    <button
                      type="button"
                      class="input-icon-right"
                      @click="showPassword = !showPassword"
                    >
                      <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                    </button>
                  </div>
                </div>
                <div v-if="formData.newPassword" class="password-strength mt-2">
                  <div
                    class="strength-bar"
                    :class="{
                      'is-weak': passwordStrength < 30,
                      'is-medium': passwordStrength >= 30 && passwordStrength < 70,
                      'is-strong': passwordStrength >= 70,
                    }"
                    :style="{ width: passwordStrength + '%' }"
                  ></div>
                  <p class="strength-text mt-1">
                    {{
                      passwordStrength < 30 ? 'Weak' : passwordStrength < 70 ? 'Medium' : 'Strong'
                    }}
                  </p>
                </div>
                <p v-if="passwordError" class="help is-danger mt-1">{{ passwordError }}</p>
              </div>

              <div class="field is-grouped is-grouped-right mt-6">
                <div class="control">
                  <button class="button is-outlined" @click="cancelEdit">Cancel</button>
                </div>
                <div class="control">
                  <button
                    class="button is-primary"
                    :class="{ 'is-loading': loading }"
                    :disabled="!hasChanges || !!passwordError"
                    @click="submitEdit"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>

            <!-- Mode Verifikasi OTP -->
            <div v-else-if="isVerifying">
              <h2 class="form-title">
                {{ verificationType === 'email' ? 'Verify New Email' : 'Verify Password Change' }}
              </h2>
              <p class="subtitle is-6 has-text-grey mb-5">
                We’ve sent a 6-digit code to your
                {{ verificationType === 'email' ? 'new email address' : 'registered email' }}.
              </p>

              <div class="field">
                <label class="label">Enter OTP Code</label>
                <div class="control">
                  <input
                    v-model="otpInput"
                    class="input is-large has-text-centered otp-input"
                    type="text"
                    maxlength="6"
                    inputmode="numeric"
                    placeholder="••••••"
                    @keyup.enter="submitVerification"
                  />
                </div>
                <p v-if="otpError" class="help is-danger mt-2">{{ otpError }}</p>
              </div>

              <div class="field is-grouped is-grouped-centered mt-6">
                <div class="control">
                  <button class="button is-outlined" @click="cancelVerification">Cancel</button>
                </div>
                <div class="control">
                  <button
                    class="button is-success"
                    :class="{ 'is-loading': loading }"
                    :disabled="otpInput.length !== 6"
                    @click="submitVerification"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>

            <!-- Mode Mobile View -->
            <div v-else-if="!isEditing && !isVerifying" class="mobile-view">
              <div class="field">
                <label class="label">Username</label>
                <p class="value">{{ client.username }}</p>
              </div>
              <div class="field">
                <label class="label">Email</label>
                <p class="value">{{ client.email }}</p>
              </div>
              <div class="field mt-5">
                <button class="button is-primary is-fullwidth" @click="startEdit">
                  <span class="icon"><i class="fas fa-edit"></i></span>
                  <span>Edit Profile</span>
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>

    <!-- Toast Notifikasi -->
    <div class="toast-container">
      <transition-group name="toast" tag="div">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="['toast', toast.type]"
        >
          <span>
            <i v-if="toast.type === 'success'" class="fas fa-check-circle"></i>
            <i v-else class="fas fa-exclamation-circle"></i>
            {{ toast.message }}
          </span>
          <button class="close-btn" @click="toasts = toasts.filter(t => t.id !== toast.id)">&times;</button>
        </div>
      </transition-group>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useClientProfile } from '@/composables/useClientProfile';

const {
  client,
  loading,
  updateProfile,
  confirmPasswordUpdate,
  confirmEmailUpdate,
} = useClientProfile();

// State UI
const isEditing = ref(false);
const isVerifying = ref(false);
const verificationType = ref<'email' | 'password'>('email');
const otpInput = ref('');
const otpError = ref<string | null>(null);
const showPassword = ref(false);
const passwordError = ref<string | null>(null);
const passwordStrength = ref(0);

// Form data
const formData = ref({ username: '', email: '', newPassword: '' });

// Toast Notifikasi
interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

const toasts = ref<Toast[]>([]);
let nextToastId = 1;

const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  const id = nextToastId++;
  toasts.value.push({ id, message, type });
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id);
  }, 3000);
};

// Inisialisasi form
onMounted(() => {
  if (client.value) {
    formData.value = { username: client.value.username, email: client.value.email, newPassword: '' };
  }
});

// Komputasi
const hasChanges = computed(() => {
  if (!client.value) return false;
  return formData.value.username !== client.value.username ||
         formData.value.email !== client.value.email ||
         !!formData.value.newPassword;
});

const isEmailChanged = computed(() => client.value && formData.value.email !== client.value.email);

// Validasi password
const validatePassword = () => {
  passwordError.value = null;
  const pwd = formData.value.newPassword;
  if (!pwd) { passwordStrength.value = 0; return true; }

  let score = 0;
  if (pwd.length >= 8) score += 25;
  if (/[a-z]/.test(pwd)) score += 25;
  if (/[A-Z]/.test(pwd)) score += 25;
  if (/\d/.test(pwd)) score += 12;
  if (/[^a-zA-Z0-9]/.test(pwd)) score += 13;

  passwordStrength.value = Math.min(score, 100);

  const hasUpper = /[A-Z]/.test(pwd);
  const hasLower = /[a-z]/.test(pwd);
  const hasNumber = /\d/.test(pwd);
  const hasSymbol = /[^a-zA-Z0-9]/.test(pwd);

  if (!(hasUpper && hasLower && hasNumber && hasSymbol && pwd.length >= 8)) {
    passwordError.value = 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character';
    return false;
  }
  return true;
};

// Actions
const startEdit = () => {
  if (client.value) formData.value = { username: client.value.username, email: client.value.email, newPassword: '' };
  isEditing.value = true; passwordError.value = null; otpError.value = null;
};

const cancelEdit = () => isEditing.value = false;

const submitEdit = async () => {
  if (!validatePassword()) return;

  const updates: any = {};
  let needsEmailOTP = false, needsPasswordOTP = false;

  if (formData.value.username !== client.value?.username) updates.username = formData.value.username;
  if (formData.value.email !== client.value?.email) { updates.email = formData.value.email; needsEmailOTP = true; }
  if (formData.value.newPassword) { updates.newPassword = formData.value.newPassword; needsPasswordOTP = true; }

  try {
    await updateProfile(updates);
    if (needsEmailOTP || needsPasswordOTP) {
      isEditing.value = false; isVerifying.value = true;
      verificationType.value = needsEmailOTP ? 'email' : 'password';
      otpInput.value = ''; otpError.value = null;
    } else {
      showToast('Profile updated successfully', 'success');
      isEditing.value = false;
    }
  } catch (err: any) {
    showToast(err?.response?.data?.error || 'Something went wrong', 'error');
  }
};

const cancelVerification = () => { isVerifying.value = false; isEditing.value = true; };

const submitVerification = async () => {
  otpError.value = null;
  try {
    if (verificationType.value === 'email') {
      await confirmEmailUpdate(otpInput.value);
      showToast('Email updated successfully', 'success');
    } else {
      await confirmPasswordUpdate(otpInput.value);
      showToast('Password updated successfully', 'success');
    }
    isVerifying.value = false;
    isEditing.value = false;
    otpInput.value = '';
  } catch (err: any) {
    otpError.value = err?.response?.data?.error || 'Invalid OTP code';
    showToast(otpError.value ?? 'Invalid OTP code', 'error');
  }
};
</script>

<style scoped>
/* --- Profile Page --- */
.profile-page {
  padding: 2rem 0;
  min-height: 100%;
  background-color: #f9f9fb;
}

/* --- Profile Card & Columns --- */
.profile-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 20px -2px rgba(91, 62, 150, 0.08);
  border: 1px solid #eaeef7;
  transition: box-shadow 0.2s;
}
.profile-card:hover {
  box-shadow: 0 6px 28px -4px rgba(91, 62, 150, 0.12);
}

/* --- Avatar --- */
.avatar-section {
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
}
.avatar-placeholder {
  width: 112px;
  height: 112px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6A5ACD 0%, #8a7dfa 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 2.25rem;
  box-shadow: 0 4px 12px rgba(106, 91, 205, 0.3);
}

/* --- Info Section --- */
.info-section {
  text-align: center;
  margin-bottom: 1.5rem;
}
.username {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.25rem;
}
.email {
  color: #5a5a6a;
  font-size: 1rem;
}
.form-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 1.5rem;
  text-align: center;
}

/* --- Input with Icon --- */
.input-icon {
  position: relative;
  display: flex;
  align-items: center;
}
.input-icon input {
  padding-left: 48px;
  padding-right: 48px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  height: 48px;
  font-size: 1rem;
}
.input-icon i {
  position: absolute;
  left: 16px;
  color: #a4a4a4;
  z-index: 1;
}
.input-icon-right {
  position: absolute;
  right: 40px;
  top: 35%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #7a7f94;
  cursor: pointer;
  font-size: 1rem;
  padding: 4px;
  border-radius: 6px;
  transition: background 0.2s, color 0.2s;
}
.input-icon-right:hover {
  background-color: rgba(0,0,0,0.05);
  color: #a1a1a1;
}

/* --- Password Strength --- */
.password-strength {
  height: 6px;
  background: #eaeef7;
  border-radius: 3px;
  overflow: hidden;
  margin-top: 4px;
}
.strength-bar {
  height: 100%;
  transition: width 0.3s ease, background 0.3s;
}
.strength-bar.is-weak { background: #ef4444; }
.strength-bar.is-medium { background: #f59e0b; }
.strength-bar.is-strong { background: #22c55e; }
.strength-text {
  font-size: 0.875rem;
  color: #4a4a4a;
}

/* --- OTP Input --- */
.otp-input {
  font-size: 1.5rem;
  letter-spacing: 8px;
  text-align: center;
  padding: 0.75rem;
  border: 2px solid #eaeef7;
  border-radius: 12px;
}

/* --- Buttons --- */
.button.is-primary { background: #b8aff6; border: none; color: white; }
.button.is-primary:hover { background: #a498f7; }
.button.is-success { background: #22c55e; border: none; color: white; }
.button.is-success:hover { background: #1ea04b; }
.button.is-outlined { color: #4a4a4a; border-color: #d1d5db; }
.button.is-outlined:hover { background-color: #f5f5f5; color: #363636; border-color: #b5b5b5; }

/* --- Loading Spinner --- */
.loading-spinner {
  font-size: 2.5rem;
  color: #6A5ACD;
}

/* --- Mobile Responsive --- */
@media (max-width: 768px) {
  .columns.is-variable.is-8 { flex-direction: column; }
  .profile-card { padding: 1.5rem; }
  .avatar-placeholder { width: 80px; height: 80px; font-size: 1.75rem; }
  .mobile-view .value {
    font-size: 1.125rem;
    color: #3a3a4a;
    margin: 0.5rem 0;
    padding: 0.5rem 0;
    border-bottom: 1px solid #f0f1f5;
  }
}

/* --- Toast Notifications --- */
.toast-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  z-index: 9999;
}
.toast {
  padding: 0.75rem 1rem;
  border-radius: 8px;
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 250px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.15);
  font-weight: 500;
  transition: all 0.3s ease;
}
.toast.success { background-color: #22c55e; }
.toast.error { background-color: #ef4444; }
.toast span { display: flex; align-items: center; gap: 0.5rem; }
.close-btn {
  background: transparent;
  border: none;
  color: white;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}
.toast-enter-from, .toast-leave-to {
  opacity: 0;
  transform: translateX(50%);
}
.toast-enter-to, .toast-leave-from {
  opacity: 1;
  transform: translateX(0%);
}
.toast-enter-active, .toast-leave-active {
  transition: all 0.3s ease;
}

</style>