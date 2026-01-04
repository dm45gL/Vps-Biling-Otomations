<template>
  <div class="page-wrapper">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="title">Manage IP Addresses</h1>
        <p class="subtitle">Add, edit, and manage your IP inventory</p>
      </div>

      <!-- Toolbar -->
      <div class="header-right">
        <div class="search-wrapper">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="7" cy="7" r="5.5"/>
            <path d="m11 11 2 2"/>
          </svg>
          <input
            type="text"
            class="search-input"
            v-model="searchQuery"
            placeholder="Search IP or note"
          />
        </div>

        <!-- Region Filter -->
        <select class="filter-select" v-model="filterRegion">
          <option value="">All Regions</option>
          <option v-for="region in regions" :key="region.id" :value="region.id">
            {{ region.name }}
          </option>
        </select>

        <select class="filter-select" v-model="filterType">
          <option value="">All Types</option>
          <option value="PRIVATE">PRIVATE</option>
          <option value="PUBLIC">PUBLIC</option>
        </select>

        <select class="filter-select" v-model="filterStatus">
          <option value="">All Status</option>
          <option value="AVAILABLE">AVAILABLE</option>
          <option value="USED">USED</option>
          <option value="RESERVED">RESERVED</option>
        </select>

        <!-- Dua tombol: Add IP & Add CIDR -->
        <button class="add-btn add-ip-btn" @click="openCreateModal">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M8 4v8M4 8h8"/>
          </svg>
          <span class="add-text">Add IP</span>
        </button>

        <button class="add-btn add-cidr-btn" @click="openCidrModal">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 8h10M7 3v10"/>
          </svg>
          <span class="add-text">Add CIDR</span>
        </button>
      </div>
    </div>

    <!-- Stats -->
    <div class="stats-bar">
      <span class="total-count">Total: {{ filteredIPs.length }} IP{{ filteredIPs.length !== 1 ? 's' : '' }}</span>
    </div>

    <!-- Loading & Error -->
    <div v-if="loading || regionLoading" class="loading-message">Loading IP addresses...</div>
    <div v-else-if="error || regionError" class="error-message">{{ error || regionError }}</div>

    <!-- Table or Empty State -->
    <div v-else class="card">
      <div class="table-wrap">
        <table class="modern-table">
          <thead>
            <tr>
              <th>#</th>
              <th>IP Address</th>
              <th>Region</th>
              <th>Type</th>
              <th>Status</th>
              <th>Gateway</th>
              <th>DNS</th>
              <th>Note</th>
              <th>Created</th>
              <th class="th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <template v-if="paginatedIPs.length > 0">
              <tr v-for="(ip, index) in paginatedIPs" :key="ip.id">
                <td class="muted">{{ (currentPage - 1) * pageSize + index + 1 }}</td>
                <td class="name-cell">
                  {{ ip.netmask ? `${ip.ip}/${ip.netmask}` : ip.ip }}
                </td>
                <td>{{ getRegionName(ip.regionId) || '—' }}</td>
                <td>
                  <span class="chip chip-type" :class="`chip-${ip.type?.toLowerCase() || 'private'}`">
                    {{ ip.type || '—' }}
                  </span>
                </td>
                <td>
                  <span class="chip" :class="`chip-${ip.status?.toLowerCase() || 'available'}`">
                    {{ ip.status || '—' }}
                  </span>
                </td>
                <td>{{ ip.gateway || '—' }}</td>
                <td class="mono">{{ ip.dns || '—' }}</td>
                <td class="note-cell">{{ ip.note || '—' }}</td>
                <td class="muted">{{ formatDate(ip.createdAt) }}</td>
                <td class="actions-cell">
                  <button class="action-btn" @click="openEditModal(ip)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                      <path d="M12.5 2.5a1 1 0 0 1 3 3L6.5 14.5l-4 1 1-4L12.5 2.5z"/>
                    </svg>
                  </button>
                  <button class="action-btn danger" @click="openDeleteModal(ip)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                      <path d="M4 5h8M10 5v9H6V5M5 5V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                    </svg>
                  </button>
                </td>
              </tr>
            </template>
            <tr v-else>
              <td colspan="11" class="empty-row">
                <div class="empty-content">
                  <div>No IP addresses found</div>
                  <small>Try changing search or filters</small>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Pagination -->
    <div class="pagination-wrap" v-if="!loading && !regionLoading && !error && !regionError && filteredIPs.length > pageSize">
      <button
        class="pagination-btn"
        :class="{ disabled: currentPage === 1 }"
        @click="currentPage = Math.max(1, currentPage - 1)"
      >
        Prev
      </button>

      <button
        v-for="p in visiblePages"
        :key="p"
        class="pagination-btn"
        :class="{ active: currentPage === p }"
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

    <!-- Add/Edit Modal -->
    <teleport to="body">
      <div v-if="showCreateModal" class="modal-overlay" @click.self="closeModals">
        <div class="modal-card">
          <header class="modal-header">
            <h3>{{ editingIP ? 'Edit IP Address' : 'Add IP Address' }}</h3>
            <button class="modal-close" @click="closeModals">×</button>
          </header>
          <form class="modal-body" @submit.prevent="handleSubmit">
            <div class="form-grid">
              <div class="form-group">
                <label>IP Address</label>
                <input 
                  type="text" 
                  class="form-input" 
                  v-model="form.ip"
                  placeholder="e.g. 192.168.1.10"
                  :disabled="!!editingIP"
                />
              </div>

              <div class="form-group">
                <label>Region *</label>
                <select class="form-input" v-model="form.regionId" required>
                  <option value="">Select Region</option>
                  <option v-for="region in regions" :key="region.id" :value="region.id">
                    {{ region.name }}
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label>Type</label>
                <select class="form-input" v-model="form.type">
                  <option value="PRIVATE">PRIVATE</option>
                  <option value="PUBLIC">PUBLIC</option>
                </select>
              </div>

              <div class="form-group">
                <label>Status</label>
                <select class="form-input" v-model="form.status">
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="USED">USED</option>
                  <option value="RESERVED">RESERVED</option>
                </select>
              </div>

              <div class="form-group">
                <label>Gateway (Optional)</label>
                <input 
                  type="text" 
                  class="form-input" 
                  v-model="form.gateway"
                  placeholder="e.g. 192.168.1.1"
                />
              </div>

              <div class="form-group">
                <label>Netmask (Optional)</label>
                <input 
                  type="number" 
                  class="form-input" 
                  v-model.number="form.netmask"
                  placeholder="e.g. 24"
                  min="0"
                  max="32"
                />
              </div>

              <div class="form-group">
                <label>DNS (Optional)</label>
                <input 
                  type="text" 
                  class="form-input" 
                  v-model="form.dns"
                  placeholder="e.g. 8.8.8.8 1.1.1.1"
                />
                <small class="form-hint">Separate multiple DNS with space</small>
              </div>

              <div class="form-group">
                <label>Note (Optional)</label>
                <input 
                  type="text" 
                  class="form-input" 
                  v-model="form.note"
                  placeholder="e.g. Database Server"
                />
              </div>
            </div>
            <footer class="modal-footer">
              <button type="button" class="btn-secondary" @click="closeModals">Cancel</button>
              <button type="submit" class="btn-primary">{{ editingIP ? 'Update' : 'Add' }}</button>
            </footer>
          </form>
        </div>
      </div>
    </teleport>

    <!-- CIDR Modal -->
    <teleport to="body">
      <div v-if="showCidrModal" class="modal-overlay" @click.self="closeModals">
        <div class="modal-card">
          <header class="modal-header">
            <h3>Add IPs from CIDR</h3>
            <button class="modal-close" @click="closeModals">×</button>
          </header>
          <form class="modal-body" @submit.prevent="handleCidrSubmit">
            <div class="form-grid">
              <div class="form-group">
                <label>CIDR Range</label>
                <input 
                  type="text" 
                  class="form-input" 
                  v-model="cidrForm.cidr"
                  placeholder="e.g. 192.168.1.0/28"
                />
              </div>
              <div class="form-group">
                <label>Region *</label>
                <select class="form-input" v-model="cidrForm.regionId" required>
                  <option value="">Select Region</option>
                  <option v-for="region in regions" :key="region.id" :value="region.id">
                    {{ region.name }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label>Type</label>
                <select class="form-input" v-model="cidrForm.type">
                  <option value="PRIVATE">PRIVATE</option>
                  <option value="PUBLIC">PUBLIC</option>
                </select>
              </div>
              <div class="form-group">
                <label>Status</label>
                <select class="form-input" v-model="cidrForm.status">
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="USED">USED</option>
                  <option value="RESERVED">RESERVED</option>
                </select>
              </div>
              <div class="form-group">
                <label>Note (Optional)</label>
                <input 
                  type="text" 
                  class="form-input" 
                  v-model="cidrForm.note"
                  placeholder="Applied to all generated IPs"
                />
              </div>
            </div>
            <footer class="modal-footer">
              <button type="button" class="btn-secondary" @click="closeModals">Cancel</button>
              <button type="submit" class="btn-primary">Generate IPs</button>
            </footer>
          </form>
        </div>
      </div>
    </teleport>

    <!-- Delete Modal -->
    <teleport to="body">
      <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeModals">
        <div class="modal-card modal-small">
          <header class="modal-header">
            <h3>Confirm Delete</h3>
            <button class="modal-close" @click="closeModals">×</button>
          </header>
          <div class="modal-body">
            <p class="confirm-text">
              To confirm deletion of <strong>{{ ipToDelete?.ip }}</strong>, 
              please type the exact word below:
            </p>
            <div class="delete-instruction">delete</div>
            <input
              type="text"
              v-model="deleteConfirmation"
              class="form-input delete-input"
              placeholder="Type 'delete'"
            />
            <div class="delete-error" v-if="deleteConfirmation && deleteConfirmation !== 'delete'">
              You must type exactly: delete
            </div>
            <div class="modal-actions">
              <button class="btn-secondary" @click="closeModals">Cancel</button>
              <button 
                class="btn-danger" 
                :disabled="deleteConfirmation !== 'delete'"
                @click="confirmDelete"
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
import { ref, computed, onMounted, watch } from 'vue';
import { useIP } from '@/composables/sysadmin/useIP';
import { useRegion } from '@/composables/sysadmin/regional';
import type { IPAddress, IPType, IPStatus } from '@/api/sysadmin/IP_Api';

// IP Management
const {
  ips,
  loading,
  error,
  fetchIPs,
  createIP,
  updateIP,
  deleteIP,
  createFromCidr,
} = useIP();

// Region Management
const {
  regions,
  loading: regionLoading,
  error: regionError,
  fetchRegions,
} = useRegion();

onMounted(() => {
  fetchIPs();
  fetchRegions();
});

// Filters & Search
const searchQuery = ref('');
const filterRegion = ref('');
const filterType = ref('');
const filterStatus = ref('');
const currentPage = ref(1);
const pageSize = 10; 

// Modals
const showCreateModal = ref(false);
const showCidrModal = ref(false);
const showDeleteModal = ref(false);
const editingIP = ref<IPAddress | null>(null);
const ipToDelete = ref<IPAddress | null>(null);
const deleteConfirmation = ref('');

// Helper: Get region name by ID
const getRegionName = (id: string | undefined): string | undefined => {
  return regions.value.find(r => r.id === id)?.name;
};

// Forms
const form = ref({
  ip: '',
  regionId: '',
  type: 'PRIVATE' as IPType,
  status: 'AVAILABLE' as IPStatus,
  note: '',
  gateway: '',
  netmask: undefined as number | undefined,
  dns: '',
});

const cidrForm = ref({
  cidr: '',
  regionId: '',
  type: 'PRIVATE' as IPType,
  status: 'AVAILABLE' as IPStatus,
  note: '',
});

const closeModals = () => {
  showCreateModal.value = false;
  showCidrModal.value = false;
  showDeleteModal.value = false;
  editingIP.value = null;
  ipToDelete.value = null;
  deleteConfirmation.value = '';
  form.value = {
    ip: '',
    regionId: '',
    type: 'PRIVATE',
    status: 'AVAILABLE',
    note: '',
    gateway: '',
    netmask: undefined,
    dns: '',
  };
  cidrForm.value = {
    cidr: '',
    regionId: '',
    type: 'PRIVATE',
    status: 'AVAILABLE',
    note: '',
  };
};

const openCreateModal = () => {
  editingIP.value = null;
  form.value = {
    ip: '',
    regionId: '',
    type: 'PRIVATE',
    status: 'AVAILABLE',
    note: '',
    gateway: '',
    netmask: undefined,
    dns: '',
  };
  showCreateModal.value = true;
};

const openEditModal = (ip: IPAddress) => {
  editingIP.value = ip;
  form.value = { 
    ip: ip.ip,
    regionId: ip.regionId,
    type: ip.type,
    status: ip.status,
    note: ip.note || '',
    gateway: ip.gateway || '',
    netmask: ip.netmask ?? undefined,
    dns: ip.dns || '',
  };
  showCreateModal.value = true;
};

const openCidrModal = () => {
  cidrForm.value = {
    cidr: '',
    regionId: '',
    type: 'PRIVATE',
    status: 'AVAILABLE',
    note: '',
  };
  showCidrModal.value = true;
};

const openDeleteModal = (ip: IPAddress) => {
  ipToDelete.value = ip;
  deleteConfirmation.value = '';
  showDeleteModal.value = true;
};

watch([searchQuery, filterRegion, filterType, filterStatus], () => {
  currentPage.value = 1;
});

const filteredIPs = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  return ips.value.filter(ip => {
    const matchesSearch = !query || 
      ip.ip.toLowerCase().includes(query) || 
      (ip.note?.toLowerCase() || '').includes(query);
    const matchesRegion = !filterRegion.value || ip.regionId === filterRegion.value;
    const matchesType = !filterType.value || ip.type === filterType.value;
    const matchesStatus = !filterStatus.value || ip.status === filterStatus.value;
    return matchesSearch && matchesRegion && matchesType && matchesStatus;
  });
});

const totalPages = computed(() => Math.max(1, Math.ceil(filteredIPs.value.length / pageSize)));
const paginatedIPs = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredIPs.value.slice(start, start + pageSize);
});

const formatDate = (iso: string) => new Date(iso).toLocaleString('id-ID', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
});

// ✅ TANPA REFRESH setelah create/update — mengandalkan mutasi lokal di useIP.ts
const handleSubmit = async () => {
  try {
    if (editingIP.value) {
      await updateIP(editingIP.value.id, {
        regionId: form.value.regionId,
        type: form.value.type,
        status: form.value.status,
        note: form.value.note || undefined,
        gateway: form.value.gateway || undefined,
        netmask: form.value.netmask,
        dns: form.value.dns || undefined,
      });
    } else {
      await createIP({
        ip: form.value.ip,
        regionId: form.value.regionId,
        type: form.value.type,
        status: form.value.status,
        note: form.value.note || undefined,
        gateway: form.value.gateway || undefined,
        netmask: form.value.netmask,
        dns: form.value.dns || undefined,
      });
    }
    // ❌ TIDAK PERLU fetchIPs() — data sudah di-mutate di composable
    closeModals();
  } catch (err) {
    // Error handled in composable
  }
};

// ✅ CIDR tetap refetch karena API batch belum kembalikan full object
const handleCidrSubmit = async () => {
  if (!cidrForm.value.regionId) return;
  try {
    await createFromCidr({
      cidr: cidrForm.value.cidr,
      regionId: cidrForm.value.regionId,
      type: cidrForm.value.type,
      status: cidrForm.value.status,
      note: cidrForm.value.note || undefined,
    });
    // createFromCidr sudah panggil fetchIPs(regionId) di dalamnya
    closeModals();
  } catch (err) {
    // Error handled in composable
  }
};

const confirmDelete = async () => {
  if (deleteConfirmation.value === 'delete' && ipToDelete.value) {
    try {
      await deleteIP(ipToDelete.value.id);
      // deleteIP sudah hapus dari ips.value → tidak perlu refetch
      // TAPI: jika kamu ingin konsistensi penuh, biarkan seperti ini
      closeModals();
    } catch (err) {
      // Error handled in composable
    }
  }
};

const maxButtons = 10;

const visiblePages = computed(() => {
  if (totalPages.value <= maxButtons) {
    return Array.from({ length: totalPages.value }, (_, i) => i + 1);
  } else {
    const half = Math.floor(maxButtons / 2);
    let start = Math.max(1, currentPage.value - half);
    let end = start + maxButtons - 1;

    if (end > totalPages.value) {
      end = totalPages.value;
      start = end - maxButtons + 1;
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }
});
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

/* STATS BAR */
.stats-bar {
  margin-bottom: 16px;
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.total-count {
  background: #f9f8ff;
  padding: 4px 12px;
  border-radius: 20px;
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
  min-width: 140px;
  color: #1f2937;
}

.filter-select:focus {
  outline: none;
  border-color: #8A7CF0;
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
}

.add-ip-btn,
.add-cidr-btn {
  background: linear-gradient(135deg, #6A5BEF, #5D4AE5);
}

.add-ip-btn:hover,
.add-cidr-btn:hover {
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
  min-width: 950px;
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
  white-space: nowrap;
}

.modern-table tbody td {
  padding: 14px 16px;
  border-bottom: 1px solid #f3f4f6;
  font-size: 14px;
  vertical-align: top;
}

.modern-table tbody tr:hover {
  background: #faf9ff;
}

.muted {
  color: #6b7280;
  font-size: 13px;
}

.name-cell,
.mono {
  font-family: monospace;
  font-size: 14px;
  color: #111827;
}

.note-cell {
  max-width: 140px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #4b5563;
}

/* CHIP */
.chip {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.chip-private { background: #e0f2fe; color: #0891b2; }
.chip-public { background: #f0fdf4; color: #166534; }
.chip-available { background: #e8f5e9; color: #2e7d32; }
.chip-used { background: #fff3e0; color: #e65100; }
.chip-reserved { background: #f1f8e9; color: #689f38; }

/* ACTIONS */
.th-actions,
.actions-cell {
  text-align: right;
  min-width: 90px;
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

.form-hint {
  font-size: 0.85em;
  color: #888;
  margin-top: 4px;
}

/* DELETE MODAL SPECIFIC */
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
  .search-wrapper {
    min-width: auto;
  }
  .filter-select {
    flex: 1;
    min-width: 120px;
  }
  .modern-table {
    min-width: 1000px;
  }
}
</style>