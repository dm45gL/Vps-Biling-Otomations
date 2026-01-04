// src/modules/sysadmin/router.ts
import type { RouteRecordRaw } from 'vue-router';

const sysadminRoutes: RouteRecordRaw[] = [
  { 
    path: '/sysadmin', 
    component: () => import('@/modules/sysadmin/views/SysadminDashboard.vue'),
    meta: { requiresAuth: true, role: 'SYSADMIN' }
  },
];

export default sysadminRoutes;