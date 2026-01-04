<template>
  <div class="billing-address-form">
    <div class="columns is-multiline">
      <!-- Nama Lengkap -->
      <div class="column is-12">
        <div class="field">
          <label class="label">
            Nama Lengkap <span class="has-text-danger">*</span>
          </label>
          <div class="control">
            <input
              v-model="localModel.fullName"
              :disabled="disabled"
              class="input"
              type="text"
              required
              placeholder="Contoh: Budi Santoso"
            />
          </div>
        </div>
      </div>

      <!-- Email -->
      <div class="column is-12">
        <div class="field">
          <label class="label">
            Email <span class="has-text-danger">*</span>
          </label>
          <div class="control">
            <input
              v-model="localModel.email"
              :disabled="disabled"
              class="input"
              type="email"
              required
              placeholder="budi@example.com"
            />
          </div>
        </div>
      </div>

      <!-- Perusahaan (Opsional) -->
      <div class="column is-12">
        <div class="field">
          <label class="label">Nama Perusahaan (Opsional)</label>
          <div class="control">
            <input
              v-model="localModel.companyName"
              :disabled="disabled"
              class="input"
              type="text"
              placeholder="PT. Contoh Perusahaan"
            />
          </div>
        </div>
      </div>

      <!-- Negara -->
      <div class="column is-12">
        <div class="field">
          <label class="label">
            Negara <span class="has-text-danger">*</span>
          </label>
          <div class="control">
            <input
              v-model="localModel.country"
              :disabled="disabled"
              class="input"
              type="text"
              required
              placeholder="Indonesia"
            />
          </div>
        </div>
      </div>

      <!-- Provinsi & Kota -->
      <div class="column is-6-tablet is-6-desktop">
        <div class="field">
          <label class="label">
            Provinsi <span class="has-text-danger">*</span>
          </label>
          <div class="control">
            <input
              v-model="localModel.state"
              :disabled="disabled"
              class="input"
              type="text"
              required
              placeholder="Jawa Barat"
            />
          </div>
        </div>
      </div>
      <div class="column is-6-tablet is-6-desktop">
        <div class="field">
          <label class="label">
            Kota <span class="has-text-danger">*</span>
          </label>
          <div class="control">
            <input
              v-model="localModel.city"
              :disabled="disabled"
              class="input"
              type="text"
              required
              placeholder="Bandung"
            />
          </div>
        </div>
      </div>

      <!-- Kode Pos -->
      <div class="column is-12-tablet is-6-desktop">
        <div class="field">
          <label class="label">
            Kode Pos <span class="has-text-danger">*</span>
          </label>
          <div class="control">
            <input
              v-model="localModel.postalCode"
              :disabled="disabled"
              class="input"
              type="text"
              required
              placeholder="40115"
            />
          </div>
        </div>
      </div>

      <!-- Alamat Lengkap -->
      <div class="column is-12">
        <div class="field">
          <label class="label">
            Alamat Lengkap <span class="has-text-danger">*</span>
          </label>
          <div class="control">
            <input
              v-model="localModel.addressLine1"
              :disabled="disabled"
              class="input"
              type="text"
              required
              placeholder="Jl. Merdeka No. 123, Kel. Sukajadi"
            />
          </div>
        </div>
      </div>

      <!-- Alamat Baris 2 (Opsional) -->
      <div class="column is-12">
        <div class="field">
          <label class="label">Detail Tambahan (Opsional)</label>
          <div class="control">
            <input
              v-model="localModel.addressLine2"
              :disabled="disabled"
              class="input"
              type="text"
              placeholder="Gedung ABC, Lantai 3"
            />
          </div>
        </div>
      </div>

      <!-- Nomor Telepon -->
      <div class="column is-12">
        <div class="field">
          <label class="label">
            Nomor Telepon <span class="has-text-danger">*</span>
          </label>
          <div class="control">
            <input
              v-model="localModel.phone"
              :disabled="disabled"
              class="input"
              type="tel"
              required
              placeholder="+62 812 3456 7890"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  modelValue: {
    fullName: string;
    email: string;
    companyName?: string;
    country: string;
    state: string;
    city: string;
    addressLine1: string;
    addressLine2?: string;
    postalCode: string;
    phone: string;
  };
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: typeof props.modelValue): void;
}>();

// Sinkronisasi v-model
const localModel = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});
</script>

<style scoped>
/* Override Bulma primary color */
:deep(.input:focus) {
  border-color: #6A5BEF;
  box-shadow: 0 0 0 2px rgba(106, 91, 239, 0.2);
}

.label {
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
  display: block;
}

.input {
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  padding: 0.625rem 0.75rem;
  font-size: 1rem;
  transition: border-color 0.2s ease;
}
</style>