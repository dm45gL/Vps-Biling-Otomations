<template>
  <div class="page-wrapper">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="title">Manage Hypervisors</h1>
        <p class="subtitle">Inventory and connection tools for your hypervisors</p>
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
            placeholder="Search name or host..."
            aria-label="Search hypervisors"
          />
        </div>

        <select class="filter-select" v-model="filterType" aria-label="Filter by type">
          <option value="">All types</option>
          <option value="PROXMOX">PROXMOX</option>
          <option value="VMWARE">VMWARE</option>
        </select>

        <select class="filter-select" v-model="filterStatus" aria-label="Filter by status">
          <option value="">All status</option>
          <option value="ONLINE">ONLINE</option>
          <option value="OFFLINE">OFFLINE</option>
        </select>

        <button class="add-btn" @click="openAddModal">
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
              <th>Type</th>
              <th>Host</th>
              <th>Username</th>
              <th>Region</th>
              <th>Status</th>
              <th>Created</th>
              <th class="th-actions">Actions</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="(hv, i) in paginatedHypervisors" :key="hv.id">
              <td class="muted">{{ (currentPage - 1) * pageSize + i + 1 }}</td>
              <td> {{ hv.name || '—' }}
               <span v-if="hv.isMaster" class="master-badge">MASTER</span>
              </td>

              <td>{{ hv.type || '—' }}</td>
              <td class="mono">{{ hv.host || '—' }}</td>
              <td>{{ hv.username || '—' }}</td>
              <td>{{ regions.find(r => r.id === hv.regionId)?.name || '—' }}</td>

              <td>
                <span
                  class="status-pill"
                  :class="{
                    'pill-online': hv.status === 'ONLINE',
                    'pill-offline': hv.status === 'OFFLINE',
                    'pill-unknown': !hv.status
                  }"
                >
                  {{ hv.status || '—' }}
                </span>
              </td>

              <td class="muted">{{ formatDate(hv.createdAt) }}</td>

              <td class="actions-cell">
                
                <div class="action-group">

                  <!-- Master management -->
                  <!-- Master Switch -->
                  <label
                    v-if="hv.status === 'ONLINE'"
                    class="master-switch"
                  >
                    <input
                      type="checkbox"
                      :checked="hv.isMaster"
                      @click.prevent="toggleMaster(hv)"
                    />
                    <span class="slider"></span>

                    <!-- Validasi & notice -->
                    <div class="master-validation mt-1">
                      <!-- Error merah -->
                      <p
                        v-if="masterActionError && masterActionTargetId === hv.id"
                        class="text-red-600 font-bold text-xs"
                      >
                        {{ masterActionError }}
                      </p>

                      <!-- Notice biru -->
                      <p
                        v-if="masterActionNotice && masterActionTargetId === hv.id"
                        class="text-blue-600 font-medium text-xs"
                      >
                        {{ masterActionNotice }}
                      </p>
                    </div>
                  </label>



                  <button class="action-btn" @click="openEditModal(hv)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                      <path d="M12.5 2.5a1 1 0 0 1 3 3L6.5 14.5l-4 1 1-4L12.5 2.5z"/>
                    </svg>
                  </button>
                  <button class="action-btn danger" @click="openDeleteModal(hv)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                      <path d="M4 5h8M10 5v9H6V5M5 5V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                    </svg>
                  </button>
                  <button
                    class="action-btn test"
                    @click="testConnectionHypervisor(hv)"
                    :disabled="testingId === hv.id"
                  >
                    <span v-if="testingId === hv.id" class="spinner"></span>
                    <span v-else>Test</span>
                  </button>
                </div>

                <div v-if="testResults[hv.id]" class="test-result">
                  <span
                    class="result-badge"
                    :class="testResults[hv.id]?.success ? 'result-success' : 'result-error'"
                  >
                    <svg v-if="testResults[hv.id]?.success" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M4 6l2 2 4-4"/>
                    </svg>
                    <svg v-else xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M3 3l6 6M9 3L3 9"/>
                    </svg>
                    {{ testResults[hv.id]?.message }}
                  </span>
                </div>
              </td>
            </tr>

            <tr v-if="filteredHypervisors.length === 0">
              <td colspan="8" class="empty-row">
                <div class="empty-content">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M22 12h-2.47a8 8 0 0 0-15.06 0H2"/>
                    <path d="M13 19a2 2 0 0 1-2-2v-3a2 2 0 0 1 4 0v3a2 2 0 0 1-2 2z"/>
                  </svg>
                  <div>No hypervisors found</div>
                  <small>Try changing search or filters</small>
                </div>
              </td>
            </tr>
          </tbody>

        </table>
      </div>
    </div>

    <!-- Pagination -->
    <div class="pagination-wrap" v-if="filteredHypervisors.length > pageSize">
      <button
        class="pagination-btn"
        :class="{ disabled: currentPage === 1 }"
        @click="currentPage = Math.max(1, currentPage - 1)"
      >
        Prev
      </button>
      <button
        v-for="p in totalPages"
        :key="p"
        class="pagination-btn"
        :class="{ active: p === currentPage }"
        @click="currentPage = p"
      >
        {{ p }}
      </button>
      <button
        class="pagination-btn"
        :class="{ disabled: currentPage === totalPages }"
        @click="currentPage = Math.min(totalPages, currentPage + 1)"
      >
        Next
      </button>
    </div>

    <!-- Modals -->
    <teleport to="body">
      <!-- Add/Edit Modal -->
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-card">
          <header class="modal-header">
            <h3>{{ isEditing ? 'Edit Hypervisor' : 'Add Hypervisor' }}</h3>
            <button class="modal-close" @click="closeModal">×</button>
          </header>

          <form class="modal-body" @submit.prevent="submitForm">
            <div class="form-grid">
              <!-- Name -->
              <div class="form-group">
                <label>Name</label>
                <input
                  v-model="form.name"
                  type="text"
                  class="form-input"
                  @input="clearError('name')"
                />
                <small v-if="validationErrors.name" class="error-text">
                  {{ validationErrors.name }}
                </small>
              </div>

              <!-- Region -->
              <div class="form-group">
                <label>Region</label>
                <select
                  v-model="form.regionId"
                  class="form-input"
                  @change="clearError('regionId')"
                >
                  <option value="">Select region</option>
                  <option v-for="r in regions" :key="r.id" :value="r.id">
                    {{ r.name }}
                  </option>
                </select>
                <small v-if="validationErrors.regionId" class="error-text">
                  {{ validationErrors.regionId }}
                </small>
              </div>

              <!-- Type -->
              <div class="form-group">
                <label>Type</label>
                <select
                  v-model="form.type"
                  class="form-input"
                  @change="clearError('type')"
                >
                  <option value="">Select type</option>
                  <option value="PROXMOX">PROXMOX</option>
                  <option value="VMWARE">VMWARE</option>
                </select>
                <small v-if="validationErrors.type" class="error-text">
                  {{ validationErrors.type }}
                </small>
              </div>

              <!-- Host -->
              <div class="form-group">
                <label>Host</label>
                <input
                  v-model="form.host"
                  type="text"
                  class="form-input"
                  @input="clearError('host')"
                />
                <small v-if="validationErrors.host" class="error-text">
                  {{ validationErrors.host }}
                </small>
              </div>

              <!-- Username -->
              <div class="form-group">
                <label>Username</label>
                <input
                  v-model="form.username"
                  type="text"
                  class="form-input"
                  @input="clearError('username')"
                />
                <small v-if="validationErrors.username" class="error-text">
                  {{ validationErrors.username }}
                </small>
              </div>

              <!-- Token -->
              <div class="form-group">
                <label>Token</label>
                <input
                  v-model="form.token"
                  type="text"
                  class="form-input"
                  @input="clearError('token')"
                />
                <small v-if="validationErrors.token" class="error-text">
                  {{ validationErrors.token }}
                </small>
                <small v-if="!isEditing" class="password-hint">
                  Required for new hypervisor
                </small>
              </div>

              <!-- Status (Edit only) -->
              <div class="form-group" v-if="isEditing">
                <label>Status</label>
                <select v-model="form.status" class="form-input">
                  <option value="ONLINE">ONLINE</option>
                  <option value="OFFLINE">OFFLINE</option>
                </select>
              </div>
            </div>

            <footer class="modal-footer">
              <button
                type="button"
                class="btn-secondary"
                @click="closeModal"
              >
                Cancel
              </button>
              <button type="submit" class="btn-primary">
                {{ isEditing ? 'Update' : 'Create' }}
              </button>
            </footer>
          </form>

        </div>
      </div>

      <!-- Delete Modal -->
      <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDeleteModal">
        <div class="modal-card modal-small">
          <header class="modal-header">
            <h3>Confirm Delete</h3>
            <button class="modal-close" @click="closeDeleteModal">×</button>
          </header>
          <div class="modal-body">
            <p class="confirm-text">
              To confirm deletion of <strong>{{ selectedHypervisor?.name }}</strong>, 
              please type the exact word below:
            </p>
            <div class="delete-instruction">delete</div>
            <input
              type="text"
              v-model="deleteConfirmation"
              class="form-input delete-input"
              placeholder="Type 'delete'"
              @input="validateDeleteInput"
            />
            <div class="delete-error" v-if="deleteError">
              {{ deleteError }}
            </div>
            <div class="modal-actions">
              <button class="btn-secondary" @click="closeDeleteModal">Cancel</button>
              <button 
                class="btn-danger" 
                :disabled="deleteConfirmation !== 'delete'"
                @click="deleteHypervisorConfirmed"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import type { Hypervisor } from "@/composables/sysadmin/useHypervisors";
import { useHypervisors } from "@/composables/sysadmin/useHypervisors";
import { useRegion } from "@/composables/sysadmin/regional";
import { useMasterHypervisor } from "@/composables/sysadmin/useMasterHypervisor";

interface HypervisorForm {
  id?: string;
  name: string;
  type: string;
  host: string;
  username: string;
  status?: "ONLINE" | "OFFLINE" | null;
  token?: string;
}

const {
  hypervisors,
  fetchHypervisors,
  createHypervisor,
  updateHypervisor,
  deleteHypervisor,
  testConnection
} = useHypervisors();


interface HypervisorForm {
  id?: string;
  name: string;
  type: string;
  host: string;
  username: string;
  status?: "ONLINE" | "OFFLINE" | null;
  token?: string;
  regionId?: string;
}


const { regions, fetchRegions } = useRegion();
const { setMaster, unsetMaster } = useMasterHypervisor();




// State untuk notice / validasi di UI
const masterActionError = ref<string | null>(null);
const masterActionNotice = ref<string | null>(null);
const masterActionTargetId = ref<string | null>(null);

// Fungsi toggle master
const toggleMaster = async (hv: Hypervisor) => {

  masterActionError.value = null;
  masterActionNotice.value = null;

  if (!hv.id || !hv.regionId) {
    masterActionError.value = "Hypervisor or region information is missing.";
    return;
  }


  if (hv.isMaster) {
    masterActionNotice.value = `You are about to unset "${hv.name}" as master. This action affects all hypervisors in the region.`;
    try {
      await unsetMaster(hv.regionId);
      masterActionNotice.value = `"${hv.name}" has been unset as master.`;
      await fetchHypervisors();
    } catch (err: any) {
      masterActionError.value = err.message || "Failed to unset master.";
    }
    return;
  }

  const existingMasterInRegion = hypervisors.value.find(
    h => h.regionId === hv.regionId && h.isMaster
  );

  if (existingMasterInRegion) {
    masterActionError.value = `Cannot set "${hv.name}" as master. Region "${hv.regionId}" already has master "${existingMasterInRegion.name}". Unset it first.`;
    return;
  }

  masterActionNotice.value = `You are about to set "${hv.name}" as master. Only one master is allowed per region.`;
  try {
    await setMaster(hv.id);
    masterActionNotice.value = `"${hv.name}" is now the master for region "${hv.regionId}".`;
    await fetchHypervisors();
  } catch (err: any) {
    masterActionError.value = err.message || "Failed to set master.";
  }
};






onMounted(() => {
  fetchHypervisors();
  fetchRegions();
});


const search = ref("");
const filterStatus = ref("");
const filterType = ref("");
const currentPage = ref(1);
const pageSize = 10;

const form = ref<HypervisorForm>({
  name: "",
  type: "",
  host: "",
  username: "",
  regionId: ""
});


const validationErrors = ref<Record<string, string>>({});
const showModal = ref(false);
const isEditing = ref(false);

const showDeleteModal = ref(false);
const selectedHypervisor = ref<Hypervisor | null>(null);
const deleteConfirmation = ref("");
const deleteError = ref("");

const testingId = ref<string | null>(null);
const testResults = ref<Record<string, { success: boolean; message: string }>>({});

const resetForm = () => {
  form.value = {
    name: "",
    type: "",
    host: "",
    username: "",
    regionId: ""
  };
  validationErrors.value = {};
};

const openAddModal = () => {
  isEditing.value = false;
  resetForm();
  showModal.value = true;
};

const openEditModal = (hv: Hypervisor & { regionId?: string }) => {
  isEditing.value = true;
  form.value = {
    id: hv.id,
    name: hv.name || "",
    type: hv.type || "",
    host: hv.host || "",
    username: hv.username || "",
    status: hv.status,
    regionId: hv.regionId || ""
  };
  validationErrors.value = {};
  showModal.value = true;
};


const closeModal = () => {
  showModal.value = false;
};

const openDeleteModal = (hv: Hypervisor) => {
  selectedHypervisor.value = hv;
  deleteConfirmation.value = "";
  deleteError.value = "";
  showDeleteModal.value = true;
};

const closeDeleteModal = () => {
  showDeleteModal.value = false;
  selectedHypervisor.value = null;
};

const validateDeleteInput = () => {
  const val = deleteConfirmation.value;
  if (val === "") {
    deleteError.value = "";
  } else if (val === "delete") {
    deleteError.value = "";
  } else {
    deleteError.value = "You must type exactly: delete";
  }
};

const clearError = (field: string) => {
  if (validationErrors.value[field]) {
    validationErrors.value = { ...validationErrors.value, [field]: '' };
  }
};

const validateForm = () => {
  const errors: Record<string, string> = {};

  if (!form.value.name.trim()) errors.name = "Name is required";
  if (!form.value.type) errors.type = "Type is required";
  if (!form.value.host.trim()) errors.host = "Host is required";
  if (!form.value.username.trim()) errors.username = "Username is required";

  // Token required only for create
  if (!isEditing.value && !form.value.token?.trim()) {
    errors.token = "Token is required";
  }

  validationErrors.value = errors;
  return Object.keys(errors).length === 0;
};

const submitForm = async () => {
  if (!validateForm()) return;

  try {
    if (isEditing.value && form.value.id) {
      if (form.value.token) {
        await updateHypervisor(form.value.id, form.value);
      } else {
        const { token, ...updateData } = form.value;
        await updateHypervisor(form.value.id, updateData);
      }
    } else {
      await createHypervisor(form.value);
    }
    await fetchHypervisors();
    closeModal();
  } catch (err) {
    console.error("Form submission error:", err);
  }
};

const deleteHypervisorConfirmed = async () => {
  if (deleteConfirmation.value !== "delete" || !selectedHypervisor.value?.id) return;
  await deleteHypervisor(selectedHypervisor.value.id);
  await fetchHypervisors();
  closeDeleteModal();
};

const testConnectionHypervisor = async (hv: Hypervisor) => {
  if (!hv.id) return;
  testingId.value = hv.id;
  delete testResults.value[hv.id];
  try {
    await testConnection(hv.id);
    testResults.value[hv.id] = { success: true, message: "Connection OK" };
  } catch (err: any) {
    const msg = err?.message || "Connection Failed";
    testResults.value[hv.id] = { success: false, message: msg };
  } finally {
    testingId.value = null;
    setTimeout(() => {
      delete testResults.value[hv.id];
    }, 6000);
  }
};

const formatDate = (d?: string) => (d ? new Date(d).toLocaleDateString() : "—");
const filterRegion = ref("");

// Reset pagination on filter change
watch([search, filterStatus, filterType, filterRegion], () => {
  currentPage.value = 1;
});


const filteredHypervisors = computed(() => {
  const s = search.value.trim().toLowerCase();
  return hypervisors.value.filter((hv) => {
    const matchesSearch =
      !s ||
      (hv.name?.toLowerCase() || "").includes(s) ||
      (hv.host?.toLowerCase() || "").includes(s);

    const matchesStatus = !filterStatus.value || hv.status === filterStatus.value;
    const matchesType = !filterType.value || hv.type === filterType.value;
    const matchesRegion = !filterRegion.value || hv.regionId === filterRegion.value;

    return matchesSearch && matchesStatus && matchesType && matchesRegion;
  });
});


const totalPages = computed(() => Math.max(1, Math.ceil(filteredHypervisors.value.length / pageSize)));
const paginatedHypervisors = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredHypervisors.value.slice(start, start + pageSize);
});
</script>

<style scoped>
  .modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}

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

/* SEARCH & FILTERS */
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

.filter-select {
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  font-size: 14px;
  background: white;
  color: #1f2937;
  min-width: 140px;
}

.filter-select:focus {
  outline: none;
  border-color: #8A7CF0;
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
  min-width: 850px;
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

.name-cell {
  font-weight: 600;
  color: #111827;
}

/* STATUS PILL */
.status-pill {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.pill-online { background: #ecfdf5; color: #047857; }
.pill-offline { background: #fef2f2; color: #b91c1c; }
.pill-unknown { background: #f3f4f6; color: #6b7280; }

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

.action-btn.test {
  width: auto;
  padding: 0 10px;
  font-size: 12px;
  font-weight: 500;
}

.spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(106, 91, 239, 0.3);
  border-top: 2px solid #6A5BEF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* TEST RESULT */
.test-result .result-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.result-success {
  background: #ecfdf5;
  color: #047857;
  border: 1px solid #a7f3d0;
}

.result-error {
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
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

/* PAGINATION */
.pagination-wrap {
  margin-top: 24px;
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}

.pagination-btn {
  padding: 8px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  color: #374151;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.pagination-btn:hover:not(.disabled):not(.active) {
  background: #f9f8ff;
  color: #6A5BEF;
  border-color: #6A5BEF;
}

.pagination-btn.active {
  background: #6A5BEF;
  color: white;
  border-color: #6A5BEF;
}

.pagination-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

/* ERROR & HINT */
.error-text {
  color: #ef4444;
  font-size: 12px;
  margin-top: 4px;
}

.password-hint {
  color: #6b7280;
  font-size: 12px;
  margin-top: 4px;
  display: block;
}

/* MODAL ACTIONS */
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
  }
  .search-wrapper {
    min-width: auto;
  }
}


.master-badge {
  margin-left: 6px;
  padding: 2px 6px;
  font-size: 10px;
  font-weight: 700;
  border-radius: 6px;
  background: #e0e7ff;
  color: #1e40af;
}

/* ========== MASTER ACTION BUTTON ========== */
/* ========== MASTER SWITCH ========== */
.master-switch {
  position: relative;
  display: inline-block;
  width: 42px;
  height: 22px;
}

/* Hide checkbox */
.master-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

/* Slider */
.master-switch .slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background-color: #d1d5db; /* gray */
  border-radius: 999px;
  transition: background-color 0.25s ease;
}

/* Knob */
.master-switch .slider::before {
  content: "";
  position: absolute;
  height: 18px;
  width: 18px;
  left: 2px;
  top: 2px;
  background-color: white;
  border-radius: 50%;
  transition: transform 0.25s ease;
  box-shadow: 0 1px 3px rgba(0,0,0,0.25);
}

/* ON = MASTER */
.master-switch input:checked + .slider {
  background-color: #22c55e; /* green */
}

/* Move knob to right */
.master-switch input:checked + .slider::before {
  transform: translateX(20px);
}

/* Hover */
.master-switch:hover .slider {
  box-shadow: 0 0 0 3px rgba(34,197,94,0.25);
}



</style>

