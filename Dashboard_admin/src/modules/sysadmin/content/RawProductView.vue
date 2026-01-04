<template>
  <div class="workspace">
    <!-- Top Bar -->
    <div class="top-bar">
      <div class="top-left">
        <h3 class="page-title">Products Management</h3>
        <p class="page-subtitle">Manage base configurations and assign to template categories</p>
      </div>
      <div class="top-controls">
        <div class="search-box">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="7" cy="7" r="5.5"/>
            <path d="m11 11 2 2"/>
          </svg>
          <input
            type="text"
            class="search-input"
            v-model="searchQuery"
            placeholder="Search products (name, specs)..."
          />
        </div>
        <button class="btn-primary" @click="openCreateModal">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M8 4v8M4 8h8"/>
          </svg>
          Add Product
        </button>
      </div>
    </div>

    <!-- Main Layout -->
    <div class="main-layout">
      <!-- Products List -->
      <div class="products-pane">
        <div class="pane-header">
          <h2>Products</h2>
          <span class="badge">{{ filteredProducts.length }} products</span>
        </div>
        <div class="products-list">
          <div 
            v-for="product in filteredProducts" 
            :key="product.id"
            class="product-item"
            :class="{ 'active': selectedProduct?.id === product.id }"
            @click="selectProduct(product)"
          >
            <div class="product-icon">🧊</div>
            <div class="product-info">
              <div class="product-name">{{ product.name }}</div>
              <div class="product-specs">
                {{ product.cpu }} Core{{ product.cpu > 1 ? 's' : '' }} •
                {{ formatRam(product.ram) }} •
                {{ formatDisk(product.disk) }} •
                {{ product.bandwidth }} GB
              </div>
            </div>
            <div class="product-actions">
              <button 
                class="icon-btn" 
                @click.stop="openEditModal(product)"
                title="Edit product"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M12.5 2.5a1 1 0 0 1 3 3L6.5 14.5l-4 1 1-4L12.5 2.5z"/>
                </svg>
              </button>
              <button 
                class="icon-btn danger" 
                @click.stop="confirmDelete(product.id)"
                title="Delete product"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M4 5h8M10 5v9H6V5M5 5V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </button>
            </div>
          </div>
          <div v-if="filteredProducts.length === 0" class="empty-products">
            <p>No products found.</p>
          </div>
        </div>
      </div>

      <!-- Detail Pane -->
      <div class="detail-pane narrow-section">
        <div class="section-header">
          <h2>{{ selectedProduct ? selectedProduct.name : 'Select a Product' }}</h2>
        </div>
        <div v-if="selectedProduct" class="detail-content">
          <div class="detail-row">
            <span class="detail-label">CPU:</span>
            <span>{{ selectedProduct.cpu }} Core{{ selectedProduct.cpu > 1 ? 's' : '' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">RAM:</span>
            <span>{{ formatRam(selectedProduct.ram) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Disk:</span>
            <span>{{ formatDisk(selectedProduct.disk) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Bandwidth:</span>
            <span>{{ selectedProduct.bandwidth }} GB/month</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Backup Policy:</span>
            <span>{{ selectedBackupPolicyName }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Categories:</span>
            <div class="category-list">
              <span
                v-for="name in selectedCategoryNames"
                :key="name"
                class="category-badge"
              >
                {{ name }}
              </span>
              <span v-if="selectedCategoryNames.length === 0" class="text-muted">
                None assigned
              </span>
            </div>
          </div>
        </div>
        <div v-else class="empty-detail">
          Select a product to view details.
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-card">
          <div class="modal-header">
            <h3>{{ editing ? 'Edit Raw Product' : 'Create Raw Product' }}</h3>
            <button class="modal-close" @click="closeModal">×</button>
          </div>
          <form class="modal-body" @submit.prevent="saveProduct">
            <div class="form-grid">
              <div class="form-group">
                <label>Name *</label>
                <input v-model="form.name" type="text" class="form-input" required />
              </div>
              <div class="form-group">
                <label>CPU (Cores) *</label>
                <input v-model.number="form.cpu" type="number" min="1" class="form-input" required />
              </div>
              <div class="form-group">
                <label>RAM (MB) *</label>
                <input v-model.number="form.ram" type="number" min="128" step="128" class="form-input" required />
                <p class="form-hint">Enter RAM in Megabytes (e.g., 2048 = 2 GB)</p>
              </div>
              <div class="form-group">
                <label>Disk (GB) *</label>
                <input v-model.number="form.disk" type="number" min="10" class="form-input" required />
              </div>
              <div class="form-group">
                <label>Bandwidth (GB/month) *</label>
                <input v-model.number="form.bandwidth" type="number" min="1" class="form-input" required />
              </div>
              <div class="form-group">
                <label>Backup Policy</label>
                <select v-model="form.backupPolicyId" class="form-input">
                  <option :value="null">-- None --</option>
                  <option v-for="bp in backupPolicies" :key="bp.id" :value="bp.id">
                    {{ bp.name }}
                  </option>
                </select>
              </div>
              <div class="form-group full-width">
                <label>Template Categories</label>
                <div class="category-checkboxes">
                  <label v-for="cat in templateCategories" :key="cat.id" class="checkbox-item">
                    <input
                      type="checkbox"
                      :value="cat.id"
                      v-model="form.templateCategoryIds"
                    />
                    {{ cat.name }}
                  </label>
                </div>
                <p v-if="templateCategories.length === 0" class="text-muted">
                  No categories available. Create one in Template Management.
                </p>
              </div>
            </div>

            <div v-if="error" class="form-error">{{ error }}</div>

            <div class="modal-footer">
              <button type="button" class="btn-tertiary" @click="closeModal">Cancel</button>
              <button type="submit" class="btn-primary" :disabled="loading">
                {{ loading ? 'Saving...' : (editing ? 'Update Product' : 'Create Product') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </teleport>

    <!-- Delete Confirmation -->
    <teleport to="body">
      <div v-if="deleteConfirmId" class="modal-overlay" @click.self="cancelDelete">
        <div class="modal-card">
          <div class="modal-header">
            <h3>Confirm Deletion</h3>
            <button class="modal-close" @click="cancelDelete">×</button>
          </div>
          <div class="modal-body">
            <p>Type <strong class="delete-keyword">delete</strong> below to confirm deletion.</p>
            <div class="delete-instruction">delete</div>
            <input
              v-model="deleteConfirmText"
              type="text"
              class="form-input delete-input"
              placeholder="Type 'delete'"
            />
            <div v-if="deleteConfirmText && deleteConfirmText !== 'delete'" class="delete-error">
              You must type exactly: <strong>delete</strong>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-tertiary" @click="cancelDelete">Cancel</button>
            <button
              class="btn-danger"
              :disabled="deleteConfirmText !== 'delete' || loading"
              @click="attemptDelete"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRawProducts } from '@/composables/sysadmin/useRawProducts';
import { useHypervisors } from '@/composables/sysadmin/useHypervisors';
import { useBackupPolicy } from '@/composables/sysadmin/useBackupPolicy';

// === Composables ===
const {
  rawProducts,
  selectedProduct,
  loading,
  error: fetchError,
  fetchRawProducts,
  addRawProduct,
  updateRawProductById,
  deleteRawProductById,
} = useRawProducts();

const { templateCategories, fetchTemplateCategories } = useHypervisors();
const { policies: backupPolicies, fetchPolicies } = useBackupPolicy();

// === UI State ===
const searchQuery = ref('');
const showModal = ref(false);
const editing = ref(false);
const deleteConfirmId = ref<string | null>(null);
const deleteConfirmText = ref('');
const currentEditId = ref<string | null>(null);

// === Form State ===
const form = ref({
  name: '',
  cpu: 2,
  ram: 2048, // default dalam MB
  disk: 50,
  bandwidth: 100,
  backupPolicyId: null as string | null,
  templateCategoryIds: [] as string[],
});

// === Error Aggregation ===
const error = computed(() => fetchError.value);

// === Fetch Data on Mount ===
onMounted(async () => {
  await Promise.all([
    fetchRawProducts(),
    fetchTemplateCategories(),
    fetchPolicies(),
  ]);
});

// === Filter Products ===
const filteredProducts = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  return rawProducts.value.filter(p =>
    p.name?.toLowerCase().includes(q) ||
    String(p.cpu).includes(q) ||
    String(p.ram).includes(q) ||
    String(p.disk).includes(q) ||
    String(p.bandwidth).includes(q)
  );
});

// === ✅ FORMAT RAM (MB → GB) ===
const formatRam = (mb: number): string => {
  if (!mb) return '0 MB';
  if (mb >= 1024 && mb % 1024 === 0) {
    return `${mb / 1024} GB`;
  }
  return `${mb} MB`;
};

// === ✅ FORMAT DISK (GB with unit) ===
const formatDisk = (gb: number): string => {
  if (!gb) return '0 GB';
  return `${gb} GB SSD`;
};

// === ✅ Ambil nama kategori langsung dari API ===
// Definisikan tipe kategori jika belum ada
interface CategoryRelation {
  templateCategory?: {
    name?: string;
  };
}

// === ✅ Ambil nama kategori langsung dari API ===
const selectedCategoryNames = computed(() => {
  if (!selectedProduct.value) return [];

  const categories: CategoryRelation[] = selectedProduct.value.categories || [];

  return categories
    .map(rel => rel.templateCategory?.name)
    .filter((name): name is string => name != null); // type guard untuk string[]
});


// === ✅ Ambil nama backup policy ===
const selectedBackupPolicyName = computed(() => {
  const policy = selectedProduct.value?.backupPolicy;
  return policy?.name || '—';
});

// === UI Methods ===
const selectProduct = (product: any) => {
  selectedProduct.value = product;
};

const openCreateModal = () => {
  editing.value = false;
  currentEditId.value = null;
  form.value = {
    name: '',
    cpu: 2,
    ram: 2048,
    disk: 50,
    bandwidth: 100,
    backupPolicyId: null,
    templateCategoryIds: [],
  };
  showModal.value = true;
};

const openEditModal = (product: any) => {
  editing.value = true;
  currentEditId.value = product.id;
  const categoryIds = (product.categories || []).map((rel: any) => rel.templateCategoryId);
  form.value = {
    name: product.name || '',
    cpu: product.cpu || 2,
    ram: product.ram || 2048,      // API: dalam MB
    disk: product.disk || 50,      // API: dalam GB
    bandwidth: product.bandwidth || 100,
    backupPolicyId: product.backupPolicyId || null,
    templateCategoryIds: categoryIds,
  };
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  fetchError.value = null;
};

const saveProduct = async () => {
  const payload = {
    name: form.value.name.trim(),
    cpu: form.value.cpu,
    ram: form.value.ram,          // Kirim dalam MB (sesuai API)
    disk: form.value.disk,        // Kirim dalam GB
    bandwidth: form.value.bandwidth,
    backupPolicyId: form.value.backupPolicyId,
    templateCategoryIds: form.value.templateCategoryIds || [],
  };

  try {
    if (editing.value && currentEditId.value) {
      await updateRawProductById(currentEditId.value, payload);
    } else {
      await addRawProduct(payload);
    }
    closeModal();
  } catch (err) {
    // Error akan muncul di `error`
  }
};

const confirmDelete = (id: string) => {
  deleteConfirmId.value = id;
  deleteConfirmText.value = '';
};

const cancelDelete = () => {
  deleteConfirmId.value = null;
  deleteConfirmText.value = '';
};

const attemptDelete = async () => {
  if (deleteConfirmText.value === 'delete' && deleteConfirmId.value) {
    try {
      await deleteRawProductById(deleteConfirmId.value);
      if (selectedProduct.value?.id === deleteConfirmId.value) {
        selectedProduct.value = null;
      }
    } catch (err) {
      // Error ditangani di composable
    } finally {
      cancelDelete();
    }
  }
};
</script>

<style scoped>
/* ========== FOUNDATION ========== */
.workspace {
  height: 93vh;
  display: flex;
  flex-direction: column;
  background: #ffffff; /* ✅ Lebih profesional */
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #1e293b;
  overflow: hidden;
}

/* ========== TOP BAR ========== */
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.75rem 2.5rem;
  background: #ffffff;
  border-bottom: 1px solid #f0efff;
  flex-shrink: 0;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.04);
}
.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0;
  color: #1e293b;
  letter-spacing: -0.02em;
}
.page-subtitle {
  font-size: 1rem;
  color: #64748b;
  margin: 0.375rem 0 0;
  font-weight: 400;
}
.top-controls {
  display: flex;
  gap: 1.25rem;
  align-items: center;
}
.search-box {
  position: relative;
  min-width: 300px;
}
.search-box svg {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6A5BEF;
  pointer-events: none;
}
.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 1rem;
  background: #fafaff;
  transition: all 0.2s;
}
.search-input:focus {
  outline: none;
  border-color: #6A5BEF;
  box-shadow: 0 0 0 3px rgba(106, 91, 239, 0.15);
}

/* ========== MAIN LAYOUT ========== */
.main-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
  padding: 0 2.5rem 2.5rem;
  gap: 1.5rem;
}

/* ========== PRODUCTS PANE ========== */
.products-pane {
  width: 360px;
  background: #ffffff;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 16px -2px rgba(91, 62, 150, 0.06);
  border: 1px solid #f0efff;
  overflow: hidden;
}
.pane-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #f0efff;
}
.pane-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  color: #1e293b;
}
.badge {
  background: #f0efff;
  color: #6A5BEF;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
}
.products-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem;
}
.product-item {
  display: flex;
  align-items: center;
  padding: 1rem;
  margin: 0.5rem 0;
  border-radius: 12px;
  cursor: pointer;
  background: #fafaff;
  transition: all 0.2s;
  border: 1px solid transparent;
  position: relative;
}
.product-item:hover {
  background: #f5f4ff;
  border-color: #eae8ff;
}
.product-item.active {
  background: #f0efff;
  border-color: #d1c4e9;
  border-left: 4px solid #6A5BEF;
}
.product-icon {
  font-size: 1.25rem;
  margin-right: 1rem;
  width: 28px;
  text-align: center;
  opacity: 0.9;
}
.product-info {
  flex: 1;
  min-width: 0;
}
.product-name {
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 0.25rem;
  color: #1e293b;
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.product-specs {
  font-size: 0.875rem;
  color: #716a91;
  line-height: 1.4;
}
.product-actions {
  display: flex;
  gap: 0.5rem;
  opacity: 0;
  transition: opacity 0.2s;
}
.product-item:hover .product-actions {
  opacity: 1;
}
.icon-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: #a78bfa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.icon-btn:hover {
  background: #f5f4ff;
  color: #6A5BEF;
}
.danger:hover {
  color: #ef4444 !important;
  background: #fef2f2;
}
.empty-products {
  padding: 2rem 1.5rem;
  text-align: center;
  color: #94a3b8;
  font-size: 1rem;
}

/* ========== DETAIL PANE ========== */
.detail-pane {
  flex: 1;
  background: #ffffff;
  border-radius: 16px;
  padding: 2rem;
  overflow: auto;
  box-shadow: 0 4px 16px -2px rgba(91, 62, 150, 0.06);
  border: 1px solid #f0efff;
}
.section-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  color: #1e293b;
}
.detail-content {
  margin-top: 1.5rem;
}
.detail-row {
  display: flex;
  margin-bottom: 1.125rem;
  align-items: flex-start;
}
.detail-label {
  font-weight: 600;
  width: 150px;
  color: #475569;
  flex-shrink: 0;
  font-size: 0.875rem;
}
.category-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.category-badge {
  background: #f0efff;
  color: #6A5BEF;
  padding: 0.375rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
}
.text-muted {
  color: #94a3b8;
  font-style: normal;
}
.empty-detail {
  color: #94a3b8;
  font-style: italic;
  padding: 2rem 0;
  font-size: 1rem;
}

/* ========== MODALS ========== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 7000;
}
.modal-card {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 640px;
  box-shadow: 0 20px 50px -10px rgba(0, 0, 0, 0.2);
  border: 1px solid #f0efff;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #f0efff;
}
.modal-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  color: #1e293b;
}
.modal-close {
  background: none;
  border: none;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #94a3b8;
  border-radius: 8px;
  transition: background 0.2s;
}
.modal-close:hover {
  background: #f5f4ff;
  color: #6A5BEF;
}
.modal-body {
  padding: 2rem;
}
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}
@media (max-width: 600px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
.form-group {
  display: flex;
  flex-direction: column;
}
.form-group.full-width {
  grid-column: 1 / -1;
}
.form-group label {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #1e293b;
  font-size: 0.875rem;
}
.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  background: #ffffff;
  transition: all 0.2s;
}
.form-input:focus {
  outline: none;
  border-color: #6A5BEF;
  box-shadow: 0 0 0 3px rgba(106, 91, 239, 0.15);
}
.form-hint {
  font-size: 0.75rem;
  color: #716a91;
  margin-top: 0.375rem;
  font-style: italic;
}
.category-checkboxes {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 140px;
  overflow-y: auto;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fafaff;
}
.checkbox-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1rem;
  color: #1e293b;
  font-weight: 500;
}
.form-error {
  color: #ef4444;
  font-size: 0.875rem;
  margin: 1.125rem 0;
  padding: 0.75rem;
  background: #fef2f2;
  border-radius: 8px;
  border-left: 3px solid #ef4444;
  font-weight: 500;
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #f0efff;
}
.delete-instruction {
  text-align: center;
  font-weight: 700;
  color: #6A5BEF;
  margin: 1rem 0;
  font-size: 1rem;
  letter-spacing: 0.5px;
}
.delete-keyword {
  color: #6A5BEF;
  font-weight: 700;
}
.delete-input {
  text-align: center;
  font-weight: 700;
  font-size: 1rem;
  padding: 0.75rem;
  letter-spacing: 0.5px;
  font-family: monospace;
}
.delete-error {
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.75rem;
  text-align: center;
  font-weight: 600;
}

/* ========== BUTTONS ========== */
.btn-primary {
  padding: 0.75rem 1.5rem;
  background: #6A5BEF;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.625rem;
  transition: all 0.2s;
}
.btn-primary:hover:not(:disabled) {
  background: #5a4dbd;
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn-tertiary {
  padding: 0.75rem 1.5rem;
  background: #f5f4ff;
  color: #6A5BEF;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
}
.btn-tertiary:hover {
  background: #ede9ff;
}
.btn-danger {
  padding: 0.75rem 1.5rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
}
.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>