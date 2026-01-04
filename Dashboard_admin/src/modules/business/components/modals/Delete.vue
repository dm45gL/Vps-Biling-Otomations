<!-- src/components/ui/DeleteConfirmationModal.vue -->
<template>
  <div class="modal-overlay" @click.self="handleCancel" @keyup.esc="handleCancel">
    <div class="modal-card" role="dialog" aria-labelledby="modal-title">
      <div class="modal-header">
        <div class="modal-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M18 9L16.5 7.5C16.11 7.11 15.42 6 14 6H10C8.58 6 7.89 7.11 7.5 7.5L6 9M19 6H17V4C17 3.47 16.79 2.96 16.42 2.59C16.05 2.21 15.54 2 15 2H9C8.46 2 7.95 2.21 7.58 2.59C7.21 2.96 7 3.47 7 4V6H5C4.47 6 3.96 6.21 3.59 6.59C3.21 6.95 3 7.47 3 8V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V8C21 7.47 20.79 6.96 20.42 6.59C20.05 6.21 19.54 6 19 6Z"
              stroke="#EF4444"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
        <h3 id="modal-title" class="modal-title">Confirm Deletion</h3>
      </div>

      <div class="modal-body">
        <p class="modal-description">
          This action will permanently delete the pricing plan for
          <span class="modal-target">{{ targetLabel }}</span>.
          This cannot be undone.
        </p>

        <div class="confirmation-section">
          <p class="confirmation-instruction">
            To confirm, please type the word
            <span class="confirmation-keyword">delete</span>
            below:
          </p>
          <input
            v-model="confirmText"
            type="text"
            class="confirmation-input"
            placeholder="delete"
            @keyup.enter="handleConfirm"
            autofocus
            aria-label="Type 'delete' to confirm deletion"
          />
          <div v-if="showError" class="confirmation-error">
            The word must be typed exactly as shown.
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn-cancel" @click="handleCancel">Cancel</button>
        <button
          type="button"
          class="btn-delete"
          :class="{ 'btn-delete-active': confirmText === 'delete' }"
          :disabled="confirmText !== 'delete' || loading"
          @click="handleConfirm"
        >
          <span v-if="loading">Deleting...</span>
          <span v-else>Delete</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

const props = defineProps<{
  targetLabel: string
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const confirmText = ref('')
const showError = ref(false)

watch(() => props.targetLabel, async () => {
  confirmText.value = ''
  showError.value = false
  await nextTick()
  const input = document.querySelector('.confirmation-input') as HTMLInputElement
  input?.focus()
})

const handleCancel = () => emit('cancel')
const handleConfirm = () => {
  if (confirmText.value === 'delete') emit('confirm')
  else showError.value = true
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9000;
  animation: fadeIn 0.2s ease-out;
}

.modal-card {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 520px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px 32px;
  border-bottom: 1px solid #f0ecff;
  background: #faf9ff;
}
.modal-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: #fef2f2;
}
.modal-title {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.modal-body {
  padding: 32px;
}
.modal-description {
  color: #475569;
  font-size: 15px;
  line-height: 1.5;
  margin: 0 0 32px;
  text-align: center;
}
.modal-target {
  font-weight: 600;
  color: #1e293b;
}

.confirmation-section {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.confirmation-instruction {
  color: #475569;
  font-size: 14px;
  margin: 0 0 16px;
}
.confirmation-keyword {
  font-weight: 700;
  color: #ef4444;
  font-family: monospace;
  letter-spacing: 0.5px;
}

.confirmation-input {
  width: 200px;
  padding: 12px 16px;
  font-size: 16px;
  font-weight: 600;
  text-align: center;
  letter-spacing: 0.5px;
  border: 1px solid #e2e0f0;
  border-radius: 12px;
  background: #faf9ff;
  transition: border-color 0.2s, box-shadow 0.2s;
  font-family: 'Inter', monospace;
}
.confirmation-input:focus {
  outline: none;
  border-color: #c7b8ea;
  box-shadow: 0 0 0 3px rgba(126, 87, 194, 0.15);
}

.confirmation-error {
  color: #ef4444;
  font-size: 13px;
  font-weight: 600;
  margin-top: 12px;
  height: 18px;
  text-align: center;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 24px 32px 32px;
  border-top: 1px solid #f0ecff;
  justify-content: flex-end;
}

.btn-cancel {
  padding: 10px 24px;
  background: #f5f3ff;
  color: #6A5BEF;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-cancel:hover {
  background: #ede9ff;
}

.btn-delete {
  padding: 10px 24px;
  background: #fee2e2;
  color: #dc2626;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 15px;
  cursor: not-allowed;
  transition: all 0.2s;
}
.btn-delete-active {
  background: #ef4444;
  color: white;
  cursor: pointer;
}
.btn-delete-active:hover {
  background: #dc2626;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
