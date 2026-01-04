<template>
  <div class="client-orders-layout">
    <!-- Header -->
    <div class="section-header">
      <div>
        <h1 class="section-title">My VPS</h1>
        <p class="section-subtitle">Kelola instance VPS Anda secara langsung dari sini.</p>
      </div>
      <button
        @click="fetchOrders"
        :disabled="ordersLoading"
        class="btn btn-primary"
      >
        <i v-if="!ordersLoading" class="fas fa-sync-alt"></i>
        <span v-if="ordersLoading" class="spinner-xs"></span>
        {{ ordersLoading ? 'Refreshing...' : 'Refresh' }}
      </button>
    </div>

    <!-- Status Messages -->
    <div v-if="ordersError" class="status-message error">
      <i class="fas fa-exclamation-circle"></i>
      <span>{{ ordersError }}</span>
    </div>

    <div v-else-if="ordersLoading" class="status-message info">
      <div class="spinner-xs"></div>
      <span>Loading your VPS instances...</span>
    </div>

    <!-- Orders Grid -->
    <div v-else class="orders-grid">
      <div v-if="orders.length === 0" class="empty-state">
        <i class="fas fa-server"></i>
        <p>Anda belum memiliki VPS aktif.</p>
      </div>

      <div
        v-for="order in orders"
        :key="order.id"
        class="order-card"
      >

        <!-- VPS List -->
        <div class="vps-section">
          <h3 class="vps-title">
            <i class="fas fa-cube"></i>
            VPS 
          </h3>

          <div v-if="order.vps.length === 0" class="empty-vps">
            <i class="fas fa-inbox"></i> Tidak ada instance VPS.
          </div>

          <ul class="vps-list">
            <li
              v-for="vps in order.vps"
              :key="vps.id"
              class="vps-item"
            >
              <!-- Hostname & SSH Link -->
              <div class="vps-identity">
               
                <a
                  :href="`ssh://${vps.ip}`"
                  class="ssh-link"
                  @click.prevent="copySshLink(vps.ip)"
                  title="Klik untuk salin perintah SSH"
                >
                  <i class="fas fa-terminal"></i>
                  ssh root@{{ vps.ip }}
                </a>
                <h4>password : admin</h4>
              </div>
<!-- Di dalam .order-card, tepat setelah .card-header -->
<div class="card-header">
  <div>
    <h2 class="product-name">{{ order.product.name }}</h2>
    <div class="order-metadata">
      <div class="metadata-item">
        <i class="fas fa-calendar-plus"></i>
        <span>Order: {{ formatDate(order.createdAt) }}</span>
      </div>
      <div class="metadata-item">
        <i class="fas fa-history"></i>
        <span>Next Billing: {{ formatDate(order.nextBillingDate) }}</span>
      </div>
    </div>
  </div>
  <div class="price-tag">
    Rp {{ formatPrice(order.finalPrice) }}
  </div>
</div>
              <!-- Status Badge -->
              <div class="vps-meta">
                <span :class="`status-dot status-${vps.status.toLowerCase()}`"></span>
                <span class="status-text">{{ capitalize(vps.status) }}</span>
              </div>

              <!-- Action Buttons -->
              <div class="vps-actions">
                <button
                  v-if="!isDisabled(vps, 'start')"
                  @click="() => handleAction('start', vps)"
                  class="btn-action btn-success"
                  :title="getTooltip(vps, 'start')"
                >
                  <i class="fas fa-play"></i>
                </button>

                <button
                  v-if="!isDisabled(vps, 'stop')"
                  @click="() => handleAction('stop', vps)"
                  class="btn-action btn-warning"
                  :title="getTooltip(vps, 'stop')"
                >
                  <i class="fas fa-stop"></i>
                </button>

                <div class="dropdown">
                  <button class="btn-action btn-outline" title="More actions">
                    <i class="fas fa-ellipsis-v"></i>
                  </button>
                  <div class="dropdown-menu">
                    <button
                      @click="() => handleAction('reinstall', vps)"
                      :disabled="isDisabled(vps, 'reinstall')"
                      class="dropdown-item"
                      :class="{ 'disabled': isDisabled(vps, 'reinstall') }"
                      :title="getTooltip(vps, 'reinstall')"
                    >
                      <i class="fas fa-redo"></i> Reinstall
                    </button>
                    <button
                      @click="() => handleAction('restore', vps)"
                      :disabled="isDisabled(vps, 'restore')"
                      class="dropdown-item"
                      :class="{ 'disabled': isDisabled(vps, 'restore') }"
                      :title="getTooltip(vps, 'restore')"
                    >
                      <i class="fas fa-undo"></i> Restore
                    </button>
                  </div>
                </div>
              </div>

              <!-- Per-VPS Error -->
              <div v-if="vpsError[vps.id]" class="vps-error">
                <i class="fas fa-circle-exclamation"></i>
                {{ vpsError[vps.id] }}
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
    <div v-if="toast.visible" class="toast">
      {{ toast.message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { useClientOrders } from "@/composables/client buy/useClientOrders";
import { useVpsActions } from "@/composables/useVpsActions";

// === State ===
const clientId = "cmjel2tps0000ijm4ahcks5vz";
const { orders, loading: ordersLoading, error: ordersError, fetchOrders } = useClientOrders(clientId);

const vpsActions = useVpsActions();
const currentVpsId = ref<string | null>(null);
const currentAction = ref<string | null>(null);
const vpsError = reactive<Record<string, string | null>>({});

// Toast
const toast = ref({
  visible: false,
  message: '',
});

const showToast = (msg: string) => {
  toast.value.visible = true;
  toast.value.message = msg;
  setTimeout(() => (toast.value.visible = false), 2500);
};

// === Helpers ===
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("id-ID").format(price);
};

const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const copySshLink = async (ip: string) => {
  const ssh = `ssh root@${ip}`;
  try {
    await navigator.clipboard.writeText(ssh);
    showToast(`Perintah SSH disalin: ${ssh}`);
  } catch (err) {
    showToast("Gagal menyalin. Silakan copy manual.");
  }
};

// === Action Handler ===
const handleAction = async (action: "start" | "stop" | "reinstall" | "restore", vps: any) => {
  vpsError[vps.id] = null;
  currentVpsId.value = vps.id;
  currentAction.value = action;

  try {
    switch (action) {
      case "start": await vpsActions.start(vps.id); break;
      case "stop": await vpsActions.stop(vps.id); break;
      case "reinstall": await vpsActions.reinstall(vps.id, "ubuntu-22-04"); break;
      case "restore": await vpsActions.restore(vps.id, "backup-20260102"); break;
    }
    await fetchOrders();
  } catch (e) {
    vpsError[vps.id] = vpsActions.error.value || "Action failed";
  } finally {
    currentVpsId.value = null;
    currentAction.value = null;
  }
};

const isDisabled = (vps: any, action: string): boolean => {
  if (isLoading(vps, action)) return true;
  switch (action) {
    case "start": return vps.status === "active" || vps.status === "starting";
    case "stop": return vps.status === "stopped" || vps.status === "stopping";
    case "reinstall":
    case "restore":
      return vps.status !== "stopped";
    default: return false;
  }
};

const isLoading = (vps: any, action: string): boolean => {
  return vpsActions.loading && currentVpsId.value === vps.id && currentAction.value === action;
};

const getTooltip = (vps: any, action: string): string => {
  if (isLoading(vps, action)) return "Processing...";
  switch (action) {
    case "start": return "Start this VPS";
    case "stop": return "Stop this VPS";
    case "reinstall": return vps.status !== "stopped" ? "VPS must be stopped first" : "Reinstall OS";
    case "restore": return vps.status !== "stopped" ? "VPS must be stopped first" : "Restore from backup";
    default: return "";
  }
};


const formatDate = (isoString: string): string => {
  if (!isoString) return '—';
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
};
</script>

<style scoped>
/* ========== GLOBAL ========== */
.client-orders-layout {
  padding: 2.5rem 1.5rem;
  max-width: 1320px;
  margin: 0 auto;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #ffffff;
  color: #1e293b;
  position: relative;
}

/* ========== HEADER ========== */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2.5rem;
  flex-wrap: wrap;
  gap: 1.5rem;
}
.section-title {
  font-size: 2.25rem;
  font-weight: 800;
  margin: 0;
  color: #111827;
  letter-spacing: -0.02em;
}
.section-subtitle {
  font-size: 1rem;
  color: #64748b;
  margin-top: 0.5rem;
  max-width: 600px;
  line-height: 1.5;
}

/* ========== STATUS ========== */
.status-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem;
  border-radius: 12px;
  margin-bottom: 2.5rem;
  font-weight: 600;
  background-color: #f8fafc;
}
.status-message.info {
  color: #0c4a6e;
  background-color: #f0f9ff;
}
.status-message.error {
  color: #dc2626;
  background-color: #fef2f2;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #94a3b8;
  grid-column: 1 / -1;
}
.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #cbd5e1;
}

/* ========== CARD ========== */
.orders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 1.75rem;
}
.order-card {
  background: #ffffff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
  border: 1px solid #f1f0ff;
}
.order-card:hover {
  box-shadow: 0 8px 28px rgba(106, 91, 239, 0.15);
  transform: translateY(-2px);
}

.card-header {
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f0efff;
  background: #faf9ff;
}
.product-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}
.price-tag {
  background: #6A5BEF;
  color: white;
  padding: 0.375rem 0.875rem;
  border-radius: 20px;
  font-weight: 700;
  font-size: 0.925rem;
}

/* ========== VPS ========== */
.vps-section {
  padding: 1.5rem;
}
.vps-title {
  font-size: 1rem;
  font-weight: 700;
  color: #334155;
  margin-bottom: 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.vps-title i {
  color: #6A5BEF;
}

.empty-vps {
  text-align: center;
  color: #94a3b8;
  padding: 1rem;
  font-style: italic;
}
.empty-vps i {
  margin-right: 0.5rem;
}

.vps-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.vps-item {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.25rem;
  background: #fcfbff;
  border-radius: 12px;
  border: 1px solid #f0efff;
}

.vps-identity {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.vps-hostname {
  font-weight: 700;
  font-size: 1.05rem;
  margin: 0;
  color: #1e293b;
}
.ssh-link {
  font-family: monospace;
  font-size: 0.925rem;
  color: #6A5BEF;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  transition: color 0.2s;
}
.ssh-link:hover {
  color: #5a4dbd;
  text-decoration: underline;
}
.ssh-link i {
  font-size: 0.875rem;
}

.vps-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.925rem;
  color: #64748b;
}

.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.status-active { background-color: #10b981; }
.status-stopped,
.status-suspended { background-color: #94a3b8; }
.status-pending { background-color: #f59e0b; }
.status-failed,
.status-error { background-color: #ef4444; }

/* ========== ACTIONS ========== */
.vps-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.btn-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  color: white;
  font-size: 0.875rem;
}
.btn-success { background-color: #10b981; }
.btn-success:hover:not(:disabled) { background-color: #059669; }
.btn-warning { background-color: #f59e0b; }
.btn-warning:hover:not(:disabled) { background-color: #d97706; }
.btn-outline {
  background: white;
  color: #64748b;
  border: 1px solid #e2e8f0;
}
.btn-outline:hover {
  background: #f8fafc;
  color: #475569;
}

/* Dropdown */
.dropdown {
  position: relative;
  display: inline-block;
}
.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 6px 16px rgba(0,0,0,0.1);
  min-width: 150px;
  z-index: 20;
  display: none;
  flex-direction: column;
  overflow: hidden;
}
.dropdown:hover .dropdown-menu {
  display: flex;
}
.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 1rem;
  font-size: 0.925rem;
  color: #334155;
  background: none;
  border: none;
  cursor: pointer;
  transition: background 0.2s;
}
.dropdown-item:hover:not(.disabled) {
  background: #f8fafc;
}
.dropdown-item i {
  width: 16px;
  text-align: center;
  color: #6A5BEF;
}
.dropdown-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Error */
.vps-error {
  color: #ef4444;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

/* Spinner */
.spinner-xs {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(106, 91, 239, 0.3);
  border-top: 2px solid #6A5BEF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Toast */
.toast {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background: #1e293b;
  color: white;
  padding: 0.75rem 1.25rem;
  border-radius: 12px;
  font-size: 0.925rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 1000;
  animation: fadeInOut 2.5s ease;
}
@keyframes fadeInOut {
  0% { opacity: 0; transform: translateY(10px); }
  10% { opacity: 1; transform: translateY(0); }
  90% { opacity: 1; }
  100% { opacity: 0; }
}

/* Responsive */
@media (max-width: 768px) {
  .client-orders-layout {
    padding: 1.5rem 1rem;
  }
  .section-header {
    flex-direction: column;
    align-items: stretch;
  }
  .vps-actions {
    justify-content: flex-start;
  }
  .orders-grid {
    grid-template-columns: 1fr;
  }
}

.order-metadata {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #64748b;
}
.metadata-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}
.metadata-item i {
  color: #6A5BEF;
  font-size: 0.875rem;
}
</style>