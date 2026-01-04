import { markRaw } from 'vue';
import PricingDurations from "../content/ProductPricingManager.vue"
import promo from '../content/promo.vue';
import PromoUsage from '../content/PromoUsage.vue';
import Product from "../content/product.vue"; 

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
    component: markRaw(Product),
  },

  // Produk Section
  {
    label: 'Produk',
    icon: 'bi bi-box-seam',
    expanded: false,
    children: [
      { label: 'Harga', icon: 'bi bi-cpu', component: markRaw },
      { label: 'Promo', component: markRaw(promo) },
      { label: 'Langganan', icon: 'bi bi-globe2',  component: markRaw (PricingDurations) },
      { label: 'SSL', icon: 'bi bi-shield-lock' },
    ],
  },

  // System Section
  {
    label: 'Services',
    icon: 'bi bi-clouds-fill',
    expanded: false,
    children: [
      { label: 'Loging', icon: 'bi bi-hdd-network', component: markRaw(PromoUsage) },
      { label: 'IP Addresses', icon: 'bi bi-diagram-3', component: markRaw },
      { label: 'Backup', icon: 'bi bi-database-check', component: markRaw },
      { label: 'Client Backup', icon: 'bi bi-database-check', component: markRaw },

    ],
  },

 
  // Logout
  {
    label: 'Logout',
    icon: 'bi bi-box-arrow-right',
  },
];
