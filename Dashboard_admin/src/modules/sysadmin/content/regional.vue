<template>
  <div class="page-wrapper">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="title">Manage Regions</h1>
        <p class="subtitle">Manage regional settings and codes for your infrastructure</p>
      </div>

      <!-- Right-side controls -->
      <div class="header-right">
        <div class="search-wrapper">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="7" cy="7" r="5.5"/><path d="m11 11 2 2"/>
          </svg>
          <input
            v-model="search"
            class="search-input"
            type="text"
            placeholder="Search region name or code..."
            aria-label="Search regions"
          />
        </div>

        <button class="add-btn" @click="openModal()">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M8 4v8M4 8h8"/>
          </svg>
          <span class="add-text">Add</span>
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="card">
      <div class="table-wrap">
        <table class="modern-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Code</th>
              <th class="th-actions">Actions</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="(region, i) in filteredRegions" :key="region.id">
              <td class="muted">{{ i + 1 }}</td>
              <td>{{ region.name || '—' }}</td>
              <td class="mono">{{ region.code || '—' }}</td>
              <td class="actions-cell">
                <div class="action-group">
                  <button class="action-btn" @click="editRegion(region)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                      <path d="M12.5 2.5a1 1 0 0 1 3 3L6.5 14.5l-4 1 1-4L12.5 2.5z"/>
                    </svg>
                  </button>
                  <button class="action-btn danger" @click="deleteRegionById(region.id)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                      <path d="M4 5h8M10 5v9H6V5M5 5V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="filteredRegions.length === 0">
              <td colspan="4" class="empty-row">
                <div class="empty-content">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M22 12h-2.47a8 8 0 0 0-15.06 0H2"/>
                    <path d="M13 19a2 2 0 0 1-2-2v-3a2 2 0 0 1 4 0v3a2 2 0 0 1-2 2z"/>
                  </svg>
                  <div>No regions found</div>
                  <small>Try changing search or filters</small>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal -->
    <teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-card">
          <header class="modal-header">
            <h3>{{ form.id ? 'Edit Region' : 'Add Region' }}</h3>
            <button class="modal-close" @click="closeModal">×</button>
          </header>

          <form class="modal-body" @submit.prevent="onSubmit">
            <div class="form-grid">
              <div class="form-group">
                <label>Name</label>
                <input v-model="form.name" type="text" class="form-input" placeholder="Region Name" required />
              </div>
              <div class="form-group">
                <label>Code</label>
                <input v-model="form.code" type="text" class="form-input" placeholder="Region Code" required />
              </div>
            </div>

            <footer class="modal-footer">
              <button type="button" class="btn-secondary" @click="closeModal">Cancel</button>
              <button type="submit" class="btn-primary">{{ form.id ? 'Update' : 'Create' }}</button>
            </footer>
          </form>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue';
import { useRegion } from '@/composables/sysadmin/regional';
import type { Region } from '@/api/sysadmin/regional';

const { regions, fetchRegions, createRegion, updateRegion, deleteRegion } = useRegion();
const showModal = ref(false);
const form = reactive<Partial<Region>>({ id: '', name: '', code: '' });
const search = ref('');

const filteredRegions = computed(() =>
  regions.value.filter(r => r.name.toLowerCase().includes(search.value.toLowerCase()) || r.code.toLowerCase().includes(search.value.toLowerCase()))
);

const openModal = (region?: Region) => {
  if (region) {
    form.id = region.id;
    form.name = region.name;
    form.code = region.code;
  } else {
    resetForm();
  }
  showModal.value = true;
};

const closeModal = () => (showModal.value = false);

const onSubmit = async () => {
  if (!form.name || !form.code) return;
  if (form.id) {
    await updateRegion(form.id, { name: form.name, code: form.code });
  } else {
    await createRegion({ name: form.name, code: form.code });
  }
  fetchRegions();
  closeModal();
};

const editRegion = (region: Region) => openModal(region);

const deleteRegionById = async (id: string) => {
  if (confirm('Are you sure to delete this region?')) {
    await deleteRegion(id);
    fetchRegions();
  }
};

const resetForm = () => {
  form.id = '';
  form.name = '';
  form.code = '';
};

onMounted(() => fetchRegions());
</script>

<style lang="css">
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
  margin-bottom: 24px;
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

/* SEARCH */
.search-wrapper {
  position: relative;
  min-width: 220px;
}

.search-wrapper svg {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 10px 12px 10px 36px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #8A7CF0;
  box-shadow: 0 0 0 3px rgba(138, 124, 240, 0.15);
}

/* ADD BUTTON */
.add-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: linear-gradient(135deg, #6A5BEF, #5D4AE5);
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
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
  min-width: 600px;
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

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
}

/* ACTIONS */
.th-actions,
.actions-cell {
  text-align: right;
}

.actions-cell {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.action-group {
  display: flex;
  gap: 8px;
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
  font-size: 12px;
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

.empty-row svg {
  margin-bottom: 12px;
  opacity: 0.6;
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
  max-width: 480px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
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

/* MODAL ACTIONS */
.modal-footer {
  display: flex;
  justify-content: flex-end;
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

/* RESPONSIVE */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }
  .header-right {
    width: 100%;
  }
  .search-wrapper {
    min-width: auto;
  }
}

</style>