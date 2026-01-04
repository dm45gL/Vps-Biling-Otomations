// src/config/sidebarMenu.ts (atau lokasi file kamu)
import { markRaw } from 'vue';

import contoh from '../views/contoh.vue';
import profile from '../views/profile/profile.vue';
import orders from '../views/orders.vue';




// Tambahkan tipe aksi
export type SidebarMenuAction = 'logout';

export interface SidebarMenuItem {
  label: string;

  component?: any;
  children?: SidebarMenuItem[];
  expanded?: boolean;
  action?: SidebarMenuAction; // ← tambahan kecil
}

export const sidebarMenu: SidebarMenuItem[] = [
  {
    label: 'Dashboard',
   
    component: markRaw(contoh),
  },
  {
    label: 'Produk',
   
    expanded: false,
    children: [
      { label: 'My VPS', component: markRaw(orders)},
      { label: 'Hosting', },
      { label: 'Domain', },
      { label: 'Profile', component: markRaw(profile)},
    ],
  },




  {
    label: 'Logout',
    action: 'logout', 
  },
];