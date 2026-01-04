import type { RouteRecordRaw } from 'vue-router';

const authRoutes: RouteRecordRaw[] = [
  { path: '/login', component: () => import('@/modules/auth/views/LoginView.vue') },
  { path: '/verify-otp', component: () => import('@/modules/auth/views/VerifyOTPView.vue') },
  { path: '/forgot-password', component: () => import('@/modules/auth/views/ForgotPasswordView.vue') },
  { path: '/sukses', component: () => import('@/modules/auth/views/sukses.vue') }, 
];

export default authRoutes;
