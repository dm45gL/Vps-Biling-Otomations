<template>
  <div class="monitoring-container">

    <!-- HEADER WITH SELECTOR -->
    <header class="header-bar">
      <h2>Hypervisor Monitoring</h2>

      <div class="selector-box" v-if="hypervisors.length > 1">
        <label>Select Hypervisor</label>
        <select v-model="activeHypervisorId" @change="onHypervisorChange">
          <option
            v-for="h in hypervisors"
            :key="h.id"
            :value="h.id"
          >
            {{ h.name }} — {{ h.host }}
          </option>
        </select>
      </div>
    </header>

    <!-- SELECTED INFO -->
    <section class="hypervisor-info" v-if="activeHypervisor">
      <h3>{{ activeHypervisor.name }}</h3>
      <p>{{ activeHypervisor.host }} <span class="type-badge">{{ activeHypervisor.type }}</span></p>
    </section>

    <!-- SUMMARY SECTION -->
    <section v-if="vmStatuses.length > 0" class="summary-section">
      <div class="summary-card cpu">
        <h4>CPU Usage</h4>
        <p class="value">{{ vmStatuses[0]?.cpuPercent?.toFixed(2) ?? '0' }}%</p>
      </div>
      <div class="summary-card ram">
        <h4>Memory Usage</h4>
        <p class="value">
          {{ vmStatuses[0]?.ramUsedMB?.toFixed(1) ?? '0' }}<span class="unit">/ {{ vmStatuses[0]?.ramTotalMB?.toFixed(1) ?? '0' }} MB</span>
        </p>
        <small class="percent">{{ vmStatuses[0]?.ramPercent?.toFixed(1) ?? '0' }}%</small>
      </div>
      <div class="summary-card disk">
        <h4>Disk Usage</h4>
        <p class="value">
          {{ vmStatuses[0]?.diskUsedGB?.toFixed(2) ?? '0' }}<span class="unit">/ {{ vmStatuses[0]?.diskTotalGB?.toFixed(2) ?? '0' }} GB</span>
        </p>
        <small class="percent">{{ vmStatuses[0]?.diskPercent?.toFixed(2) ?? '0' }}%</small>
      </div>
      <div class="summary-card vm">
        <h4>Total VM</h4>
        <p class="value">{{ vmStatuses[0]?.totalVM ?? 0 }}</p>
      </div>
    </section>

    <p v-if="loadingVMs" class="loading">Loading Monitoring...</p>

    <!-- DATA TABLE -->
    <h3 class="section-title">Node Metrics</h3>

    <div class="table-wrapper" v-if="vmStatuses.length > 0">
      <table class="vm-table">
        <thead>
          <tr>
            <th>Node</th>
            <th>CPU</th>
            <th>Memory</th>
            <th>Disk</th>
            <th>Total VM</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="vm in vmStatuses" :key="vm.node">
            <td class="node-name">{{ vm.node }}</td>

            <td>
              <div class="metric-cell">
                <div class="progress-bar">
                  <div class="progress cpu" :style="{ width: vm.cpuPercent + '%' }"></div>
                </div>
                <span class="percent">{{ vm.cpuPercent?.toFixed(1) ?? '0' }}%</span>
              </div>
            </td>

            <td>
              <div class="metric-cell">
                <div class="progress-bar">
                  <div class="progress ram" :style="{ width: vm.ramPercent + '%' }"></div>
                </div>
                <span class="percent">{{ vm.ramPercent?.toFixed(1) ?? '0' }}%</span>
              </div>
            </td>

            <td>
              <div class="metric-cell">
                <div class="progress-bar">
                  <div class="progress disk" :style="{ width: vm.diskPercent + '%' }"></div>
                </div>
                <span class="percent">{{ vm.diskPercent?.toFixed(1) ?? '0' }}%</span>
              </div>
            </td>

            <td class="vm-count">{{ vm.totalVM ?? 0 }}</td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>
</template>

<script setup lang="ts">
import type { Hypervisor} from '@/composables/sysadmin/useHypervisors';
import { computed, onMounted } from 'vue';
import { useHypervisors } from '@/composables/sysadmin/useHypervisors';

const {
  hypervisors,
  fetchHypervisors,
  vmStatuses,
  activeHypervisorId,
  setActiveHypervisor,
  loadingVMs
} = useHypervisors();

// Type-safe computed untuk activeHypervisor
const activeHypervisor = computed<Hypervisor | null>(() => {
  const id = activeHypervisorId.value;
  if (!id) return null;
  return hypervisors.value.find(h => h.id === id) ?? null;
});

// Handler ketika user ganti hypervisor
const onHypervisorChange = () => {
  const id = activeHypervisorId.value;
  if (id) setActiveHypervisor(id);
};

// Inisialisasi saat mounted
onMounted(async () => {
  await fetchHypervisors();

  // Jika ada hypervisor, set default
  if (hypervisors.value.length > 0 && !activeHypervisorId.value) {
    const firstHypervisor = hypervisors.value[0];
    if (firstHypervisor?.id) {
      setActiveHypervisor(firstHypervisor.id);
    }
  }
});
</script>



<style scoped>
.monitoring-container {
  padding: 32px 40px;
  background: #ffffff;
  min-height: calc(100vh - 60px);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #1f2937;
}

/* HEADER */
.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 28px;
}

.header-bar h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #111827;
}

.selector-box {
  display: flex;
  flex-direction: column;
}

.selector-box label {
  font-size: 12px;
  font-weight: 500;
  color: #4b5563;
  margin-bottom: 6px;
}

.selector-box select {
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  font-size: 14px;
  color: #1f2937;
  min-width: 280px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.selector-box select:focus {
  outline: none;
  border-color: #8A7CF0;
  box-shadow: 0 0 0 3px rgba(138, 124, 240, 0.15);
}

/* HYPERVISOR INFO */
.hypervisor-info h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #111827;
}

.hypervisor-info p {
  margin: 4px 0 20px;
  color: #4b5563;
  font-size: 14px;
}

.type-badge {
  display: inline-block;
  margin-left: 12px;
  padding: 2px 8px;
  background: #F7F5FF;
  color: #6A5BEF;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

/* SUMMARY CARDS */
.summary-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.summary-card {
  background: #ffffff;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  border: 1px solid #eeeef5;
  transition: transform 0.2s;
}

.summary-card:hover {
  transform: translateY(-2px);
}

.summary-card h4 {
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
}

.summary-card .value {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  color: #111827;
}

.summary-card .unit {
  font-size: 14px;
  color: #6b7280;
  font-weight: normal;
  margin-left: 4px;
}

.summary-card .percent {
  display: block;
  margin-top: 4px;
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

.summary-card.cpu { border-top: 3px solid #FF9800; }
.summary-card.ram { border-top: 3px solid #2196F3; }
.summary-card.disk { border-top: 3px solid #4CAF50; }
.summary-card.vm { border-top: 3px solid #6A5BEF; }

/* TABLE */
.section-title {
  margin: 24px 0 16px;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.table-wrapper {
  overflow-x: auto;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  background: white;
  border: 1px solid #eeeef5;
}

.vm-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
}

.vm-table th {
  background: #fafafa;
  padding: 14px 16px;
  text-align: left;
  font-size: 13px;
  font-weight: 600;
  color: #4b5563;
}

.vm-table td {
  padding: 14px 16px;
  font-size: 14px;
  color: #1f2937;
  border-top: 1px solid #f3f4f6;
}

.node-name {
  font-weight: 600;
  color: #111827;
}

.metric-cell {
  display: flex;
  align-items: center;
}

.progress-bar {
  width: 130px;
  height: 8px;
  background: #f3f4f6;
  border-radius: 4px;
  overflow: hidden;
  display: inline-block;
  margin-right: 12px;
}

.progress {
  height: 100%;
  transition: width 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.progress.cpu { background: linear-gradient(90deg, #FF9800, #FFB74D); }
.progress.ram { background: linear-gradient(90deg, #2196F3, #64B5F6); }
.progress.disk { background: linear-gradient(90deg, #4CAF50, #81C784); }

.percent {
  font-size: 13px;
  color: #4b5563;
  min-width: 40px;
}

.vm-count {
  font-weight: 600;
  color: #6A5BEF;
}

.loading {
  text-align: center;
  color: #6b7280;
  font-style: italic;
  margin: 20px 0;
}
</style>