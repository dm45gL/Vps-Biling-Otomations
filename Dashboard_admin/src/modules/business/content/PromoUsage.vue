<template>
  <div class="page-wrapper">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="title">Promo Usage Log</h1>
        <p class="subtitle">Track how your promo codes are being used</p>
      </div>
    </div>

    <!-- Promo Selector -->
    <div class="card mb-6">
      <div class="form-group">
        <label>Select Promo</label>
        <select
          v-model="selectedPromoId"
          class="form-input"
          :disabled="loadingPromos"
        >
          <option value="">-- Choose a promo --</option>
          <option
            v-for="p in promos"
            :key="p.id"
            :value="p.id"
          >
            {{ p.name }} ({{ p.code }})
          </option>
        </select>
      </div>
    </div>

    <!-- Messages -->
    <div v-if="loadingPromos" class="loading-message">
      Loading promos...
    </div>
    <div v-else-if="promoError" class="error-message">
      {{ promoError }}
    </div>
    <div v-else-if="!selectedPromoId" class="info-message">
      Please select a promo to view its usage log.
    </div>
    <div v-else-if="error" class="error-message">
      {{ error }}
    </div>

    <!-- Main Content -->
    <div v-else>
      <!-- Summary -->
      <div class="card mb-6">
        <h2 class="section-title">Promo Summary</h2>
        <div v-if="loadingSummary" class="loading-message">Loading summary...</div>
        <div v-else-if="summary" class="summary-grid">
          <div class="summary-item">
            <span class="summary-label">Used Count</span>
            <span class="summary-value">{{ summary.usedCount }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Global Limit</span>
            <span class="summary-value">{{ summary.globalLimit ?? 'Unlimited' }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Remaining</span>
            <span class="summary-value">{{ summary.remaining ?? 'Unlimited' }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Unique Users</span>
            <span class="summary-value">{{ summary.uniqueUsers }}</span>
          </div>
        </div>
      </div>

      <!-- Usage Table -->
      <div class="card">
        <div class="table-header">
          <h2 class="section-title">Usage Details</h2>
          <div class="table-actions">
            <button class="btn-secondary" @click="() => fetchUsages(selectedPromoId)">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M4 10.5a6.5 6.5 0 1 0 6.5-6.5M12 13l-2-2-2 2"/>
              </svg>
              Refresh
            </button>
            <button class="btn-primary" @click="() => downloadCsv(selectedPromoId)">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M4 12V4h8l2 2v8H4z"/>
                <path d="M8 10v2M8 6v2M6 8h4"/>
              </svg>
              Download CSV
            </button>
          </div>
        </div>

        <div v-if="loadingUsages" class="loading-message">Loading usages...</div>
        <div v-else class="table-wrap">
          <table class="modern-table">
            <thead>
              <tr>
                <th>Client Email</th>
                <th>Used At</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="usage in usages" :key="usage.id">
                <td>{{ usage.client.email }}</td>
                <td class="muted">{{ formatDate(usage.usedAt) }}</td>
              </tr>
              <tr v-if="usages.length === 0">
                <td colspan="2" class="empty-row">No usages recorded yet.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { usePromoAdmin } from '@/composables/business/usePromo';
import { usePromoUsage } from '@/composables/business/usePromoUsage';

// Promo list
const {
  promos,
  loading: loadingPromos,
  error: promoError,
  fetchPromos,
} = usePromoAdmin();

// Usage data
const {
  usages,
  summary,
  loadingUsages,
  loadingSummary,
  error,
  fetchUsages,
  fetchSummary,
  downloadCsv,
} = usePromoUsage();

const selectedPromoId = ref<string>('');

// Watcher: saat promo dipilih
watch(selectedPromoId, (newId) => {
  if (newId) {
    fetchSummary(newId);
    fetchUsages(newId);
  }
});

// On mounted: hanya fetch daftar promo
fetchPromos();

// Helper: Format date
const formatDate = (iso: string) => {
  return new Date(iso).toLocaleString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
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

/* CARD */
.card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  padding: 24px;
  margin-bottom: 24px;
}

.mb-6 { margin-bottom: 24px; }

/* FORM */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-input {
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  font-size: 14px;
  background: white;
  color: #1f2937;
}

.form-input:focus {
  outline: none;
  border-color: #8A7CF0;
  box-shadow: 0 0 0 3px rgba(138, 124, 240, 0.15);
}

/* SUMMARY */
.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 16px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-label {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

.summary-value {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}

/* TABLE */
.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.table-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.btn-secondary,
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #e5e7eb;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-primary {
  background: linear-gradient(135deg, #6A5BEF, #5D4AE5);
  color: white;
  border: none;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #5D4AE5, #4F3FD9);
}

.table-wrap {
  overflow-x: auto;
}

.modern-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 400px;
}

.modern-table thead th {
  text-align: left;
  padding: 12px 16px;
  font-size: 12px;
  font-weight: 600;
  color: #4b5563;
  background: #F7F5FF;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.modern-table tbody td {
  padding: 12px 16px;
  border-bottom: 1px solid #f3f4f6;
  font-size: 14px;
}

.modern-table tbody tr:last-child td {
  border-bottom: none;
}

.modern-table tbody tr:hover {
  background: #faf9ff;
}

.muted {
  color: #6b7280;
  font-size: 13px;
}

.empty-row {
  text-align: center;
  padding: 24px;
  color: #9ca3af;
  font-style: italic;
}

/* MESSAGES */
.loading-message,
.error-message,
.info-message {
  text-align: center;
  padding: 24px;
  font-size: 16px;
  border-radius: 12px;
}

.error-message {
  color: #ef4444;
  background: #fef2f2;
}

.info-message {
  color: #6b7280;
  background: #f9f8ff;
}

/* RESPONSIVE */
@media (max-width: 768px) {
  .page-header,
  .table-header {
    flex-direction: column;
    align-items: stretch;
  }
  .table-actions {
    width: 100%;
    justify-content: center;
  }
  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>