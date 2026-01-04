// src/router/clientRouter.ts
import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import authRoutes from '@/modules/auth/router';
import dashboardRoutes from '@/modules/Dashboard/router';
import pageRoutes from '@/modules/page/router';
import { useClientAuth } from '@/composables/auth/useClientAuth';

const routes: RouteRecordRaw[] = [
  ...authRoutes,
  ...dashboardRoutes,
  ...pageRoutes,
  { path: '/:pathMatch(.*)*', redirect: '/' }, // fallback
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// urutan linear flow untuk auth
const authFlow = [
  '/login',
  '/login/verify',
  '/register',
  '/register/verify',
  '/forgot-password',
  '/forgot-password/verify',
  '/reset-password',
];

// helper untuk auth flow
const isAuthFlow = (path: string) => authFlow.includes(path);
const markAuthStepDone = (path: string) => sessionStorage.setItem(`auth_step_${path}`, 'done');
const isAuthStepDone = (path: string) => !!sessionStorage.getItem(`auth_step_${path}`);

// redirect berdasarkan role
const redirectByRole = (role?: string) =>
  role === 'CLIENT' ? '/client/dashboard' : '/login';

router.beforeEach(async (to, _, next) => {
  const { client, fetchCurrentClient, logout, loading } = useClientAuth();

  // 1️⃣ Jika user sudah login dan mengakses halaman guest → redirect
  if (to.meta.guestOnly && client.value) {
    return next({ path: redirectByRole('CLIENT'), replace: true });
  }

  // 2️⃣ Auth flow linear guard
  if (isAuthFlow(to.path)) {
    const currentIndex = authFlow.indexOf(to.path);

    if (currentIndex > 0) {
      const previousStep = authFlow[currentIndex - 1];
      if (previousStep && !isAuthStepDone(previousStep)) {
        return next({ path: previousStep, replace: true });
      }
    }

    markAuthStepDone(to.path);
  }

  // 3️⃣ Jika halaman membutuhkan auth dan client belum ada → fetch
  if (to.meta.requiresAuth && !client.value && !loading.value) {
    try {
      await fetchCurrentClient();
    } catch {
      await logout();
      return next({ path: '/login', replace: true });
    }
  }

  // 4️⃣ Halaman protected
  if (to.meta.requiresAuth) {
    if (!client.value) {
      await logout();
      return next({ path: '/login', replace: true });
    }

    if (to.meta.role && to.meta.role !== 'CLIENT') {
      return next({ path: redirectByRole('CLIENT'), replace: true });
    }
  }

  // 5️⃣ Halaman publik → biarkan
  next();
});

export default router;
