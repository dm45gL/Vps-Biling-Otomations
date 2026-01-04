<template>
  <div class="app-layout">
    <!-- SIDEBAR -->
    <aside
      class="sidebar"
      :class="{
        'sidebar-expanded': !isMobile || isDesktopExpanded,
        'sidebar-mobile-open': isMobile && sidebarMobileOpen
      }"
      @mouseenter="handleSidebarHover"
    >
      <div class="sidebar-header">
        <div class="logo">
          <span class="logo-mark">IP</span>
          <span class="logo-text">InfraPanel</span>
        </div>
        <button
          v-if="isMobile"
          class="mobile-close"
          @click="sidebarMobileOpen = false"
          aria-label="Close menu"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>

      <nav class="sidebar-nav">
        <ul>
          <li v-for="item in menu" :key="item.label">
            <a
              class="nav-link"
              :class="{ 'is-active': activeLabel === item.label }"
              @click.prevent="handleItemClick(item)"
            >
             
              <span class="nav-label">{{ item.label }}</span>
              <i
                v-if="item.children"
                class="chevron fas"
                :class="item.expanded ? 'fa-chevron-down' : 'fa-chevron-right'"
              ></i>
            </a>

            <transition name="slide">
              <ul v-if="item.children && item.expanded" class="submenu">
                <li v-for="child in item.children" :key="child.label">
                  <a
                    class="submenu-link"
                    :class="{ 'is-active': activeLabel === child.label }"
                    @click.prevent="handleItemClick(child)"
                  >
                    {{ child.label }}
                  </a>
                </li>
              </ul>
            </transition>
          </li>
        </ul>
      </nav>

      <div class="sidebar-footer">
        <span class="text-muted">&copy; {{ currentYear }} InfraPanel</span>
      </div>
    </aside>

    <!-- MOBILE OVERLAY -->
    <div
      v-if="isMobile && sidebarMobileOpen"
      class="sidebar-overlay"
      @click="sidebarMobileOpen = false"
    ></div>

    <!-- MAIN CONTENT -->
    <main class="main-content">
      <!-- Mobile Header -->
      <header v-if="isMobile" class="mobile-header">
        <button class="hamburger" @click="sidebarMobileOpen = true" aria-label="Open menu">
          <i class="fas fa-bars"></i>
        </button>
        <h1 class="mobile-title">{{ activeLabel }}</h1>
      </header>

      <!-- ✅ HANYA TEMPAT KOSONG UNTUK KONTEN -->
      <div class="content-wrapper">
        <component :is="activeComponent" v-if="activeComponent" />
      </div>
    </main>

    <!-- LOGOUT MODAL -->
    <LogoutConfirmationModal
      v-model="showLogoutModal"
      @confirm="confirmLogout"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { sidebarMenu, type SidebarMenuItem } from '../components/sidebarMenu';
import { useAuth } from '@/composables/auth/useAuth';
import LogoutConfirmationModal from '../components/modals/Logout.vue';

// State
const menu = ref<SidebarMenuItem[]>([]);
const showLogoutModal = ref(false);
const auth = useAuth();
const router = useRouter();

// Responsif
const isMobile = ref(window.innerWidth < 1024);
const sidebarMobileOpen = ref(false);
const isDesktopExpanded = ref(true);

// Active state
const activeComponent = shallowRef<any>(null);
const activeLabel = ref<string>('');
const currentYear = new Date().getFullYear();

// Deep clone menu
const deepCloneMenu = (items: SidebarMenuItem[]): SidebarMenuItem[] => {
  return items.map(item => {
    const copy = { ...item, expanded: item.expanded ?? false };
    if (item.children) {
      copy.children = deepCloneMenu(item.children);
    }
    return copy;
  });
};

// Resize
const updateScreenSize = () => {
  const nowIsMobile = window.innerWidth < 1024;
  if (isMobile.value !== nowIsMobile) {
    isMobile.value = nowIsMobile;
    sidebarMobileOpen.value = false;
    isDesktopExpanded.value = true;
  }
};

const handleSidebarHover = () => {
  if (!isMobile.value) {
    isDesktopExpanded.value = true;
  }
};

const handleItemClick = (item: SidebarMenuItem) => {
  if (item.label === 'Logout') {
    showLogoutModal.value = true;
    return;
  }

  if (item.children) {
    item.expanded = !item.expanded;
    return;
  }

  activeComponent.value = item.component || null;
  activeLabel.value = item.label;

  if (isMobile.value) {
    sidebarMobileOpen.value = false;
  }
};

const confirmLogout = async () => {
  showLogoutModal.value = false;
  await auth.performLogout();
  router.push('/login');
};


onMounted(() => {
  window.addEventListener('resize', updateScreenSize);

  // Deep clone menu agar bisa diubah
  menu.value = deepCloneMenu(sidebarMenu);

  const first = menu.value[0];
  if (first) {
    if (first.children && first.children.length > 0) {
      first.expanded = true;
      const firstChild = first.children[0];
      if (firstChild) {
        activeLabel.value = firstChild.label;
        activeComponent.value = firstChild.component;
      }
    } else {
      activeLabel.value = first.label;
      activeComponent.value = first.component;
    }
  }
});

onUnmounted(() => {
  window.removeEventListener('resize', updateScreenSize);
});


onUnmounted(() => {
  window.removeEventListener('resize', updateScreenSize);
});
</script>

<style scoped>
/* ========== GLOBAL ========== */
.app-layout {
  display: flex;
  height: 100vh;
  background: linear-gradient(132deg, #f8f7ff 0%, #f0efff 40%, #faf9ff 100%);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  overflow: hidden; 
}


.content-wrapper {
  flex: 1;
  overflow-y: auto; 
  padding: 1.5rem 2rem;
  background: #f9f9fb;
  height: calc(100vh - 0px); 
}

/* ========== SIDEBAR ========== */
/* ... (semua style sidebar tetap sama seperti sebelumnya) ... */
.sidebar {
  background: #ffffff;
  color: #3a3a4a;
  width: 72px;
  transition: width 0.36s cubic-bezier(0.23, 1, 0.32, 1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100vh;
  position: relative;
  z-index: 101;
  box-shadow: 4px 0 24px -4px rgba(91, 62, 150, 0.09);
  border-right: 1px solid #eaeef7;
}

.sidebar-expanded { width: 256px; }

@media (max-width: 1023px) {
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    width: 86vw;
    max-width: 300px;
    transform: translateX(-100%);
    transition: transform 0.36s cubic-bezier(0.23, 1, 0.32, 1);
    z-index: 102;
  }
  .sidebar-mobile-open { transform: translateX(0); }
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1rem;
  border-bottom: 1px solid #eaeef7;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  white-space: nowrap;
}

.logo-mark {
  background: #6A5ACD;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
}

.logo-text {
  font-weight: 700;
  font-size: 18px;
  color: #5b3e96;
  opacity: 0;
  transform: translateX(-8px);
  transition: opacity 0.28s, transform 0.28s;
}

.sidebar-expanded .logo-text,
.sidebar-mobile-open .logo-text {
  opacity: 1;
  transform: translateX(0);
}

.mobile-close {
  background: none;
  border: none;
  color: #3a3a4a;
  font-size: 1.25rem;
  display: none;
}

@media (max-width: 1023px) {
  .mobile-close { display: block; }
}

.sidebar:not(.sidebar-expanded):not(.sidebar-mobile-open) .nav-label,
.sidebar:not(.sidebar-expanded):not(.sidebar-mobile-open) .chevron {
  display: none;
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem 0;
}

.sidebar-nav ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-link,
.submenu-link {
  display: flex;
  align-items: center;
  padding: 0.875rem 1.25rem;
  color: #5a5a6a;
  text-decoration: none;
  border-radius: 0 8px 8px 0;
  transition: all 0.22s ease;
  gap: 12px;
  font-size: 14px;
  position: relative;
}

@media (max-width: 1023px) {
  .nav-link,
  .submenu-link {
    border-radius: 0;
    padding-left: 1.5rem;
  }
}

.nav-link i,
.submenu-link i {
  min-width: 20px;
  text-align: center;
  color: #7a7f94;
}

.nav-link:hover,
.submenu-link:hover {
  background: #f8f9fe;
  color: #6A5ACD;
}

.nav-link.is-active {
  background: #f0efff;
  color: #6A5ACD;
  font-weight: 600;
}

.nav-link.is-active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 4px;
  background: #6A5ACD;
  border-radius: 0 4px 4px 0;
}

@media (max-width: 1023px) {
  .nav-link.is-active::before { display: none; }
}

.nav-link.is-active i {
  color: #6A5ACD;
}

.chevron {
  margin-left: auto;
  font-size: 12px;
  color: #94a3b8;
  transition: transform 0.22s;
}

.submenu {
  padding-left: 1.25rem;
  overflow: hidden;
}

@media (max-width: 1023px) {
  .submenu { padding-left: 1.75rem; }
}

.slide-enter-active,
.slide-leave-active {
  transition: max-height 0.32s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.22s;
  max-height: 500px;
  opacity: 1;
}
.slide-enter-from,
.slide-leave-to {
  max-height: 0;
  opacity: 0;
}

.sidebar-footer {
  padding: 1.25rem;
  text-align: center;
  color: #7a7f94;
  border-top: 1px solid #eaeef7;
  margin-top: auto;
  font-size: 13px;
}

/* ========== MAIN CONTENT ========== */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

/* Mobile Header */
.mobile-header {
  display: none;
  padding: 1rem 1.25rem;
  background: white;
  border-bottom: 1px solid #eaeef7;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.03);
  z-index: 90;
  align-items: center;
}

@media (max-width: 1023px) {
  .mobile-header { display: flex; }
}

.hamburger {
  background: none;
  border: none;
  color: #3a3a4a;
  font-size: 1.25rem;
  margin-right: 1rem;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.hamburger:hover { background: #f8f9fe; }

.mobile-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  flex: 1;
  text-align: center;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

/* ✅ CONTENT WRAPPER: hanya beri scroll, tanpa padding atau border */
.content-wrapper {
  flex: 1;
  overflow-y: auto;
}

/* Overlay */
.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.48);
  backdrop-filter: blur(8px);
  z-index: 100;
}

/* Scrollbar */
.sidebar-nav::-webkit-scrollbar {
  width: 6px;
}
.sidebar-nav::-webkit-scrollbar-track {
  background: transparent;
}
.sidebar-nav::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}
.sidebar-nav::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

/* MAIN CONTENT */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  padding-left: 72px; /* jarak default sidebar collapsed */
  transition: padding-left 0.36s cubic-bezier(0.23, 1, 0.32, 1);
}

.sidebar-expanded ~ .main-content {
  padding-left: 5px; /* jarak saat sidebar expanded */
}

@media (max-width: 1023px) {
  .main-content {
    padding-left: 0; /* mobile overlay tidak perlu jarak */
  }
}

/* Content wrapper */
.content-wrapper {
  flex: 1;
  overflow-y: auto; /* scroll jika konten melebihi layar */
  padding: 1.5rem 2rem; /* jarak konten dari sidebar */
  background: #f9f9fb;
}

/* Opsional: beri konten background putih */
.content-wrapper > * {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 6px 28px -6px rgba(91, 62, 150, 0.08);
}


</style>