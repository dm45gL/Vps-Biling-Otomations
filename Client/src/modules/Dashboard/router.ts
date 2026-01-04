import type { RouteRecordRaw } from 'vue-router';

const dashboardRoutes: RouteRecordRaw[] = [
  {
    path: '/client/dashboard',
    name: 'client-dashboard',
    component: () => import('./Dashboard.vue'),
    meta: { requiresAuth: true, role: 'CLIENT' },
  },
  {
    path: '/client/billing-address',
    name: 'client-add-billing-address',
    component: () => import('./views/Checkout.vue'),
    meta: { requiresAuth: true, role: 'CLIENT' },
  },
  {
    path: '/client/products/:publicId',
    name: 'client-product-detail',
    component: () => import('./views/ProductDetail.vue'),
    meta: { requiresAuth: true, role: 'CLIENT' },
  },
  {
    path: '/client/products/:publicId/checkout',
    name: 'client-product-checkout',
    component: () => import('./views/Checkout.vue'),
    meta: { requiresAuth: true, role: 'CLIENT' },
  },
];

export default dashboardRoutes;
