<template>
  <nav
    class="navbar"
    role="navigation"
    aria-label="main navigation"
  >
    <div class="container">
      <div class="navbar-brand">
        <router-link to="/" class="navbar-item logo-container">
          <img src="../assets/logo2.png" alt="InfraPanel Logo" class="logo-img" />
        </router-link>

        <a
          role="button"
          class="navbar-burger"
          :class="{ 'is-active': isMenuActive }"
          aria-label="menu"
          aria-expanded="false"
          @click="toggleMenu"
        >
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
        </a>
      </div>

      <div class="navbar-menu" :class="{ 'is-active': isMenuActive }">
        <div class="navbar-start">
          <router-link to="/" class="navbar-item navbar-link">Beranda</router-link>

          <div class="navbar-item has-dropdown is-hoverable">
            <a class="navbar-link navbar-link">Layanan</a>
            <div class="navbar-dropdown">
              <router-link
                v-for="item in services"
                :key="item.to"
                :to="item.to"
                class="navbar-item dropdown-item"
                @click="closeMenu"
              >
                {{ item.label }}
              </router-link>
            </div>
          </div>

          <router-link to="/pricing" class="navbar-item navbar-link">Harga</router-link>
          <router-link to="/support" class="navbar-item navbar-link">Bantuan</router-link>
        </div>

        <div class="navbar-end">
          <div class="navbar-item">
            <div class="buttons">
              <router-link to="/login" class="button is-text btn-text">Masuk</router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const isMenuActive = ref(false);

const services = [
  { label: 'VPS Cloud', to: '/vps' },
  { label: 'Shared Hosting', to: '/hosting' },
  { label: 'Domain', to: '/domain' },
  { label: 'SSL Certificate', to: '/ssl' },
  { label: 'Backup & Recovery', to: '/backup' },
  { label: 'Managed Services', to: '/managed' },
];

const toggleMenu = () => {
  isMenuActive.value = !isMenuActive.value;
};

const closeMenu = () => {
  isMenuActive.value = false;
};
</script>

<style scoped>
/* === Navbar Styling === */
.navbar {
  background-color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1030;
  transition: all 0.3s ease;
}

/* Logo */
.logo-container {
  padding: 0 !important;
  display: flex;
  align-items: center;
}
.logo-img {
  max-height: 40px;
  width: auto;
  object-fit: contain;
}

/* Navbar Links */
.navbar-link,
.navbar-item.navbar-link {
  color: #333;
  font-weight: 500;
  padding: 0.5rem 0.75rem;
  position: relative;
  transition: color 0.2s ease;
}

/* Hapus underline untuk semua link */
.navbar-item.navbar-link::after,
.navbar-item.navbar-link.router-link-exact-active::after {
  content: none;
}

/* Hover tetap ubah warna */
.navbar-link:hover,
.navbar-item.navbar-link:hover,
.navbar-item.navbar-link.router-link-exact-active {
  color: #6a5acd;
}

/* Dropdown */
.navbar-dropdown {
  border: none;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  transition: all 0.2s ease;
}
.dropdown-item {
  color: #333;
  font-weight: 500;
  padding: 0.65rem 1.25rem;
}
.dropdown-item:hover {
  background-color: #f9f8ff;
  color: #6a5acd;
}

/* Buttons */
.btn-text {
  color: #4b2e83;
  background: transparent;
  font-weight: 600;
  transition: background 0.2s ease;
}
.btn-text:hover {
  background-color: #f9f8ff;
}
.btn-primary {
  background-color: #6a5acd;
  color: white;
  font-weight: 600;
  border: none;
  border-radius: 6px;
  padding: 0.55rem 1.35rem;
  transition: background 0.2s ease, transform 0.2s ease;
}
.btn-primary:hover {
  background-color: #5a4dbd;
  transform: translateY(-1px);
}

/* Container */
.container {
  padding-left: 1.5rem;
  padding-right: 1.5rem;
  max-width: 1280px;
}

/* Burger */
.navbar-burger span {
  background-color: #4b2e83;
}

/* Hapus underline untuk semua navbar link, termasuk Layanan, Harga, Bantuan */
.navbar-link::after,
.navbar-item.navbar-link::after,
.navbar-item.navbar-link.router-link-exact-active::after {
  content: none !important;
}
/* Semua navbar link tanpa pseudo-element absolute */
.navbar-link,
.navbar-item.navbar-link {
  color: #333;
  font-weight: 500;
  padding: 0.5rem 0.75rem;
  position: relative; /* tetap relatif untuk efek kecil */
  transition: color 0.2s ease, border-bottom 0.2s ease;
  border-bottom: 2px solid transparent; /* default tidak terlihat */
}

/* Router-link aktif underline relatif */
.navbar-item.navbar-link.router-link-exact-active {
  border-bottom-color: #6a5acd; /* underline muncul sesuai lebar teks */
}

/* Hover efek warna */
.navbar-link:hover,
.navbar-item.navbar-link:hover {
  color: #6a5acd;
}

</style>
