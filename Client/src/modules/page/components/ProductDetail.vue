<template>
  <div class="product-detail-page">
    <!-- Loading -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-content">
        <div class="spinner"></div>
        <p>Memuat detail produk...</p>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="error-banner">
      <i class="fas fa-exclamation-circle"></i>
      {{ error }}
    </div>

    <!-- No product -->
    <div v-else-if="!productDetail" class="empty-state">
      <i class="fas fa-box-open"></i>
      <p>Produk tidak ditemukan.</p>
    </div>

    <!-- Product Content -->
    <div v-else class="product-layout">
      <!-- Main Content -->
      <div class="main-content">
        <!-- Product Header -->
        <div class="product-header">
          <div class="product-title">
            <h1>{{ productDetail.name }}</h1>
            <p v-if="productDetail.description" class="product-description">
              {{ productDetail.description }}
            </p>
          </div>
          <div class="product-specs">
            <div class="spec-item">
              <span class="spec-value">{{ productDetail.specs.cpu }} vCPU</span>
            </div>
            <div class="spec-item">
              <span class="spec-value">{{ productDetail.specs.ram }} mb RAM</span>
            </div>
            <div class="spec-item">
              <span class="spec-value">{{ productDetail.specs.disk }} GB SSD</span>
            </div>
            <div class="spec-item">
              <span class="spec-value">{{ productDetail.specs.bandwidth }} GB</span>
            </div>
          </div>
        </div>

        <!-- Configuration Form -->
        <div class="config-section">
          <!-- Duration -->
          <div class="config-item">
            <label class="config-label">Durasi</label>
            <div class="select-wrapper">
              <select v-model="selectedDuration" class="form-select">
                <option v-for="opt in durationOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>
          </div>

          <!-- Backup -->
          <div v-if="hasBackupPolicy()" class="config-item">
            <label class="checkbox-container">
              <input type="checkbox" v-model="enableBackup" :disabled="!hasBackupPolicy()" />
              <span class="checkmark"></span>
              <span class="checkbox-label-text">
                Aktifkan backup harian otomatis
                <span class="backup-price">(+ Rp{{ getBackupPrice().toLocaleString() }}/bln)</span>
              </span>
            </label>
          </div>

          <!-- Region -->
          <div class="config-item">
            <label class="config-label">Server Region</label>
            <div class="select-wrapper">
              <select v-model="selectedRegion" class="form-select">
                <option v-for="region in getRegions()" :key="region" :value="region">
                  {{ region }}  {{ getLatencyInfo(region) }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <!-- Template Selection -->
        <div class="template-section">
          <h2 class="section-title">Pilih Template</h2>

          <!-- Categories Tabs -->
          <div v-if="categories.length > 0" class="category-tabs">
            <button
              v-for="category in categories"
              :key="category.id"
              :class="{ active: activeCategoryId === category.id }"
              @click="switchCategory(category.id)"
            >
              {{ category.name }}
            </button>
          </div>

          <!-- Groups -->
          <div v-if="groupsInActiveCategory.length > 0" class="groups-grid">
            <div
              v-for="group in groupsInActiveCategory"
              :key="group.id"
              class="group-card"
              @click="openGroupModal(group)"
            >
              <div class="group-name">{{ group.name }}</div>
              <div class="group-count">
                {{ group.templates?.length || 0 }} template{{ (group.templates?.length || 0) > 1 ? 's' : '' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Order Summary -->
      <div class="order-summary">
        <div class="summary-header">
          <h3>Daftar Pesanan</h3>
        </div>
        <div class="summary-body">
          <div class="summary-item">
            <span>Produk</span>
            <strong>{{ productDetail.name }}</strong>
          </div>
          <div class="summary-item">
            <span>Durasi</span>
            <span>{{ selectedDuration }} Bulan</span>
          </div>
          <div v-if="selectedTemplate" class="summary-item">
            <span>Template</span>
            <span>{{ selectedTemplate.name }}</span>
          </div>
          <div v-if="enableBackup" class="summary-item">
            <span>Backup</span>
            <span>+Rp{{ (getBackupPrice() * selectedDuration).toLocaleString() }}</span>
          </div>
          <div v-if="totalPrice > 0" class="summary-total">
            <span>Total Harga</span>
            <strong>Rp{{ totalPrice.toLocaleString() }}</strong>
          </div>
          <div v-if="pricePerMonthComputed > 0" class="summary-ppm">
            <span>Harga per bulan</span>
            <strong>Rp{{ pricePerMonthComputed.toLocaleString() }}</strong>
          </div>
        </div>
        <div class="summary-footer">
          <button class="btn-primary" :disabled="!selectedTemplate" @click="handleOrder">
            Lanjutkan
          </button>
        </div>
      </div>
    </div>

    <!-- Group Template Modal -->
    <teleport to="body">
      <div v-if="groupModal.group" class="modal-overlay" @click="closeGroupModal">
        <div class="modal-card" @click.stop>
          <div class="modal-header">
            <h3>Pilih Template: {{ groupModal.group.name }}</h3>
            <button class="modal-close" @click="closeGroupModal">×</button>
          </div>
          <div class="modal-body">
            <div class="form-item">
              <label class="form-label">Template</label>
              <div class="select-wrapper">
                <select
                  v-model="selectedTemplateInModal"
                  class="form-select"
                  @change="onTemplateSelect"
                >
                  <option value="">— Pilih template —</option>
                  <option
                    v-for="template in groupModal.group.templates || []"
                    :key="template.id"
                    :value="template.id"
                  >
                    {{ template.name }} ({{ template.os }})
                  </option>
                </select>
              </div>
            </div>

            <div v-if="previewTemplate" class="template-preview mt-4">
              <div class="template-icon">🖥️</div>
              <div>
                <div class="template-name">{{ previewTemplate.name }}</div>
                <div class="template-os">{{ previewTemplate.os }}</div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="closeGroupModal">Batal</button>
            <button
              class="btn-primary"
              :disabled="!selectedTemplateInModal"
              @click="confirmTemplateFromModal"
            >
              Konfirmasi
            </button>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useProductDetail } from '@/composables/useProductDetail';

const route = useRoute();
const router = useRouter();

const {
  productDetail,
  loading,
  error,
  fetchProductDetail,
  selectedDuration,
  getPricingOptions,
  hasBackupPolicy,
  getBackupPrice,
  getRegions,
  getLatencyInfo,
} = useProductDetail();

// ------------------------
// State
// ------------------------
const selectedRegion = ref<string>('');
const enableBackup = ref(false);
const activeCategoryId = ref<string>('');
const selectedTemplate = ref<any>(null);

// Modal state
const groupModal = ref<{ group: any | null }>({ group: null });
const selectedTemplateInModal = ref<string>('');
const previewTemplate = ref<any>(null);

// ------------------------
// Computed
// ------------------------
const durationOptions = computed(() => 
  getPricingOptions().map(opt => ({ value: opt.value, label: `${opt.value} Bulan` }))
);

const categories = computed(() => productDetail.value?.categories || []);
const groupsInActiveCategory = computed(() => {
  const category = categories.value.find(cat => cat.id === activeCategoryId.value);
  return category?.groups || [];
});

const totalPrice = computed(() => {
  const pricing = getPricingOptions().find(p => p.value === selectedDuration.value);
  const base = pricing?.price || 0;
  const backupTotal = enableBackup.value && selectedDuration.value ? getBackupPrice() * selectedDuration.value : 0;
  return base + backupTotal;
});

const pricePerMonthComputed = computed(() => {
  if (!selectedDuration.value || selectedDuration.value <= 0) return 0;
  return Math.round(totalPrice.value / selectedDuration.value);
});

// ------------------------
// Watchers
// ------------------------
watch(productDetail, val => {
  if (val?.regions?.length) selectedRegion.value = val.regions[0]!;
});

watch(categories, newCategories => {
  const [firstCategory] = newCategories;
  if (firstCategory && !activeCategoryId.value) activeCategoryId.value = firstCategory.id;
}, { immediate: true });

// ------------------------
// Functions
// ------------------------
const switchCategory = (id: string) => {
  activeCategoryId.value = id;
  selectedTemplate.value = null;
};

const openGroupModal = (group: any) => {
  groupModal.value.group = group;
  selectedTemplateInModal.value = '';
  previewTemplate.value = null;
};

const closeGroupModal = () => {
  groupModal.value.group = null;
  selectedTemplateInModal.value = '';
  previewTemplate.value = null;
};

const onTemplateSelect = () => {
  const id = selectedTemplateInModal.value;
  if (!id || !groupModal.value.group) {
    previewTemplate.value = null;
    return;
  }
  const template = (groupModal.value.group.templates || []).find((t: any) => t.id === id);
  previewTemplate.value = template || null;
};

const confirmTemplateFromModal = () => {
  if (previewTemplate.value) selectedTemplate.value = previewTemplate.value;
  closeGroupModal();
};

// Redirect ke checkout / billing address
const handleOrder = () => {
  if (!selectedTemplate.value) return;

  router.push({
    path: '/client/billing-address',
    query: {
      publicId: productDetail.value?.publicId,
      pricingId: selectedDuration.value?.toString(),
      templateId: selectedTemplate.value.id,
      region: selectedRegion.value,
      backupEnabled: enableBackup.value ? '1' : '0',
    },
  });
};

// ------------------------
// Fetch product detail
// ------------------------
onMounted(() => {
  const publicId = route.params.publicId;
  if (typeof publicId === 'string' && publicId.trim()) {
    fetchProductDetail(publicId.trim());
  } else {
    error.value = 'ID produk tidak valid';
  }
});
</script>






<style scoped>

/* ===============================
   GLOBAL HELPERS
================================ */
:root {
  --primary: #6366f1;
  --primary-soft: #eef2ff;
  --border-soft: #e5e7eb;
  --text-main: #1e293b;
  --text-muted: #64748b;
  --bg-card: #ffffff;
  --bg-soft: #f8fafc;
}

.mt-4 {
  margin-top: 1rem;
}

/* ===============================
   GROUP CARD
================================ */
.group-card {
  padding: 1.25rem;
  border: 1px solid var(--border-soft);
  border-radius: 14px;
  cursor: pointer;
  background: linear-gradient(180deg, #ffffff, #fafaff);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.15s ease;
}

.group-card:hover {
  background: var(--primary-soft);
  border-color: #c7d2fe;
  box-shadow: 0 6px 18px rgba(99, 102, 241, 0.12);
  transform: translateY(-2px);
}

.group-card:active {
  transform: translateY(0);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
}

.group-name {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-main);
  margin: 0;
}

.group-count {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin: 0;
}

/* ===============================
   FORM / MODAL
================================ */
.form-item {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text-main);
  font-size: 0.85rem;
  letter-spacing: 0.02em;
}

/* ===============================
   TEMPLATE PREVIEW
================================ */
.template-preview {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: linear-gradient(180deg, #f8faff, #eef2ff);
  border-radius: 14px;
  border: 1px solid #e0e7ff;
  transition:
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.template-preview:hover {
  border-color: #c7d2fe;
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.15);
}

.template-icon {
  font-size: 1.6rem;
  color: var(--primary);
  flex-shrink: 0;
}

.template-name {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--text-main);
  margin-bottom: 0.15rem;
}

.template-os {
  font-size: 0.75rem;
  color: var(--text-muted);
}

/* ===============================
   OPTIONAL: SMOOTH FOCUS (INPUT / SELECT)
================================ */
input:focus,
select:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25);
}

/* ===============================
   OPTIONAL: BUTTON ENHANCEMENT
================================ */
button {
  transition:
    background 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.15s ease;
}

button:hover {
  transform: translateY(-1px);
}

button:active {
  transform: translateY(0);
}

/* ========== GLOBAL ========== */
.product-detail-page {
  min-height: 100vh;
  background: #ebebee;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #1e293b;
  padding: 2rem;
}

/* ========== LOADING & ERROR ========== */
.loading-overlay {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
}
.loading-content {
  text-align: center;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(106, 91, 239, 0.3);
  border-top: 3px solid #6A5BEF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.error-banner {
  background: #fef2f2;
  color: #dc2626;
  padding: 1rem;
  border-radius: 8px;
  margin: 2rem 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #94a3b8;
}
.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #cbd5e1;
}

/* ========== LAYOUT ========== */
.product-layout {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* ========== MAIN CONTENT ========== */
.main-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Header */
.product-header {
  background: hsl(0, 0%, 100%);
  border-radius: 16px;
  padding: 2rem;
  border: 1px solid #ede9ff;
}
.product-title h1 {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 0.5rem;
  color: #000000;
}
.product-description {
  color: #000000;
  margin: 0;
  font-size: 1rem;
}
.product-specs {
  display: flex;
  gap: 1.5rem;
  margin-top: 1.5rem;
  flex-wrap: wrap;
}
.spec-item {
  background: white;
  padding: 0.75rem 1.25rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  font-weight: 600;
  font-size: 0.875rem;
  min-width: 120px;
  text-align: center;
}

/* Configuration */
.config-section {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  border: 1px solid #f0efff;
  box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.04);
}
.config-item {
  margin-bottom: 1.5rem;
}
.config-label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #1e293b;
  font-size: 0.875rem;
}
.form-select {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  font-size: 1rem;
  color: #1e293b;
}
.form-select:focus {
  outline: none;
  border-color: #6A5BEF;
  box-shadow: 0 0 0 3px rgba(106, 91, 239, 0.15);
}
.select-wrapper {
  position: relative;
}

/* Checkbox */
.checkbox-container {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  cursor: pointer;
}
.checkbox-container input {
  opacity: 0;
  position: absolute;
}
.checkmark {
  width: 20px;
  height: 20px;
  border: 2px solid #cbd5e1;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.checkbox-container input:checked + .checkmark {
  background: #6A5BEF;
  border-color: #6A5BEF;
}
.checkbox-container input:checked + .checkmark::after {
  content: '✓';
  color: white;
  font-size: 12px;
  font-weight: bold;
}
.checkbox-label-text {
  font-size: 0.875rem;
  color: #1e293b;
  line-height: 1.5;
}
.backup-price {
  color: #6A5BEF;
  font-weight: 600;
}

/* Template Section */
.template-section {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  border: 1px solid #f0efff;
  box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.04);
}
.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 1.5rem;
  color: #1e293b;
}

/* Category Tabs */
.category-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}
.category-tabs button {
  padding: 0.5rem 1rem;
  background: #f5f4ff;
  border: 1px solid #ede9ff;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.875rem;
  color: #6A5BEF;
  cursor: pointer;
  transition: all 0.2s;
}
.category-tabs button:hover {
  background: #ede9ff;
}
.category-tabs button.active {
  background: #6A5BEF;
  color: white;
  border-color: #6A5BEF;
}

/* Groups & Templates */
.groups-grid,
.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 1rem;
}
.group-card,
.template-card {
  padding: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  background: #fafaff;
}
.group-card:hover,
.template-card:hover {
  background: #f5f4ff;
  border-color: #ede9ff;
}
.group-card.active,
.template-card.selected {
  background: #f0efff;
  border-color: #6A5BEF;
  box-shadow: 0 0 0 2px rgba(106, 91, 239, 0.2);
}
.group-name,
.template-name {
  font-weight: 600;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
  color: #1e293b;
}
.template-os {
  font-size: 0.75rem;
  color: #64748b;
}
.template-icon {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  text-align: center;
}

/* ========== ORDER SUMMARY ========== */
.order-summary {
  background: white;
  border-radius: 16px;
  border: 1px solid #f0efff;
  box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.04);
  position: sticky;
  top: 2rem;
  height: fit-content;
  max-height: calc(100vh - 4rem);
  overflow-y: auto;
}
.summary-header {
  padding: 1.5rem;
  border-bottom: 1px solid #f0efff;
}
.summary-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
  color: #1e293b;
}
.summary-body {
  padding: 1.5rem;
}
.summary-item,
.summary-total,
.summary-ppm {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}
.summary-item span:first-child,
.summary-total span:first-child,
.summary-ppm span:first-child {
  color: #64748b;
}
.summary-total {
  padding-top: 1rem;
  border-top: 1px solid #f0efff;
  margin-top: 1rem;
  font-weight: 700;
  font-size: 1rem;
}
.summary-ppm {
  color: #6A5BEF;
  font-weight: 600;
}
.summary-footer {
  padding: 1.5rem;
  border-top: 1px solid #f0efff;
}
.btn-primary {
  width: 100%;
  padding: 0.75rem;
  background: #6A5BEF;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-primary:hover:not(:disabled) {
  background: #5a4dbd;
}
.btn-primary:disabled {
  background: #e2e8f0;
  cursor: not-allowed;
}

/* ========== MODAL ========== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.modal-card {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 480px;
  border: 1px solid #f0efff;
  box-shadow: 0 20px 50px -10px rgba(0, 0, 0, 0.2);
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
}
.modal-close {
  background: none;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  cursor: pointer;
  transition: background 0.2s;
}
.modal-close:hover {
  background: #f5f4ff;
  color: #6A5BEF;
}
.modal-body {
  padding: 2rem;
}
.template-preview {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.modal-footer {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #f0efff;
  justify-content: flex-end;
}
.btn-secondary {
  padding: 0.625rem 1.25rem;
  background: #f5f4ff;
  color: #6A5BEF;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}
.btn-secondary:hover {
  background: #ede9ff;
}

/* ========== RESPONSIVE ========== */
@media (max-width: 1024px) {
  .product-layout {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  .order-summary {
    position: static;
    max-height: none;
  }
}
@media (max-width: 640px) {
  .product-detail-page {
    padding: 1.5rem;
  }
  .product-header,
  .config-section,
  .template-section {
    padding: 1.5rem;
  }
}
</style>