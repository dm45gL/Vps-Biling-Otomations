<template>
  <div class="public-products-layout">
    <!-- Page Header -->
    <div class="page-header-section">
      <div class="header-content">
        <h1 class="page-heading">Public Products</h1>
        <p class="page-description">
          Manage customer-facing VPS offerings. Each product is linked to a raw infrastructure template.
        </p>
      </div>
      <button class="btn btn-create" @click="openCreateModal">
        <i class="fas fa-plus"></i>
        <span>Create Product</span>
      </button>
    </div>

    <!-- Alert -->
    <div v-if="error" class="alert alert-danger">
      <i class="fas fa-exclamation-triangle"></i>
      <span>{{ error }}</span>
    </div>

    <!-- Data Table -->
    <div class="table-card">
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th class="th-name">Product</th>
              <th class="th-desc">Description</th>
              <th class="th-specs">Specs</th>
              <th class="th-pricing">Pricing Plans</th>
              <th class="th-backup">Backup</th>
              <th class="th-raw">Raw Product</th>
              <th class="th-status">Status</th>
              <th class="th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in products" :key="p.id" class="table-row">
              <td class="td-name">
                <div class="product-identity">
                  <div class="product-name">{{ p.name }}</div>
                </div>
              </td>
              <td class="td-desc">
                <span class="text-description">{{ p.description || '—' }}</span>
              </td>
              <td class="td-specs">
                <div class="spec-list">
                  <span class="spec-item">{{ p.specs.cpu }} vCPU</span>
                  <span class="spec-item">{{ p.specs.ram }} GB RAM</span>
                  <span class="spec-item">{{ p.specs.disk }} GB SSD</span>
                  <span class="spec-item">{{ p.specs.bandwidth }} TB BW</span>
                </div>
              </td>
              <td class="td-pricing">
                <div v-if="p.pricing.length" class="pricing-list">
                  <div v-for="plan in p.pricing" :key="plan.durationLabel" class="pricing-line">
                    <span class="duration-tag">{{ plan.durationLabel }}</span>
                    <span class="price-value">Rp {{ formatPrice(plan.price) }}</span>
                    <span v-if="plan.backupPrice" class="backup-add">+{{ formatPrice(plan.backupPrice) }}</span>
                  </div>
                </div>
                <span v-else class="text-placeholder">— No pricing configured</span>
              </td>
              <td class="td-backup">
                <span class="backup-name">{{ p.backupPolicy?.name || '—' }}</span>
              </td>
              <td class="td-raw">
                <span class="raw-tag">{{ getRawProductName(p.rawProductId) }}</span>
              </td>
              <td class="td-status">
                <span
                  class="status-badge"
                  :class="{ 'status-active': p.isActive, 'status-inactive': !p.isActive }"
                >
                  {{ p.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="td-actions">
                <div class="action-buttons">
                  <button
                    class="action-btn status-toggle"
                    :class="{ active: p.isActive }"
                    :aria-label="p.isActive ? 'Deactivate product' : 'Activate product'"
                    @click="toggleActive(p)"
                  >
                    <i class="fas fa-toggle-on" v-if="p.isActive"></i>
                    <i class="fas fa-toggle-off" v-else></i>
                  </button>
                  <button
                    class="action-btn edit-btn"
                    aria-label="Edit product"
                    @click="editProduct(p)"
                  >
                    <i class="fas fa-edit"></i>
                  </button>
                  <button
                    class="action-btn delete-btn"
                    aria-label="Delete product"
                    @click="confirmDelete(p)"
                  >
                    <i class="fas fa-trash-alt"></i>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="products.length === 0 && !loading">
              <td colspan="8" class="empty-state-cell">
                <div class="empty-state-content">
                  <div class="empty-icon">
                    <i class="fas fa-layer-group"></i>
                  </div>
                  <h3 class="empty-title">No Public Products</h3>
                  <p class="empty-text">Create your first product to offer to customers.</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Loading Overlay -->
        <div v-if="loading" class="loading-overlay">
          <div class="spinner"></div>
          <p class="loading-text">Fetching product data...</p>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <teleport to="body">
      <div v-if="modalProduct" class="modal-backdrop" @click.self="closeModal">
        <div class="modal-dialog">
          <div class="modal-header">
            <h2 class="modal-title">
              {{ isCreating ? 'Create New Product' : 'Edit Product' }}
            </h2>
            <button class="modal-close" @click="closeModal" aria-label="Close">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <div v-if="isCreating" class="input-group">
              <label class="input-label">Raw Product <span class="required-star">*</span></label>
              <select v-model="modalProduct.rawProductId" class="form-control">
                <option v-for="r in rawProducts" :key="r.id" :value="r.id">{{ r.name }}</option>
              </select>
            </div>
            <div class="input-group">
              <label class="input-label">Product Name <span class="required-star">*</span></label>
              <input
                v-model="modalProduct.name"
                type="text"
                class="form-control"
                placeholder="e.g. VPS Pro"
                :class="{ 'is-invalid': formError }"
              />
              <div v-if="formError" class="input-error">{{ formError }}</div>
            </div>
            <div class="input-group">
              <label class="input-label">Description</label>
              <input
                v-model="modalProduct.description"
                type="text"
                class="form-control"
                placeholder="Optional"
              />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeModal">Cancel</button>
            <button class="btn btn-primary" @click="saveModal" :disabled="!modalProduct.name?.trim()">
              {{ isCreating ? 'Create Product' : 'Save Changes' }}
            </button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- Delete Confirmation (sesuai tipe props komponen Anda) -->
    <DeleteConfirmationModal
      v-if="deleteTarget"
      :target-label="`product “${deleteTarget.name}”`"
      @confirm="performDelete"
      @cancel="cancelDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { AdminProductDTO } from '@/api/busines/publicProduct.api';
import { useAdminPublicProducts } from '@/composables/business/useAdminPublicProduct';
import { useRawProducts } from '@/composables/sysadmin/useRawProducts';
import DeleteConfirmationModal from '../components/modals/Delete.vue';

// === State ===
const {
  products,
  loading,
  error,
  fetchProducts,
  createProduct,
  updateProduct,
  toggleProductActive,
  removeProduct
} = useAdminPublicProducts();

const { rawProducts, fetchRawProducts } = useRawProducts();

const modalProduct = ref<Partial<AdminProductDTO> & { rawProductId?: string } | null>(null);
const deleteTarget = ref<AdminProductDTO | null>(null);
const isCreating = ref(true);
const formError = ref('');

// === Lifecycle ===
onMounted(() => {
  fetchRawProducts();
  fetchProducts();
});

// === Helpers ===
const formatPrice = (v: number): string => new Intl.NumberFormat('id-ID').format(v);
const getRawProductName = (id: string): string => {
  return rawProducts.value.find(r => r.id === id)?.name || '—';
};

// === Modals ===
const openCreateModal = () => {
  isCreating.value = true;
  formError.value = '';
  modalProduct.value = {
    name: '',
    description: '',
    rawProductId: rawProducts.value[0]?.id
  };
};

const editProduct = (p: AdminProductDTO) => {
  isCreating.value = false;
  formError.value = '';
  modalProduct.value = { ...p };
};

const closeModal = () => (modalProduct.value = null);

const saveModal = async () => {
  if (!modalProduct.value?.name?.trim()) {
    formError.value = 'Product name is required';
    return;
  }
  try {
    if (isCreating.value) {
      await createProduct({
        rawProductId: modalProduct.value.rawProductId!,
        name: modalProduct.value.name,
        description: modalProduct.value.description || undefined
      });
    } else {
      await updateProduct(modalProduct.value.id!, {
        name: modalProduct.value.name,
        description: modalProduct.value.description || undefined
      });
    }
    await fetchProducts();
    closeModal();
  } catch {
    formError.value = 'Failed to save. Please try again.';
  }
};

// === Actions ===
const toggleActive = async (p: AdminProductDTO) => {
  if (!p.id) return;
  await toggleProductActive(p.id, !p.isActive);
  await fetchProducts();
};

const confirmDelete = (p: AdminProductDTO) => {
  deleteTarget.value = p;
};

const cancelDelete = () => {
  deleteTarget.value = null;
};

const performDelete = async () => {
  if (deleteTarget.value?.id) {
    await removeProduct(deleteTarget.value.id);
    await fetchProducts();
    cancelDelete();
  }
};
</script>

<style scoped>
/* === FOUNDATION === */
.public-products-layout {
  padding: 2.5rem;
  background: #ffffff;
  min-height: 100vh;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  color: #111827;
  line-height: 1.5;
}

/* === HEADER === */
.page-header-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2.25rem;
  flex-wrap: wrap;
  gap: 1.25rem;
}

.header-content {
  max-width: 650px;
}

.page-heading {
  font-size: 1.875rem;
  font-weight: 700;
  margin: 0;
  color: #111827;
  letter-spacing: -0.02em;
}

.page-description {
  font-size: 1.05rem;
  color: #6b7280;
  margin-top: 0.5rem;
  line-height: 1.6;
}

/* === BUTTONS === */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  font-weight: 600;
  border-radius: 12px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  border: none;
  min-height: 44px;
}

.btn-create {
  background: linear-gradient(135deg, #6A5BEF 0%, #7E57C2 100%);
  color: white;
  box-shadow: 0 4px 14px rgba(106, 91, 239, 0.3);
}

.btn-create:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(106, 91, 239, 0.4);
}

.btn-primary {
  background: linear-gradient(135deg, #6A5BEF, #7E57C2);
  color: white;
}

.btn-secondary {
  background: #f9fafb;
  color: #6A5BEF;
  border: 1px solid #e5e7eb;
}

.btn-secondary:hover {
  background: #f3f4f6;
}

/* === ALERTS === */
.alert {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-radius: 12px;
  margin-bottom: 1.75rem;
  font-weight: 500;
}

.alert-danger {
  background: #fef2f2;
  color: #dc2626;
  border-left: 4px solid #ef4444;
}

/* === TABLE === */
.table-card {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  border: 1px solid #f0efff;
  background: white;
  position: relative;
}

.table-container {
  position: relative;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}

.data-table th,
.data-table td {
  padding: 1.25rem 1.25rem;
  text-align: left;
  border-bottom: 1px solid #f3f4f6;
}

.data-table thead th {
  background: #faf9ff;
  font-weight: 600;
  color: #374151;
  font-size: 0.825rem;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  padding-top: 1.125rem;
  padding-bottom: 1.125rem;
}

/* Column widths */
.th-name, .td-name { width: 15%; }
.th-desc, .td-desc { width: 15%; }
.th-specs, .td-specs { width: 18%; }
.th-pricing, .td-pricing { width: 20%; }
.th-backup, .td-backup { width: 10%; }
.th-raw, .td-raw { width: 12%; }
.th-status, .td-status { width: 8%; }
.th-actions, .td-actions { width: 10%; }

/* Table Row */
.table-row:hover {
  background-color: #fcfbff;
}

/* Specs */
.spec-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.spec-item {
  background: #f7f5ff;
  color: #6A5BEF;
  padding: 0.25rem 0.625rem;
  border-radius: 20px;
  font-size: 0.825rem;
  font-weight: 600;
}

/* Pricing */
.pricing-list {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.pricing-line {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.duration-tag {
  min-width: 70px;
  font-weight: 600;
  color: #4b5563;
  font-size: 0.875rem;
}

.price-value {
  color: #1f2937;
  font-weight: 600;
}

.backup-add {
  color: #6b7280;
  font-style: italic;
  font-size: 0.875rem;
}

.text-placeholder {
  color: #9ca3af;
  font-style: italic;
}

.text-description,
.backup-name {
  color: #6b7280;
}

/* Raw & Status */
.raw-tag {
  background: #f0f0ff;
  color: #4f46e5;
  padding: 0.25rem 0.625rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
}

.status-badge {
  padding: 0.375rem 0.875rem;
  border-radius: 24px;
  font-size: 0.85rem;
  font-weight: 600;
  display: inline-block;
}

.status-active {
  background: #dbeafe;
  color: #1d4ed8;
}

.status-inactive {
  background: #fee2e2;
  color: #dc2626;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.action-btn {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(0,0,0,0.12);
}

.status-toggle {
  background: #f0f9ff;
  color: #0ea5e9;
}

.status-toggle.active {
  background: #dbeafe;
  color: #1d4ed8;
}

.edit-btn {
  background: #f0f5ff;
  color: #4f46e5;
}

.edit-btn:hover {
  background: #e0e7ff;
}

.delete-btn {
  background: #fff1f2;
  color: #ef4444;
}

.delete-btn:hover {
  background: #fee2e2;
}

/* Empty State */
.empty-state-cell {
  text-align: center;
  padding: 4rem 2rem;
}

.empty-state-content {
  max-width: 400px;
  margin: 0 auto;
}

.empty-icon {
  font-size: 3.5rem;
  color: #d1d5db;
  margin-bottom: 1.25rem;
}

.empty-title {
  font-size: 1.375rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.75rem;
}

.empty-text {
  color: #6b7280;
  font-size: 1rem;
  line-height: 1.6;
}

/* === MODAL === */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(17, 24, 39, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 8000;
  padding: 1.5rem;
}

.modal-dialog {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 580px;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.22);
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.75rem 2rem;
  border-bottom: 1px solid #f3f4f6;
  background: #faf9ff;
}

.modal-title {
  font-size: 1.375rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #9ca3af;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
}

.modal-close:hover {
  background: #f3f4f6;
  color: #6b7280;
}

.modal-body {
  padding: 2rem;
}

.input-group {
  margin-bottom: 1.5rem;
}

.input-label {
  display: block;
  margin-bottom: 0.625rem;
  font-weight: 600;
  color: #374151;
  font-size: 1rem;
}

.required-star {
  color: #ef4444;
}

.form-control {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  font-size: 1rem;
  background: #faf9ff;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-control:focus {
  outline: none;
  border-color: #6A5BEF;
  box-shadow: 0 0 0 3px rgba(106, 91, 239, 0.15);
}

.form-control.is-invalid {
  border-color: #ef4444;
}

.input-error {
  color: #ef4444;
  font-size: 0.9rem;
  margin-top: 0.5rem;
  font-weight: 500;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.75rem 2rem;
  border-top: 1px solid #f3f4f6;
  background: #faf9ff;
}

/* === LOADING === */
.loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.85);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-radius: 16px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(106, 91, 239, 0.2);
  border-top: 3px solid #6A5BEF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.loading-text {
  color: #6b7280;
  font-size: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>