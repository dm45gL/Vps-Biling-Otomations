<template>
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
        <button class="close-btn" @click="removeToast(toast.id)">&times;</button>
      </div>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { toasts, removeToast } from './toast';
</script>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.toast {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-width: 220px;
  max-width: 300px;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  color: white;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  cursor: default;
  animation: slideIn 0.3s ease-out;
}
.toast.success { background-color: #22c55e; }
.toast.error { background-color: #ef4444; }
.close-btn { background: transparent; border: none; color: white; font-size: 1.2rem; cursor: pointer; }
.toast span i { margin-right: 0.5rem; }
@keyframes slideIn { 0% { transform: translateX(100%); opacity: 0; } 100% { transform: translateX(0); opacity: 1; } }
.toast-enter-active, .toast-leave-active { transition: all 0.3s; }
.toast-leave-from { opacity: 1; transform: translateX(0); }
.toast-leave-to { opacity: 0; transform: translateX(100%); }
</style>
