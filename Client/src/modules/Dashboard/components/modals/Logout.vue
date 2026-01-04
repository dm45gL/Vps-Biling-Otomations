<!-- src/components/modals/LogoutConfirmationModal.vue -->
<template>
  <Transition name="modal-fade">
    <div v-if="modelValue" class="modal-overlay" @click.self="$emit('update:modelValue', false)">
      <div class="modal-card">
        <div class="modal-icon">
          <i class="fas fa-sign-out-alt"></i>
        </div>
        <h3 class="modal-title">Konfirmasi Logout</h3>
        <p class="modal-text">Anda akan keluar dari sistem. Semua sesi akan diakhiri.</p>
        <div class="modal-actions">
          <button class="btn-secondary" @click="$emit('update:modelValue', false)">Batal</button>
          <button class="btn-danger" @click="handleConfirm">Logout</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'confirm'): void;
}>();

const handleConfirm = () => {
  emit('confirm');
  emit('update:modelValue', false);
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-card {
  background: white;
  border-radius: 16px;
  padding: 2.5rem;
  width: 90%;
  max-width: 420px;
  text-align: center;
  box-shadow: 0 12px 40px rgba(91, 62, 150, 0.2);
  border: 1px solid #eaeef7;
}

.modal-icon {
  width: 72px;
  height: 72px;
  background: rgba(239, 68, 68, 0.12);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  color: #ef4444;
  font-size: 28px;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.75rem;
}

.modal-text {
  color: #5a5a6a;
  margin-bottom: 2rem;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn-secondary,
.btn-danger {
  padding: 10px 24px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 15px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary {
  background: #f8f9fe;
  color: #3a3a4a;
}
.btn-secondary:hover {
  background: #eaeef7;
}

.btn-danger {
  background: #ef4444;
  color: white;
}
.btn-danger:hover {
  background: #dc2626;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>