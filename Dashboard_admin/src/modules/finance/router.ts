// src/modules/sysadmin/router.ts
import type { RouteRecordRaw } from 'vue-router';

const financeRoutes: RouteRecordRaw[] = [
  { 
    path: '/finance', 
    component: () => import('@/modules/finance/views/FinanceDashboard.vue'),
    meta: { requiresAuth: true, role: 'FINANCE' }
  },
];

export default financeRoutes;