// src/router/routes/authRoutes.ts
import type { RouteRecordRaw } from 'vue-router';

const authRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('./views/login/Login.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/login/verify',
    name: 'LoginVerify',
    component: () => import('./views/login/LoginVerify.vue'),
    meta: { guestOnly: true },
    props: () => ({}),
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('./views/register/RegisterRequest.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/register/verify',
    name: 'RegisterVerify',
    component: () => import('./views/register/RegisterVerify.vue'),
    meta: { guestOnly: true },
    props: () => ({}),
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('./views/forgot/ForgotPasswordRequest.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/forgot-password/verify',
    name: 'ForgotVerify',
    component: () => import('./views/forgot/ForgotPasswordVerify.vue'),
    meta: { guestOnly: true },
    props: () => ({}),
  },
  {
    path: '/reset-password',
    name: 'ForgotReset',
    component: () => import('./views/forgot/ResetPassword.vue'),
    meta: { guestOnly: true },
    props: () => ({}),
  },
];

export default authRoutes;
