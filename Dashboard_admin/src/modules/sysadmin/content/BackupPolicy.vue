<template>
  <div class="page-wrapper">
    <div class="page-header">
      <div class="header-left">
        <h1 class="title">Backup Policies</h1>
        <p class="subtitle">Manage automated backup schedules and retention rules</p>
      </div>
      <div class="header-right">
        <button class="add-btn" @click="openCreateModal">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M8 4v8M4 8h8"/>
          </svg>
          <span class="add-text">Add Policy</span>
        </button>
      </div>
    </div>

    <!-- Messages -->
    <div v-if="loading" class="loading-message">Loading policies...</div>
    <div v-else-if="error" class="error-message">{{ error }}</div>

    <!-- Table or Empty -->
    <div v-else class="card">
      <div class="table-wrap">
        <table class="modern-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Frequency</th>
              <th>Time</th>
              <th>Retention</th>
              <th>Max Storage</th>
              <th>Daily Limit</th>
              <th>System</th>
              <th class="th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="policy in policies" :key="policy.id">
              <td class="name-cell">{{ policy.name }}</td>
              <td>{{ parseCronToLabel(policy.cron) }}</td>
              <td class="muted">{{ formatCronTime(policy.cron) }}</td>
              <td>{{ policy.retentionDays }} days</td>
              <td>{{ policy.maxStorageGB }} GB</td>
              <td>{{ policy.maxDailyBackup }}</td>
              <td>
                <span class="chip" :class="{ 'chip-primary': policy.isSystem, 'chip-used': !policy.isSystem }">
                  {{ policy.isSystem ? 'Yes' : 'No' }}
                </span>
              </td>
              <td class="actions-cell">
                <button class="action-btn" @click="openEditModal(policy)" title="Edit">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M12.5 2.5a1 1 0 0 1 3 3L6.5 14.5l-4 1 1-4L12.5 2.5z"/>
                  </svg>
                </button>
                <button class="action-btn danger" @click="confirmDelete(policy.id)" title="Delete">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M4 5h8M10 5v9H6V5M5 5V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                  </svg>
                </button>
              </td>
            </tr>
            <tr v-if="policies.length === 0">
              <td colspan="8" class="empty-row">
                <div class="empty-content">
                  <div>No backup policies found</div>
                  <small>Create your first policy to automate backups</small>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-card">
          <header class="modal-header">
            <h3>{{ editingPolicy ? 'Edit Policy' : 'Create Policy' }}</h3>
            <button class="modal-close" @click="closeModal">×</button>
          </header>
          <form class="modal-body" @submit.prevent="savePolicy">
            <div class="form-group">
              <label>Name *</label>
              <input v-model="form.name" type="text" class="form-input" required />
            </div>

            <div class="form-group">
              <label>Frequency *</label>
              <select v-model="cronOption.type" class="form-input">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div class="form-group">
              <label>Run at</label>
              <div class="time-inputs">
                <input v-model.number="cronOption.hour" type="number" min="0" max="23" class="time-input" />
                <span>:</span>
                <input v-model.number="cronOption.minute" type="number" min="0" max="59" class="time-input" />
              </div>
              <small class="form-hint">Time in 24-hour format</small>
            </div>

            <div v-if="cronOption.type === 'weekly'" class="form-group">
              <label>Day of Week</label>
              <select v-model.number="cronOption.dayOfWeek" class="form-input">
                <option :value="0">Sunday</option>
                <option :value="1">Monday</option>
                <option :value="2">Tuesday</option>
                <option :value="3">Wednesday</option>
                <option :value="4">Thursday</option>
                <option :value="5">Friday</option>
                <option :value="6">Saturday</option>
              </select>
            </div>

            <div v-if="cronOption.type === 'monthly'" class="form-group">
              <label>Day of Month</label>
              <input v-model.number="cronOption.dayOfMonth" type="number" min="1" max="31" class="form-input" />
            </div>

            <div class="form-group">
              <label>Retention Days *</label>
              <input v-model.number="form.retentionDays" type="number" min="1" class="form-input" required />
            </div>
            <div class="form-group">
              <label>Max Storage (GB) *</label>
              <input v-model.number="form.maxStorageGB" type="number" min="1" class="form-input" required />
            </div>
            <div class="form-group">
              <label>Max Daily Backups *</label>
              <input v-model.number="form.maxDailyBackup" type="number" min="1" class="form-input" required />
            </div>
            <div class="form-group">
              <!-- <label class="checkbox-label">
                <input v-model="form.isSystem" type="checkbox" />
                System Policy
              </label> -->
            </div>

            <footer class="modal-footer">
              <button type="button" class="btn-secondary" @click="closeModal">Cancel</button>
              <button type="submit" class="btn-primary">Save</button>
            </footer>
          </form>
        </div>
      </div>
    </teleport>

    <!-- Delete Confirmation -->
    <teleport to="body">
      <div v-if="deleteConfirmId" class="modal-overlay" @click.self="cancelDelete">
        <div class="modal-card modal-small">
          <div class="modal-header">
            <h3>Confirm Delete</h3>
            <button class="modal-close" @click="cancelDelete">×</button>
          </div>
          <div class="modal-body">
            <p class="confirm-text">
              Are you sure you want to delete this backup policy?
            </p>
            <div class="modal-actions">
              <button class="btn-secondary" @click="cancelDelete">Cancel</button>
              <button class="btn-danger" @click="performDelete">Delete</button>
            </div>
          </div>
        </div>
      </div>
    </teleport>

    <!-- Run Confirmation -->

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import {
  useBackupPolicy,
  generateCron,
} from '@/composables/sysadmin/useBackupPolicy';

// =======================
// Types
// =======================
type CronType = 'daily' | 'weekly' | 'monthly';
interface CronOption {
  type: CronType;
  hour: number;
  minute: number;
  dayOfWeek?: number;
  dayOfMonth?: number;
}

interface BackupPolicy {
  id: string;
  name: string;
  retentionDays: number;
  maxStorageGB: number;
  maxDailyBackup: number;
  isSystem: boolean;
  cron?: string | null;
}

// =======================
// Composable
// =======================
const {
  policies,
  loading,
  error,
  fetchPolicies,
  createPolicy,
  updatePolicy,
  deletePolicy,
  
} = useBackupPolicy();

onMounted(() => {
  fetchPolicies();
});

// =======================
// Reactive State
// =======================
const showModal = ref(false);
const editingPolicy = ref<BackupPolicy | null>(null);
const deleteConfirmId = ref<string | null>(null);

const form = reactive({
  name: '',
  retentionDays: 7,
  maxStorageGB: 10,
  maxDailyBackup: 1,
  isSystem: false,
});

const cronOption = reactive<CronOption>({
  type: 'daily',
  hour: 2,
  minute: 0,
});

// =======================
// Modal Handlers
// =======================
const openCreateModal = () => {
  editingPolicy.value = null;
  Object.assign(form, {
    name: '',
    retentionDays: 7,
    maxStorageGB: 10,
    maxDailyBackup: 1,
    isSystem: false,
  });
  Object.assign(cronOption, {
    type: 'daily',
    hour: 2,
    minute: 0,
    dayOfWeek: undefined,
    dayOfMonth: undefined,
  });
  showModal.value = true;
};

const openEditModal = (policy: BackupPolicy) => {
  editingPolicy.value = policy;
  Object.assign(form, {
    name: policy.name,
    retentionDays: policy.retentionDays,
    maxStorageGB: policy.maxStorageGB,
    maxDailyBackup: policy.maxDailyBackup,
    isSystem: policy.isSystem,
  });
parseCronToOption(policy.cron ?? null);
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingPolicy.value = null;
};

// =======================
// Cron Parsing
// =======================
const parseCronToOption = (cron: string | null) => {
  cronOption.dayOfWeek = undefined;
  cronOption.dayOfMonth = undefined;

  if (!cron) {
    cronOption.type = 'daily';
    cronOption.hour = 2;
    cronOption.minute = 0;
    return;
  }

  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) {
    cronOption.type = 'daily';
    cronOption.hour = 2;
    cronOption.minute = 0;
    return;
  }

  const [minute = '0', hour = '2', dom = '*', , dow = '*'] = parts;
  cronOption.minute = parseInt(minute, 10) || 0;
  cronOption.hour = parseInt(hour, 10) || 2;

  if (dom === '*' && dow === '*') {
    cronOption.type = 'daily';
  } else if (dom === '*' && dow !== '*') {
    cronOption.type = 'weekly';
    cronOption.dayOfWeek = parseInt(dow, 10) || 0;
  } else if (dom !== '*' && dow === '*') {
    cronOption.type = 'monthly';
    cronOption.dayOfMonth = parseInt(dom, 10) || 1;
  } else {
    // fallback untuk kombinasi custom
    cronOption.type = 'daily';
  }
};

// =======================
// Save Policy
// =======================
const savePolicy = async () => {
  let cron: string | null = null;
  try {
    cron = generateCron({
      type: cronOption.type,
      hour: cronOption.hour,
      minute: cronOption.minute,
      dayOfWeek: cronOption.dayOfWeek,
      dayOfMonth: cronOption.dayOfMonth,
    });
  } catch (err: any) {
    error.value = err.message || 'Invalid schedule';
    return;
  }

  const payload = { ...form, cron };
  try {
    if (editingPolicy.value) {
      await updatePolicy(editingPolicy.value.id, payload);
    } else {
      await createPolicy(payload);
    }
    await fetchPolicies();
    closeModal();
  } catch (err) {
    // error handled in composable
  }
};

// =======================
// Delete Handlers
// =======================
const confirmDelete = (id: string) => (deleteConfirmId.value = id);
const cancelDelete = () => (deleteConfirmId.value = null);
const performDelete = async () => {
  if (deleteConfirmId.value) {
    await deletePolicy(deleteConfirmId.value);
    await fetchPolicies();
    cancelDelete();
  }
};


// =======================
// Cron Label & Time
// =======================
const parseCronToLabel = (cron: string | null): string => {
  if (!cron) return '—';
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return 'Custom';
  const [, , dom, , dow] = parts;
  if (dom === '*' && dow === '*') return 'Daily';
  if (dom === '*' && dow !== '*') return 'Weekly';
  if (dom !== '*' && dow === '*') return 'Monthly';
  return 'Custom';
};

const formatCronTime = (cron: string | null): string => {
  if (!cron) return '—';

  const parts = cron.trim().split(/\s+/);
  if (parts.length < 2) return '—'; // minimal harus ada menit & jam

  const minute = parts[0] ?? '0';
  const hour = parts[1] ?? '0';

  const m = parseInt(minute, 10);
  const h = parseInt(hour, 10);

  if (isNaN(h) || isNaN(m)) return '—';

  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};
</script>


<style scoped>
/* GLOBAL */
.page-wrapper {
  max-width: 1280px;
  margin: 28px auto;
  padding: 0 18px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #111827;
}

/* HEADER */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #111827;
}

.subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: #6b7280;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

/* BUTTONS */
.add-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: none;
  border-radius: 10px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  color: white;
  background: linear-gradient(135deg, #6A5BEF, #5D4AE5);
}

.add-btn:hover {
  background: linear-gradient(135deg, #5D4AE5, #4F3FD9);
}

.add-text {
  display: none;
}

@media (min-width: 768px) {
  .add-text {
    display: inline;
  }
}

/* MESSAGES */
.loading-message,
.error-message {
  text-align: center;
  padding: 24px;
  font-size: 16px;
}

.error-message {
  color: #ef4444;
}

/* CARD & TABLE */
.card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  overflow: hidden;
}

.table-wrap {
  overflow-x: auto;
}

.modern-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
}

.modern-table thead th {
  text-align: left;
  padding: 16px;
  font-size: 12px;
  font-weight: 600;
  color: #4b5563;
  background: #F7F5FF;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.modern-table tbody td {
  padding: 14px 16px;
  border-bottom: 1px solid #f3f4f6;
  font-size: 14px;
}

.modern-table tbody tr:hover {
  background: #faf9ff;
}

.muted {
  color: #6b7280;
  font-size: 13px;
}

.name-cell {
  font-weight: 600;
  color: #111827;
}

/* CHIP */
.chip {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.chip-primary { background: #ede9fe; color: #7c3aed; }
.chip-used { background: #fff3e0; color: #e65100; }

/* ACTIONS */
.th-actions,
.actions-cell {
  text-align: right;
  min-width: 120px;
}

.actions-cell {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.action-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f9f8ff;
  color: #6A5BEF;
  border-color: #6A5BEF;
}

.action-btn.danger:hover {
  color: #ef4444;
  border-color: #ef4444;
}

/* EMPTY STATE */
.empty-row .empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: #9ca3af;
}

/* MODAL */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5000;
}

.modal-card {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 560px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.modal-small {
  max-width: 420px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #f3f4f6;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.modal-close {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  font-size: 20px;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  color: #111827;
  background: #f3f4f6;
  border-radius: 50%;
}

.modal-body {
  padding: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  font-size: 14px;
}

.form-input:focus {
  outline: none;
  border-color: #8A7CF0;
  box-shadow: 0 0 0 3px rgba(138, 124, 240, 0.15);
}

.time-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.time-input {
  width: 70px;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  font-size: 14px;
  text-align: center;
}

.time-input:focus {
  outline: none;
  border-color: #8A7CF0;
  box-shadow: 0 0 0 3px rgba(138, 124, 240, 0.15);
}

.form-hint {
  font-size: 0.85em;
  color: #888;
  margin-top: 4px;
  display: block;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

/* MODAL ACTIONS */
.modal-actions,
.modal-footer {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 20px;
}

.btn-secondary {
  padding: 10px 20px;
  background: #f3f4f6;
  color: #374151;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-primary {
  padding: 10px 20px;
  background: linear-gradient(135deg, #6A5BEF, #5D4AE5);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #5D4AE5, #4F3FD9);
}

.btn-danger {
  padding: 10px 20px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
}

.btn-danger:hover {
  background: #dc2626;
}

/* RESPONSIVE */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }
  .header-right {
    width: 100%;
    flex-wrap: wrap;
    gap: 12px;
  }
  .modern-table {
    min-width: 850px;
  }
  .actions-cell {
    justify-content: center;
  }
}
</style>