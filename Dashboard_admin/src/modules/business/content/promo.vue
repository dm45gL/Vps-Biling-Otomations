<template>
  <div class="promo-management">
    <!-- Notification -->
    <div v-if="notification.visible" class="notification" :class="notification.type">
      {{ notification.message }}
    </div>

    <!-- Top Bar -->
    <div class="top-bar">
      <div class="top-left">
        <h1 class="page-title">Promotions</h1>
        <p class="page-subtitle">Create and manage discount codes for your products</p>
      </div>
      <button class="btn-primary" @click="openCreateModal">+ New Promo</button>
    </div>

    <!-- Promo List -->
    <div class="promo-list">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading promotions...</p>
      </div>

      <div v-else-if="error" class="error-state">
        <p>{{ error }}</p>
        <button class="btn-secondary" @click="fetchPromos">Retry</button>
      </div>

      <div v-else-if="promos.length === 0" class="empty-state">
        <div class="empty-icon">🎟️</div>
        <h3>No promotions yet</h3>
        <p>Create your first promo code to offer discounts to customers.</p>
        <button class="btn-primary" @click="openCreateModal">Create Promo</button>
      </div>

      <div v-else class="promo-grid">
        <div
          v-for="p in promos"
          :key="p.id"
          class="promo-card"
          :class="{ 'promo-expired': isExpired(p), 'promo-inactive': !p.isActive }"
        >
          <!-- Promo Code Header with Copy -->
          <div class="promo-code-header">
            <div class="promo-code-box">
              <span class="promo-code-text">{{ p.code }}</span>
            </div>
            <button
              class="btn-copy"
              @click="copyCode(p.code)"
              :title="`Copy ${p.code}`"
            >
              <svg v-if="!copiedCodes[p.code]" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M16 16V8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2Z" stroke="#6A5BEF" stroke-width="1.5"/>
                <path d="M14 10H6M14 14H6M12 8V16M19 12H17M19 8H17M19 16H17" stroke="#6A5BEF" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17L4 12" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>

          <!-- Status Badge -->
          <div class="promo-status-badge" :class="{ 'status-active': p.isActive, 'status-inactive': !p.isActive, 'status-expired': isExpired(p) }">
            {{ isExpired(p) ? 'Expired' : (p.isActive ? 'Active' : 'Inactive') }}
          </div>

          <!-- Discount & Details -->
          <div class="promo-content">
            <div class="discount-display">
              <span class="discount-value">{{ formatDiscount(p) }}</span>
              <span class="discount-label">off</span>
            </div>

            <div class="promo-details">
              <div class="detail-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M19 3V7C19 8.10457 18.1046 9 17 9H7C5.89543 9 5 8.10457 5 7V3" stroke="#94A3B8" stroke-width="1.5" stroke-linecap="round"/>
                  <path d="M5 21V17C5 15.8954 5.89543 15 7 15H17C18.1046 15 19 15.8954 19 17V21" stroke="#94A3B8" stroke-width="1.5" stroke-linecap="round"/>
                  <path d="M12 7V15" stroke="#94A3B8" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                <span>{{ formatDateRange(p.startsAt, p.endsAt) }}</span>
              </div>

              <div class="detail-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M16 16V8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2Z" stroke="#94A3B8" stroke-width="1.5"/>
                  <path d="M14 10H6M14 14H6M12 8V16M19 12H17M19 8H17M19 16H17" stroke="#94A3B8" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                <span>{{ p.usedCount || 0 }} / {{ p.globalLimit || '∞' }} used</span>
              </div>

              <div v-if="p.minOrderAmount" class="detail-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M3 7H21M6 21V5M18 21V5M12 21V5" stroke="#94A3B8" stroke-width="1.5" stroke-linecap="round"/>
                  <path d="M3 12H21" stroke="#94A3B8" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                <span>Min. Rp {{ formatPrice(p.minOrderAmount) }}</span>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="promo-actions">
            <button class="btn-action" @click="editPromo(p)">Edit</button>
            <button class="btn-action btn-delete" @click="confirmDelete(p.id)">Delete</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Promo Modal (Create/Edit) -->
    <teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-card">
          <div class="modal-header">
            <h3>{{ editingPromo ? 'Edit Promo' : 'Create New Promo' }}</h3>
            <button class="modal-close" @click="closeModal">×</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Promo Code *</label>
              <input
                v-model="form.code"
                type="text"
                class="form-input"
                placeholder="e.g. WELCOME10"
                :disabled="editingPromo"
                @blur="validateCode"
              />
              <div v-if="errors.code" class="input-error">{{ errors.code }}</div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Discount Type *</label>
                <select v-model="form.type" class="form-select">
                  <option value="PERCENT">Percentage (%)</option>
                  <option value="FIXED">Fixed Amount (Rp)</option>
                </select>
              </div>
              <div class="form-group">
                <label>Value *</label>
                <input
                  v-model.number="form.value"
                  type="number"
                  min="0"
                  step="any"
                  class="form-input"
                  :placeholder="form.type === 'PERCENT' ? 'e.g. 10' : 'e.g. 50000'"
                  @blur="validateValue"
                />
                <div v-if="errors.value" class="input-error">{{ errors.value }}</div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Starts At *</label>
                <input v-model="form.startsAt" type="datetime-local" class="form-input" @blur="validateDates" />
                <div v-if="errors.startsAt" class="input-error">{{ errors.startsAt }}</div>
              </div>
              <div class="form-group">
                <label>Ends At *</label>
                <input v-model="form.endsAt" type="datetime-local" class="form-input" @blur="validateDates" />
                <div v-if="errors.endsAt" class="input-error">{{ errors.endsAt }}</div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Min. Order Amount (Rp)</label>
                <input v-model.number="form.minOrderAmount" type="number" min="0" class="form-input" placeholder="e.g. 100000" />
              </div>
              <div class="form-group">
                <label>Max Discount (Rp)</label>
                <input v-model.number="form.maxDiscount" type="number" min="0" class="form-input" placeholder="e.g. 50000" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Global Limit</label>
                <input v-model.number="form.globalLimit" type="number" min="1" class="form-input" placeholder="e.g. 100" />
              </div>
              <div class="form-group">
                <label>User Limit</label>
                <input v-model.number="form.userLimit" type="number" min="1" class="form-input" placeholder="e.g. 1" />
              </div>
            </div>

            <div class="form-group form-switch">
              <input v-model="form.isActive" type="checkbox" id="isActive" />
              <label for="isActive">Active</label>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="closeModal">Cancel</button>
            <button
              class="btn-primary"
              @click="savePromo"
              :disabled="loading"
            >
              {{ loading ? 'Saving...' : (editingPromo ? 'Update' : 'Create') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Delete Confirmation -->
      <DeleteConfirmationModal
        v-if="deleteTarget"
        target-label="this promo"
        :loading="loading"
        @confirm="performDelete"
        @cancel="deleteTarget = null"
      />
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { usePromoAdmin } from '@/composables/business/usePromo';
import DeleteConfirmationModal from '../components/modals/Delete.vue';

// --- STATE ---
const { promos, loading, error, fetchPromos, create, update, remove } = usePromoAdmin();

const showModal = ref(false);
const deleteTarget = ref<string | null>(null);
const editingPromo = ref(false);
const copiedCodes = ref<Record<string, boolean>>({});

const form = reactive({
  code: '',
  type: 'PERCENT' as 'PERCENT' | 'FIXED',
  value: 0,
  startsAt: '',
  endsAt: '',
  minOrderAmount: null as number | null,
  maxDiscount: null as number | null,
  globalLimit: null as number | null,
  userLimit: null as number | null,
  isActive: true,
});

const errors = reactive({
  code: '',
  value: '',
  startsAt: '',
  endsAt: '',
});

const notification = ref({
  visible: false,
  message: '',
  type: 'success' as 'success' | 'error',
});

// --- LIFECYCLE ---
onMounted(() => {
  fetchPromos();
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  form.startsAt = now.toISOString().slice(0, 16);
  form.endsAt = nextWeek.toISOString().slice(0, 16);
});

// --- UTILS ---
const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
  notification.value = { visible: true, message, type };
  setTimeout(() => (notification.value.visible = false), 3000);
};

const formatPrice = (value: number) => new Intl.NumberFormat('id-ID').format(value);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const formatDateRange = (start: string, end: string) => {
  if (!start || !end) return '—';
  return `${formatDate(start)} – ${formatDate(end)}`;
};

const formatDiscount = (promo: any) => {
  if (promo.type === 'PERCENT') {
    return `${promo.value}%`;
  }
  return `Rp ${formatPrice(promo.value)}`;
};

const isExpired = (promo: any) => {
  return new Date() > new Date(promo.endsAt);
};

const copyCode = async (code: string) => {
  try {
    await navigator.clipboard.writeText(code);
    copiedCodes.value[code] = true;
    showNotification(`Copied: ${code}`, 'success');
    setTimeout(() => {
      copiedCodes.value[code] = false;
    }, 2000);
  } catch (err) {
    showNotification('Failed to copy code', 'error');
  }
};

// --- VALIDATION ---
const validateCode = () => {
  errors.code = '';
  if (!form.code.trim()) {
    errors.code = 'Promo code is required';
  } else if (!/^[A-Z0-9_]+$/.test(form.code)) {
    errors.code = 'Use uppercase letters, numbers, or underscores only';
  }
};

const validateValue = () => {
  errors.value = '';
  if (form.value <= 0) {
    errors.value = 'Value must be greater than 0';
  }
  if (form.type === 'PERCENT' && form.value > 100) {
    errors.value = 'Percentage cannot exceed 100%';
  }
};

const validateDates = () => {
  errors.startsAt = '';
  errors.endsAt = '';
  if (!form.startsAt) errors.startsAt = 'Start date is required';
  if (!form.endsAt) errors.endsAt = 'End date is required';
  if (form.startsAt && form.endsAt && new Date(form.startsAt) >= new Date(form.endsAt)) {
    errors.endsAt = 'End date must be after start date';
  }
};

const validateForm = () => {
  validateCode();
  validateValue();
  validateDates();
  return !errors.code && !errors.value && !errors.startsAt && !errors.endsAt;
};

// --- ACTIONS ---
const resetForm = () => {
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  form.code = '';
  form.type = 'PERCENT';
  form.value = 0;
  form.startsAt = now.toISOString().slice(0, 16);
  form.endsAt = nextWeek.toISOString().slice(0, 16);
  form.minOrderAmount = null;
  form.maxDiscount = null;
  form.globalLimit = null;
  form.userLimit = null;
  form.isActive = true;
  Object.keys(errors).forEach(key => (errors[key as keyof typeof errors] = ''));
};

const openCreateModal = () => {
  editingPromo.value = false;
  resetForm();
  showModal.value = true;
};

const editPromo = (promo: any) => {
  editingPromo.value = true;
  form.code = promo.code;
  form.type = promo.type;
  form.value = promo.value;
  form.startsAt = promo.startsAt ? new Date(promo.startsAt).toISOString().slice(0, 16) : '';
  form.endsAt = promo.endsAt ? new Date(promo.endsAt).toISOString().slice(0, 16) : '';
  form.minOrderAmount = promo.minOrderAmount || null;
  form.maxDiscount = promo.maxDiscount || null;
  form.globalLimit = promo.globalLimit || null;
  form.userLimit = promo.userLimit || null;
  form.isActive = promo.isActive;
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

const savePromo = async () => {
  if (!validateForm()) return;

  const payload: Record<string, any> = {
    code: form.code,
    type: form.type,
    value: form.value,
    startsAt: form.startsAt,
    endsAt: form.endsAt,
    isActive: form.isActive,
  };

  if (form.minOrderAmount != null) payload.minOrderAmount = form.minOrderAmount;
  if (form.maxDiscount != null) payload.maxDiscount = form.maxDiscount;
  if (form.globalLimit != null) payload.globalLimit = form.globalLimit;
  if (form.userLimit != null) payload.userLimit = form.userLimit;

  try {
    if (editingPromo.value) {
      await update(form.code, payload);
      showNotification('Promo updated successfully!');
    } else {
      await create(payload);
      showNotification('Promo created successfully!');
    }
    fetchPromos();
    closeModal();
  } catch (err) {
    showNotification('Failed to save promo. Please check your input.', 'error');
  }
};

const confirmDelete = (id: string) => {
  deleteTarget.value = id;
};

const performDelete = async () => {
  if (deleteTarget.value) {
    await remove(deleteTarget.value);
    showNotification('Promo deleted successfully!');
    deleteTarget.value = null;
  }
};
</script>

<style scoped>
/* === FOUNDATION === */
.promo-management {
  padding: 24px 32px;
  background: #F7F5FF;
  min-height: 100vh;
  position: relative;
}

/* === NOTIFICATION === */
.notification {
  position: fixed;
  top: 24px;
  right: 32px;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
  z-index: 9000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease-out;
}
.notification.success {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
}
.notification.error {
  background: #fee2e2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}
@keyframes slideIn {
  from { transform: translateX(120%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

/* === TOP BAR === */
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0ecff;
}
.top-left h1 {
  font-size: 26px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}
.page-subtitle {
  color: #6b7280;
  margin: 4px 0 0;
  font-size: 14px;
  font-weight: 500;
}

/* === BUTTONS === */
.btn-primary {
  padding: 10px 20px;
  background: linear-gradient(135deg, #7E57C2, #6A5BEF);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 6px rgba(126, 87, 194, 0.2);
}
.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(126, 87, 194, 0.3);
}
.btn-secondary {
  padding: 10px 20px;
  background: #f5f3ff;
  color: #6A5BEF;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
}
.btn-secondary:hover {
  background: #ede9ff;
}

/* === PROMO LIST === */
.promo-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  text-align: center;
  color: #6b7280;
}
.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f0ecff;
  border-top: 3px solid #7E57C2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}
.empty-state h3 {
  margin: 12px 0 8px;
  color: #1e293b;
}

/* === PROMO GRID === */
.promo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 24px;
}

/* === PROMO CARD === */
.promo-card {
  background: white;
  border-radius: 20px;
  padding: 28px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.05);
  border: 1px solid #f0ecff;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}
.promo-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08);
}
.promo-card.promo-inactive {
  opacity: 0.85;
}
.promo-card.promo-expired {
  background: #fcfbff;
  border-color: #ede9ff;
}

/* === Promo Code Header === */
.promo-code-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.promo-code-box {
  flex: 1;
  background: #f5f3ff;
  border: 1px dashed #d1c4e9;
  border-radius: 12px;
  padding: 12px 16px;
  text-align: center;
}
.promo-code-text {
  font-family: 'SF Mono', 'Monaco', monospace;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 1px;
  color: #4c1d95;
}
.btn-copy {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: white;
  border: 1px solid #e2dfff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}
.btn-copy:hover {
  background: #f5f3ff;
  border-color: #c7b8ea;
}

/* === Status Badge === */
.promo-status-badge {
  position: absolute;
  top: 16px;
  right: 16px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.status-active {
  background: #dbeafe;
  color: #1d4ed8;
}
.status-inactive {
  background: #f3e8ff;
  color: #7e22ce;
}
.status-expired {
  background: #fee2e2;
  color: #dc2626;
}

/* === Discount Display === */
.promo-content {
  margin: 16px 0 24px;
}
.discount-display {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  margin-bottom: 20px;
}
.discount-value {
  font-size: 32px;
  font-weight: 800;
  color: #4c1d95;
  line-height: 1;
}
.discount-label {
  font-size: 16px;
  color: #6b7280;
  margin-bottom: 4px;
}

/* === Details === */
.promo-details {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.detail-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 14px;
  color: #475569;
}
.detail-item svg {
  flex-shrink: 0;
  margin-top: 2px;
}

/* === Actions === */
.promo-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}
.btn-action {
  flex: 1;
  padding: 10px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  border: none;
  transition: background 0.2s;
}
.btn-action {
  background: #f5f3ff;
  color: #6A5BEF;
}
.btn-action:hover {
  background: #ede9ff;
}
.btn-delete {
  background: #fee2e2;
  color: #dc2626;
}
.btn-delete:hover {
  background: #fecaca;
}

/* === MODAL === */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 8000;
}
.modal-card {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 520px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  border-bottom: 1px solid #f0ecff;
}
.modal-header h3 {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}
.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #a7a4c0;
  border-radius: 10px;
}
.modal-close:hover {
  background: #f5f3ff;
  color: #7E57C2;
}
.modal-body {
  padding: 32px;
}
.form-group {
  margin-bottom: 20px;
}
.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #475569;
  font-size: 14px;
}
.form-input,
.form-select {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e2dfff;
  border-radius: 12px;
  font-size: 15px;
  background: #faf9ff;
  transition: border-color 0.2s;
}
.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #7E57C2;
  box-shadow: 0 0 0 3px rgba(126, 87, 194, 0.1);
}
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.input-error {
  color: #ef4444;
  font-size: 13px;
  margin-top: 6px;
  font-weight: 500;
}
.form-switch {
  display: flex;
  align-items: center;
  gap: 12px;
}
.form-switch input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 24px 32px;
  border-top: 1px solid #f0ecff;
}
</style>