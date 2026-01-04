<template>
  <div class="page-wrapper">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="title">Backup Storage</h1>
        <p class="subtitle">Manage primary and secondary backup destinations</p>
      </div>
      <div class="header-right">
        <select class="filter-select" v-model="filterProvider">
          <option value="">All Providers</option>
          <option value="S3">Amazon S3</option>
          <option value="AZURE">Azure Blob</option>
          <option value="NFS">NFS</option>
        </select>
        <button class="add-btn" @click="openModal()">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M8 4v8M4 8h8"/>
          </svg>
          <span class="add-text">Add Storage</span>
        </button>
      </div>
    </div>

    <!-- Error -->
    <div v-if="error" class="error-message">{{ error }}</div>

    <!-- Storage List -->
    <div class="card">
      <div class="table-wrap">
        <table class="modern-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Provider</th>
              <th>Status</th>
              <th>Capacity</th>
              <th>Type</th>
              <th>Created</th>
              <th class="th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="storage in filteredStorages" :key="storage.id">
              <td class="name-cell">{{ storage.name }}</td>
              <td>
                <span class="chip" :class="`chip-${storage.provider.toLowerCase()}`">
                  {{ storage.provider }}
                </span>
              </td>
              <td>
                <span class="chip" :class="getStatusClass(storage.status)">
                  {{ storage.status || 'UNKNOWN' }}
                </span>
              </td>
              <td class="muted">
                {{ formatCapacity(storage.usedSpace, storage.totalSpace) }}
              </td>
              <td>
                <span v-if="storage.isDefault" class="chip chip-primary">Primary</span>
                <span v-else class="chip chip-secondary">Secondary</span>
              </td>
              <td class="muted">{{ formatDate(storage.createdAt) }}</td>
              <td class="actions-cell">
                <!-- Gunakan ikon seperti di IP Management -->
                <button class="action-btn" @click="handleValidate(storage.id)" title="Validate">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M12 5l-8 8-4-4 1.5-1.5L8 12.5 14.5 6z"/>
                  </svg>
                </button>
                <button class="action-btn" @click="openModal(storage)" title="Edit">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M12.5 2.5a1 1 0 0 1 3 3L6.5 14.5l-4 1 1-4L12.5 2.5z"/>
                  </svg>
                </button>
                <button
                  v-if="storage.status !== 'ACTIVE'"
                  class="action-btn success"
                  @click="handleEnable(storage.id)"
                  title="Enable"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M4 8a4 4 0 1 1 8 0 4 4 0 0 1-8 0z"/>
                    <path d="M8 5V6.5M8 11V9M5 8H6.5M11 8H9.5"/>
                  </svg>
                </button>
                <button
                  v-else
                  class="action-btn danger"
                  @click="handleDisable(storage.id)"
                  title="Disable"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12z"/>
                    <path d="M12 12l-8-8"/>
                    <path d="M12 4l-8 8"/>
                  </svg>
                </button>
                <button
                  v-if="!storage.isDefault"
                  class="action-btn primary"
                  @click="handleSetDefault(storage.id)"
                  title="Make Primary"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M7 6h2M7 10h2M4 8h8M3 12l2-8 4 8 4-8 2 8"/>
                  </svg>
                </button>
                <button class="action-btn danger" @click="openDeleteModal(storage)" title="Delete">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M4 5h8M10 5v9H6V5M5 5V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                  </svg>
                </button>
              </td>
            </tr>
            <tr v-if="filteredStorages.length === 0">
              <td colspan="7" class="empty-row">
                <div class="empty-content">
                  <div>📭 No backup storages configured</div>
                  <small>Click <strong>Add Storage</strong> to set up your first destination.</small>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-card">
          <header class="modal-header">
            <h3>{{ editingStorage ? 'Edit Storage' : 'Add New Storage' }}</h3>
            <button class="modal-close" @click="closeModal">×</button>
          </header>
          <form @submit.prevent="submitForm" class="modal-body">
            <div class="form-group">
              <label>Provider</label>
              <select v-model="form.provider" class="form-input" @change="onProviderChange">
                <option value="S3">Amazon S3</option>
                <option value="AZURE">Azure Blob</option>
                <option value="NFS">NFS</option>
              </select>
            </div>

            <div class="form-grid">
              <div
                v-for="field in visibleFields(form.provider as any)"
                :key="field"
                class="form-group"
              >
                <label>{{ formattedLabel(field) }}</label>
                <input
                  v-if="field === 'totalSpace'"
                  v-model.number="form.totalSpace"
                  type="number"
                  min="0"
                  class="form-input"
                  :placeholder="formattedLabel(field)"
                />
                <input
                  v-else
                  v-model="form[field as keyof typeof form]"
                  :type="field === 'secretKey' ? 'password' : 'text'"
                  class="form-input"
                  :placeholder="formattedLabel(field)"
                />
              </div>
            </div>

            <footer class="modal-footer">
              <button type="button" class="btn-secondary" @click="closeModal">Cancel</button>
              <button type="submit" class="btn-primary">
                {{ editingStorage ? 'Update' : 'Create' }}
              </button>
            </footer>
          </form>
        </div>
      </div>
    </teleport>

    <!-- Delete Confirmation -->
    <teleport to="body">
      <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDeleteModal">
        <div class="modal-card modal-small">
          <div class="modal-header">
            <h3>Delete Backup Storage</h3>
            <button class="modal-close" @click="closeDeleteModal">×</button>
          </div>
          <div class="modal-body">
            <p class="confirm-text">
              This will permanently delete <strong>{{ deleteStorage?.name }}</strong>.
              All backup data will be lost.
            </p>
            <div class="delete-instruction">delete</div>
            <input
              v-model="deleteConfirmation"
              type="text"
              class="form-input delete-input"
              placeholder="Type 'delete'"
            />
            <div v-if="deleteConfirmation && deleteConfirmation !== 'delete'" class="delete-error">
              You must type exactly: <code>delete</code>
            </div>
            <div class="modal-actions">
              <button class="btn-secondary" @click="closeDeleteModal">Cancel</button>
              <button
                class="btn-danger"
                :disabled="deleteConfirmation !== 'delete'"
                @click="confirmDelete"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  useBackupStorages,
  type BackupStorage,
  type BackupStorageStatus
} from '@/composables/sysadmin/useBackupStorage';

const {
  storages,
  error,
  fetchBackupStorages,
  createBackupStorage,
  updateBackupStorage,
  deleteBackupStorage,
  setDefaultBackupStorage,
  enableStorage,
  disableStorage,
  validateStorage,
  visibleFields,
  formattedLabel
} = useBackupStorages();

onMounted(() => {
  fetchBackupStorages().catch((e) => console.error('fetchBackupStorages error', e));
});

const filterProvider = ref<string>('');
const showModal = ref(false);
const showDeleteModal = ref(false);
const editingStorage = ref<BackupStorage | null>(null);
const deleteStorage = ref<BackupStorage | null>(null);
const deleteConfirmation = ref('');

const form = ref<Partial<BackupStorage>>({
  provider: 'S3',
  name: '',
  totalSpace: undefined
});

const filteredStorages = computed(() => {
  return storages.value.filter(s => {
    if (!filterProvider.value) return true;
    return s.provider === filterProvider.value;
  });
});

const formatDate = (dateStr: string): string => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const formatCapacity = (used: number | null | undefined, total: number | null | undefined): string => {
  if (used == null || total == null) return '—';
  return `${used} GB / ${total} GB`;
};

const getStatusClass = (status: BackupStorageStatus | undefined) => {
  if (status === 'ACTIVE') return 'chip-available';
  if (status === 'INACTIVE') return 'chip-used';
  if (status === 'ERROR') return 'chip-reserved';
  return 'chip';
};

const resetForm = () => {
  form.value = { provider: form.value.provider ?? 'S3', name: '', totalSpace: undefined };
};

const onProviderChange = () => {
  const provider = form.value.provider as BackupStorage['provider'];
  form.value = {
    ...form.value,
    provider,
    endpoint: undefined,
    bucket: undefined,
    directory: undefined,
    accessKey: undefined,
    secretKey: undefined,
    region: undefined,
    totalSpace: undefined
  };
};

const openModal = (storage?: BackupStorage) => {
  if (storage) {
    editingStorage.value = storage;
    form.value = {
      id: storage.id,
      provider: storage.provider,
      name: storage.name,
      endpoint: storage.endpoint,
      bucket: storage.bucket,
      directory: storage.directory,
      accessKey: storage.accessKey,
      secretKey: storage.secretKey,
      region: storage.region,
      totalSpace: storage.totalSpace ?? undefined,
      isDefault: storage.isDefault
    };
  } else {
    editingStorage.value = null;
    resetForm();
  }
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingStorage.value = null;
  resetForm();
};

const submitForm = async () => {
  try {
    const payload: any = {};
    for (const key in form.value) {
      const v = (form.value as any)[key];
      if (v !== undefined) payload[key] = v;
    }

    if ('totalSpace' in payload) {
      payload.totalSpace = payload.totalSpace === null || payload.totalSpace === '' ? null : Number(payload.totalSpace);
      if (Number.isNaN(payload.totalSpace)) payload.totalSpace = null;
    }

    if (editingStorage.value?.id) {
      await updateBackupStorage(editingStorage.value.id, payload);
    } else {
      await createBackupStorage(payload);
    }
    await fetchBackupStorages();
    closeModal();
  } catch (err: any) {
    console.error('submitForm error', err);
  }
};

const openDeleteModal = (storage: BackupStorage) => {
  deleteStorage.value = storage;
  deleteConfirmation.value = '';
  showDeleteModal.value = true;
};

const closeDeleteModal = () => {
  showDeleteModal.value = false;
  deleteStorage.value = null;
  deleteConfirmation.value = '';
};

const confirmDelete = async () => {
  if (deleteConfirmation.value !== 'delete' || !deleteStorage.value?.id) return;
  try {
    await deleteBackupStorage(deleteStorage.value.id);
    await fetchBackupStorages();
    closeDeleteModal();
  } catch (err: any) {
    console.error('confirmDelete error', err);
  }
};

const handleValidate = async (id: string) => {
  try {
    await validateStorage(id);
    await fetchBackupStorages();
  } catch (err: any) {
    console.error('handleValidate error', err);
  }
};

const handleEnable = async (id: string) => {
  try {
    await enableStorage(id);
    await fetchBackupStorages();
  } catch (err: any) {
    console.error('handleEnable error', err);
  }
};

const handleDisable = async (id: string) => {
  try {
    await disableStorage(id);
    await fetchBackupStorages();
  } catch (err: any) {
    console.error('handleDisable error', err);
  }
};

const handleSetDefault = async (id: string) => {
  try {
    await setDefaultBackupStorage(id);
    await fetchBackupStorages();
  } catch (err: any) {
    console.error('handleSetDefault error', err);
  }
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

/* FILTER & BUTTONS */
.filter-select {
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  font-size: 14px;
  background: white;
  min-width: 140px;
  color: #1f2937;
}

.filter-select:focus {
  outline: none;
  border-color: #8A7CF0;
}

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
.error-message {
  text-align: center;
  padding: 24px;
  font-size: 16px;
  color: #ef4444;
  background: #fef2f2;
  border-radius: 10px;
  margin-bottom: 16px;
  border-left: 4px solid #ef4444;
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

.chip-s3 { background: #e0f2fe; color: #0891b2; }
.chip-azure { background: #e0f2fe; color: #0891b2; }
.chip-nfs { background: #f1f8e9; color: #689f38; }
.chip-primary { background: #ede9fe; color: #7c3aed; }
.chip-secondary { background: #fff3e0; color: #e65100; }

/* Reuse status chips from IP management */
.chip-available { background: #e8f5e9; color: #2e7d32; }  /* ACTIVE */
.chip-used { background: #fff3e0; color: #e65100; }      /* INACTIVE */
.chip-reserved { background: #fecaca; color: #b91c1c; }  /* ERROR */

/* ACTIONS */
.th-actions,
.actions-cell {
  text-align: right;
  min-width: 180px;
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

.action-btn.success:hover {
  color: #16a34a;
  border-color: #16a34a;
}

.action-btn.danger:hover {
  color: #ef4444;
  border-color: #ef4444;
}

.action-btn.primary:hover {
  color: #7c3aed;
  border-color: #7c3aed;
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

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

@media (min-width: 600px) {
  .form-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
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

/* DELETE MODAL */
.confirm-text {
  margin-bottom: 12px;
  color: #111827;
  font-size: 14px;
  line-height: 1.5;
}

.delete-instruction {
  text-align: center;
  font-family: monospace;
  font-size: 18px;
  font-weight: bold;
  color: #ef4444;
  margin: 12px 0;
  letter-spacing: 1px;
}

.delete-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-family: monospace;
}

.delete-input:focus {
  outline: none;
  border-color: #8A7CF0;
  box-shadow: 0 0 0 3px rgba(138, 124, 240, 0.15);
}

.delete-error {
  color: #ef4444;
  font-size: 13px;
  margin: 8px 0;
  min-height: 18px;
}

.modal-actions {
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
  .filter-select {
    flex: 1;
    min-width: 120px;
  }
}
</style>