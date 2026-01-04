
import type { RouteRecordRaw } from 'vue-router';

const businessRoutes: RouteRecordRaw[] = [
  { 
    path: '/business', 
    component: () => import('@/modules/business/views/BusinessDashboard.vue'),
    meta: { requiresAuth: true, role: 'BUSINESS' }
  },
];

export default businessRoutes;