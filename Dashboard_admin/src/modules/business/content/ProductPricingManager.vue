<template>
  <div class="workspace">
    <!-- Top Bar -->
    <div class="top-bar">
      <div class="top-left">
        <h1 class="page-title">Product Pricing</h1>
        <p class="page-subtitle">Manage pricing plans for raw products</p>
      </div>
    </div>

    <!-- Main Layout -->
    <div class="main-layout">
      <!-- Raw Products List -->
      <div class="products-pane">
        <div class="pane-header">
          <h2>Raw Products</h2>
          <span class="badge">{{ rawProducts.length }} products</span>
        </div>
        <div class="products-list">
          <div
            v-for="product in rawProducts"
            :key="product.id"
            class="product-item"
            :class="{ 'active': selectedProductId === product.id }"
            @click="selectProduct(product.id)"
          >
            <div class="product-icon">🧊</div>
            <div class="product-info">
              <div class="product-name">{{ product.name }}</div>
            </div>
          </div>
          <div v-if="rawProducts.length === 0" class="empty-products">
            <p>No raw products available.</p>
          </div>
        </div>
      </div>

      <!-- Pricing Detail Pane -->
      <div class="detail-pane">
        <div class="section-header">
          <h2>{{ selectedProduct?.name || 'Select a Product' }}</h2>
        </div>

        <div v-if="selectedProductId" class="detail-content">
          <!-- Add Pricing Form -->
          <div class="pricing-form">
            <h3>Add New Pricing Plans</h3>
            <div class="duration-row" v-for="(item, idx) in newPricings" :key="idx">
              <div class="form-group">
                <label>Duration (months)</label>
                <input type="number" min="1" v-model.number="item.months" class="form-input" placeholder="e.g. 5" />
                <div v-if="formErrors[idx]?.months" class="error-text">{{ formErrors[idx].months }}</div>
              </div>
              <div class="form-group">
                <label>Price (Rp)</label>
                <input type="number" min="0" v-model.number="item.price" class="form-input" placeholder="e.g. 1000" />
                <div v-if="formErrors[idx]?.price" class="error-text">{{ formErrors[idx].price }}</div>
              </div>
              <div class="form-group">
                <label>Backup Price (Rp)</label>
                <input type="number" min="0" v-model.number="item.backupPrice" class="form-input" placeholder="optional" />
                <div v-if="formErrors[idx]?.backupPrice" class="error-text">{{ formErrors[idx].backupPrice }}</div>
              </div>
              <button v-if="newPricings.length > 1" type="button" class="btn-remove" @click="removeNewPricing(idx)">
                &minus;
              </button>
            </div>
            <div class="form-actions">
              <button type="button" class="btn-text" @click="addNewPricing">+ Add Duration</button>
              <button type="button" class="btn-primary" @click="saveBatch" :disabled="loading.creating || newPricings.length === 0">
                Save Pricing
              </button>
            </div>
          </div>

          <!-- Current Pricing Plans -->
          <div v-if="pricings.length > 0" class="pricing-table-container">
            <h3>Current Pricing Plans</h3>
            <div class="table-wrapper">
              <table class="pricing-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Duration</th>
                    <th>Price (Rp)</th>
                    <th>Backup Price (Rp)</th>
                    <th>Created</th>
                    <th>Updated</th>
                    <th class="th-toggle">Toggle</th>
                    <th class="th-delete">Delete</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="p in pricings" :key="p.id" :class="{ 'row-inactive': !p.isActive }">
                    <td>
                      <span class="status-badge" :class="{ 'status-active': p.isActive, 'status-inactive': !p.isActive }">
                        {{ p.isActive ? 'Active' : 'Inactive' }}
                      </span>
                    </td>
                    <td>{{ p.months }}</td>
                    <td>{{ formatPrice(p.price) }}</td>
                    <td>{{ p.backupPrice != null ? formatPrice(p.backupPrice) : '—' }}</td>
                    <td>{{ formatDate(p.createdAt) }}</td>
                    <td>{{ formatDate(p.updatedAt) }}</td>
                    <td class="cell-center">
                      <button
                        type="button"
                        class="btn-toggle"
                        :class="{ 'btn-activate': !p.isActive, 'btn-deactivate': p.isActive }"
                        @click="toggleActive(p)"
                      >
                        {{ p.isActive ? 'Deactivate' : 'Activate' }}
                      </button>
                    </td>
                    <td class="cell-center">
                      <button type="button" class="btn-delete" @click="confirmDelete(p)">Delete</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div v-else-if="!loading.fetching" class="empty-pricing">
            No pricing plans configured.
          </div>
        </div>

        <div v-else class="empty-detail">
          Select a raw product to manage its pricing.
        </div>

        <div v-if="error" class="error-message">{{ error }}</div>
      </div>
    </div>

    <!-- Delete Modal -->
    <teleport to="body">
      <DeleteConfirmationModal
        v-if="deleteTarget"
        :target-label="`${deleteTarget?.months}`"
        :loading="loading.deleting"
        @confirm="performDelete"
        @cancel="cancelDelete"
      />
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRawProducts } from '@/composables/sysadmin/useRawProducts';
import { useProductPricing } from '@/composables/business/useProductPricing';
import type { ProductPricingItem } from '@/api/busines/productPricing';
import DeleteConfirmationModal from '../components/modals/Delete.vue';

const { rawProducts, fetchRawProducts } = useRawProducts();
const { pricings, fetchByRawProduct, addBatch, updateItem, removeItem, loading, error } = useProductPricing();

const selectedProductId = ref<string | null>(null);
const deleteTarget = ref<ProductPricingItem | null>(null);

const newPricings = ref<Array<{ months: number; price: number; backupPrice?: number | null }>>([
  { months: 1, price: 0, backupPrice: null }
]);
const formErrors = ref<Array<{ months?: string; price?: string; backupPrice?: string }>>(
  newPricings.value.map(() => ({ months: '', price: '', backupPrice: '' }))
);

const selectedProduct = computed(() =>
  rawProducts.value.find(p => p.id === selectedProductId.value)
);

onMounted(() => fetchRawProducts());

watch(selectedProductId, id => {
  if (id) {
    fetchByRawProduct(id);
    newPricings.value = [{ months: 1, price: 0, backupPrice: null }];
    formErrors.value = [{ months: '', price: '', backupPrice: '' }];
  } else {
    pricings.value = [];
  }
});

const formatPrice = (value: number) => new Intl.NumberFormat('id-ID').format(value);
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const selectProduct = (id: string) => { selectedProductId.value = id };
const addNewPricing = () => {
  newPricings.value.push({ months: 1, price: 0, backupPrice: null });
  formErrors.value.push({ months: '', price: '', backupPrice: '' });
};
const removeNewPricing = (idx: number) => {
  if (newPricings.value.length > 1) {
    newPricings.value.splice(idx, 1);
    formErrors.value.splice(idx, 1);
  }
};

// --- Validation ---
const validateBatch = (): boolean => {
  let valid = true;
  formErrors.value = newPricings.value.map((item) => {
    const errors: { months?: string; price?: string; backupPrice?: string } = {};
    if (item.months < 1) { errors.months = 'Duration must be at least 1 month'; valid = false; }
    if (item.price < 1) { errors.price = 'Price must be at least 1'; valid = false; }
    if (item.backupPrice != null && item.backupPrice < 0) { errors.backupPrice = 'Backup price cannot be negative'; valid = false; }
    return errors;
  });
  return valid;
};

// --- Save batch ---
const saveBatch = async () => {
  if (!selectedProductId.value) return;
  if (!validateBatch()) return;

  const batch = newPricings.value.map(i => ({ ...i, backupPrice: i.backupPrice ?? null }));

  try {
    // Tambahkan batch
    await addBatch(selectedProductId.value, batch);

    // Fetch pricings terbaru agar list langsung update
    await fetchByRawProduct(selectedProductId.value);

    // Reset form
    newPricings.value = [{ months: 1, price: 0, backupPrice: null }];
    formErrors.value = [{ months: '', price: '', backupPrice: '' }];
  } catch (err) {
    console.error(err);
  }
};

// --- Toggle Active ---
const toggleActive = async (item: ProductPricingItem) => {
  try {
    // Update status di backend
    await updateItem(item.id, { isActive: !item.isActive });

    // Update langsung di list secara reactive
    pricings.value = pricings.value.map(p =>
      p.id === item.id ? { ...p, isActive: !p.isActive } : p
    );
  } catch (err) {
    console.error(err);
  }
};


// --- Delete ---
const confirmDelete = (item: ProductPricingItem) => { deleteTarget.value = item; };
const cancelDelete = () => { deleteTarget.value = null; };
const performDelete = async () => {
  if (deleteTarget.value) {
    await removeItem(deleteTarget.value.id, selectedProductId.value || undefined);
    pricings.value = pricings.value.filter(p => p.id !== deleteTarget.value!.id);
    cancelDelete();
  }
};
</script>


<style scoped>
/* === FOUNDATION === */
.workspace {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #F7F5FF;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  color: #1e293b;
  overflow: hidden;
}

/* === TOP BAR === */
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 32px 40px 24px;
  background: white;
  border-bottom: 1px solid #eae8f8;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(0,0,0,0.03);
}
.page-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0;
  color: #1e293b;
  letter-spacing: -0.02em;
}
.page-subtitle {
  font-size: 15px;
  color: #6b7280;
  margin: 6px 0 0;
}

/* === MAIN LAYOUT === */
.main-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
  padding: 0 32px 32px;
  gap: 24px;
}

/* === PRODUCTS PANE === */
.products-pane {
  width: 300px;
  background: white;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 12px rgba(0,0,0,0.04);
  overflow: hidden;
}
.pane-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 20px;
  border-bottom: 1px solid #f5f3ff;
}
.pane-header h2 {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  color: #1e293b;
}
.badge {
  background: #f0ecff;
  color: #7E57C2;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
}
.products-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}
.product-item {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  margin: 6px 0;
  border-radius: 14px;
  cursor: pointer;
  background: #faf9ff;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}
.product-item:hover {
  background: #f5f3ff;
  border-color: #ede9ff;
}
.product-item.active {
  background: #f0ecff;
  border-color: #d1c4e9;
  border-left: 4px solid #7E57C2;
}
.product-icon {
  font-size: 22px;
  margin-right: 14px;
  width: 28px;
  text-align: center;
  opacity: 0.9;
}
.product-name {
  font-weight: 600;
  font-size: 15px;
  color: #1e293b;
}
.empty-products {
  padding: 32px 20px;
  text-align: center;
  color: #9491b0;
}

/* === DETAIL PANE === */
.detail-pane {
  flex: 1;
  background: white;
  border-radius: 20px;
  padding: 32px;
  overflow: auto;
  box-shadow: 0 4px 12px rgba(0,0,0,0.04);
}
.section-header h2 {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  color: #1e293b;
}
.detail-content {
  margin-top: 24px;
}
.empty-detail, .empty-pricing {
  color: #9491b0;
  font-style: italic;
  padding: 28px 0;
  font-size: 15px;
}
/* === PRICING FORM === */
.pricing-form h3 {
  font-size: 18px;
  margin-bottom: 20px;
  color: #1e293b;
  font-weight: 600;
}

.duration-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  align-items: flex-end;
}

.form-group {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.form-group label {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 6px;
  color: #475569;
}

.form-input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #e2dfff;
  border-radius: 10px;
  font-size: 14px;
  background: #faf9ff;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #7E57C2;
  box-shadow: 0 0 0 3px rgba(126, 87, 194, 0.1);
}

/* Error message under inputs */
.error-text {
  color: #ef4444;
  font-size: 12px;
  margin-top: 4px;
}

/* Remove button for additional durations */
.btn-remove {
  width: 32px;
  height: 32px;
  border: none;
  background: #fee2e2;
  color: #ef4444;
  border-radius: 50%;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 12px;
}

.btn-text {
  background: none;
  border: none;
  color: #7E57C2;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  padding: 6px 0;
}

.btn-text:hover {
  color: #6A5BEF;
  text-decoration: underline;
}

.btn-primary {
  background-color: #7E57C2;
  color: #fff;
  border: none;
  padding: 8px 16px;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover {
  background-color: #6A5BEF;
}

/* === TABLE IMPROVEMENTS === */
.pricing-table-container h3 {
  font-size: 18px;
  margin: 32px 0 16px;
  color: #1e293b;
  font-weight: 600;
}

.table-wrapper {
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid #f0ecff;
  background: #faf9ff;
}

.pricing-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  min-width: 800px;
}

.pricing-table th,
.pricing-table td {
  padding: 14px 16px;
  text-align: left;
  border-bottom: 1px solid #f0ecff;
}

.pricing-table th {
  background: #f9f7ff;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
}

.pricing-table th.th-toggle,
.pricing-table th.th-delete {
  width: 120px;
  text-align: center;
}

.pricing-table td.cell-center {
  text-align: center;
  padding: 12px 8px;
}

/* Buttons inside table */
.btn-toggle {
  padding: 6px 12px;
  border-radius: 6px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-activate {
  background-color: #10b981;
  color: white;
}

.btn-activate:hover {
  background-color: #059669;
}

.btn-deactivate {
  background-color: #ef4444;
  color: white;
}

.btn-deactivate:hover {
  background-color: #b91c1c;
}

.btn-delete {
  background-color: #fef2f2;
  color: #ef4444;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
}

.btn-delete:hover {
  background-color: #fee2e2;
}

/* Last row without border */
.pricing-table tbody tr:last-child td {
  border-bottom: none;
}

/* Inactive row style */
.row-inactive {
  background-color: #fcfbff;
  opacity: 0.85;
}

/* Status badge */
.status-badge {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  color: white;
  text-align: center;
}

.status-active {
  background-color: #10b981;
}

.status-inactive {
  background-color: #9ca3af;
}


/* === STATUS BADGE === */
.status-badge {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}
.status-active {
  background: #dbeafe;
  color: #1d4ed8;
}
.status-inactive {
  background: #fee2e2;
  color: #dc2626;
}

/* === ACTION BUTTONS === */
.btn-toggle, .btn-delete {
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: background 0.2s, transform 0.15s;
  min-width: 90px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-activate {
  background: #dbeafe;
  color: #1d4ed8;
}
.btn-activate:hover {
  background: #bfdbfe;
}

.btn-deactivate {
  background: #fef3c7;
  color: #d97706;
}
.btn-deactivate:hover {
  background: #fde68a;
}

.btn-delete {
  background: #fee2e2;
  color: #dc2626;
}
.btn-delete:hover {
  background: #fecaca;
  transform: translateY(-1px);
}
/* Aksi tombol di tabel */
.btn-action {
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  margin-left: 6px;
  transition: background 0.2s;
}
.btn-activate {
  background: #dbeafe;
  color: #1d4ed8;
}
.btn-activate:hover {
  background: #bfdbfe;
}
.btn-deactivate {
  background: #fef3c7;
  color: #d97706;
}
.btn-deactivate:hover {
  background: #fde68a;
}
.btn-danger {
  background: #fee2e2;
  color: #dc2626;
}
.btn-danger:hover {
  background: #fecaca;
}

/* === BUTTONS === */
.btn-primary {
  padding: 10px 20px;
  background: linear-gradient(135deg, #7E57C2, #6A5BEF);
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 6px rgba(126, 87, 194, 0.2);
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
}
.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(126, 87, 194, 0.3);
}
.btn-tertiary {
  padding: 10px 20px;
  background: #f5f3ff;
  color: #6A5BEF;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
}
.btn-tertiary:hover {
  background: #ede9ff;
}

/* === MODAL === */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 7000;
}
.modal-card {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.18);
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  border-bottom: 1px solid #f5f3ff;
}
.modal-header h3 {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  color: #1e293b;
}
.modal-close {
  background: none;
  border: none;
  font-size: 22px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #a7a4c0;
  border-radius: 8px;
}
.modal-close:hover {
  background: #f5f3ff;
  color: #7E57C2;
}
.modal-body {
  padding: 32px;
}
.delete-input {
  text-align: center;
  font-weight: 700;
  letter-spacing: 0.5px;
  margin: 12px 0;
  padding: 10px;
  border: 1px solid #eae8f8;
  border-radius: 10px;
}
.delete-error {
  color: #ef4444;
  font-size: 14px;
  margin-top: 10px;
  text-align: center;
  font-weight: 600;
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  padding: 24px 32px;
  border-top: 1px solid #f5f3ff;
}

/* === ERROR === */
.error-message {
  color: #ef4444;
  margin-top: 16px;
  padding: 12px;
  background: #fef2f2;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
}

</style>