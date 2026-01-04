import { markRaw } from 'vue';
import ProfileView from '../content/ProfileView.vue';
import UsersView from '../content/UsersView.vue';
import Hypervisor from '../content/ManageHypervisors.vue';
import Terminal from '../content/terminal.vue';
import Monitor from '../content/VMMonitor.vue';
import Template from '../content/Template.vue';
import Backup from '../content/BackupStorageView.vue';
import BackupPolicy from '../content/BackupPolicy.vue';
import IPAddr from '../content/ManageIP.vue';
import rawProduk from '../content/RawProductView.vue';
import regional from '../content/regional.vue';




export interface SidebarMenuItem {
  label: string;
  icon?: string;
  component?: any;
  children?: SidebarMenuItem[];
  expanded?: boolean;
}

// ──────────────────────────────
// Sidebar Menu Configuration
// ──────────────────────────────
export const sidebarMenu: SidebarMenuItem[] = [
  // Dashboard / Monitoring
  {
    label: 'Dashboard',
    icon: 'bi bi-speedometer2',
    component: markRaw(Monitor),
  },

  // Produk Section
  {
    label: 'Produk',
    icon: 'bi bi-box-seam',
    expanded: false,
    children: [
      { label: 'KVM', icon: 'bi bi-cpu', component: markRaw(rawProduk) },

    ],
  },

  // System Section
  {
    label: 'Services',
    icon: 'bi bi-clouds-fill',
    expanded: false,
    children: [
      { label: 'Hypervisor', icon: 'bi bi-hdd-network', component: markRaw(Hypervisor) },
      { label: 'IP Addresses', icon: 'bi bi-diagram-3', component: markRaw(IPAddr) },
      { label: 'Backup', icon: 'bi bi-database-check', component: markRaw(Backup) },
      { label: 'Client Backup', icon: 'bi bi-database-check', component: markRaw(BackupPolicy) },
      { label: 'Regional', icon: 'bi bi-database-check', component: markRaw(regional) },

    ],
  },

  // Template
  {
    label: 'Template',
    icon: 'bi bi-card-checklist',
    component: markRaw(Template),
  },

  // Terminal
  {
    label: 'Terminal',
    icon: 'bi bi-terminal',
    component: markRaw(Terminal),
  },

  // User/Profile Section
  {
    label: 'Profil',
    icon: 'bi bi-person-circle',
    expanded: false,
    children: [
      { label: 'Profil', icon: 'bi bi-person', component: markRaw(ProfileView) },
      { label: 'Manage User', icon: 'bi bi-people', component: markRaw(UsersView) },
    ],
  },

  // Logout
  {
    label: 'Logout',
    icon: 'bi bi-box-arrow-right',
  },
];
