import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import authRoutes from '@/modules/auth/router';
import sysadminRoutes from '@/modules/sysadmin/router';
import financeRoutes from '@/modules/finance/router';
import businessRoutes from '@/modules/business/router';
import { useAuth } from '@/composables/auth/useAuth';

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/login' },
  ...authRoutes,
  ...sysadminRoutes,
  ...financeRoutes,
  ...businessRoutes,
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

function redirectByRole(role?: string) {
  switch (role) {
    case 'SYSADMIN': return '/sysadmin';
    case 'FINANCE': return '/finance';
    case 'BUSINESS': return '/business';
    default: return '/login';
  }
}

router.beforeEach(async (to, _, next) => {
  const { isAuthenticated, fetchUser, user, performLogout, loadingAuth } = useAuth();

  const authPages = ['/login', '/verify-otp', '/forgot-password'];

  // 1️⃣ Jika user membuka halaman auth
  if (authPages.includes(to.path)) {
    // Jika sudah login → redirect ke dashboard sesuai role
    if (isAuthenticated.value) {
      return next(redirectByRole(user.value?.role));
    }
    // Belum login → biarkan
    return next();
  }

  // 2️⃣ Untuk halaman protected → fetch user jika pertama kali
  if (loadingAuth.value) {
    await fetchUser().catch(() => {});
  }

  // 3️⃣ Protected route check
  if (to.meta.requiresAuth) {
    if (!isAuthenticated.value) {
      await performLogout();
      return next('/login');
    }

    // 4️⃣ Role check
    if (to.meta.role && to.meta.role !== user.value?.role) {
      return next(redirectByRole(user.value?.role));
    }
  }

  next();
});

export default router;
