<template>
  <div class="public-products-layout">
    <!-- Hero Section -->
    <div class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">Pilih Paket VPS Anda</h1>
        <p class="hero-subtitle">
          Server virtual berperforma tinggi, siap pakai dalam hitungan detik.<br />
          Pilih rencana yang sesuai dengan kebutuhan bisnis Anda.
        </p>
      </div>
    </div>

    <!-- Status & Daftar Produk -->
    <div class="products-container">
      <!-- Loading -->
      <div v-if="loadingProducts" class="status-message info">
        <div class="spinner"></div>
        <span>Muat daftar paket...</span>
      </div>

      <!-- Error -->
      <div v-else-if="errorProducts" class="status-message error">
        <i class="fas fa-exclamation-circle"></i>
        <span>{{ errorProducts }}</span>
      </div>

      <!-- Daftar Produk -->
      <div v-else class="products-grid">
        <div
          v-for="product in products"
          :key="product.publicId"
          class="product-card"
          :class="{ 'featured': isPopular(product.name) }"
        >
          <!-- Badge Populer -->
          <div v-if="isPopular(product.name)" class="badge-popular">Populer</div>

          <!-- Header: Nama & Harga -->
          <div class="card-header">
            <h2 class="product-name">{{ product.name }}</h2>
            <div class="price-section">
              <span class="price-value">Rp {{ formatPrice(getPricePerMonth(product.pricing)) }}</span>
              <span class="price-unit">/bulan</span>
            </div>
          </div>

          <!-- Spesifikasi -->
          <ul class="specs-list">
            <li>
              <i class="fas fa-microchip"></i>
              <span>{{ product.specs.cpu }} vCPU</span>
            </li>
            <li>
              <i class="fas fa-memory"></i>
              <span>{{ product.specs.ram }} GB RAM</span>
            </li>
            <li>
              <i class="fas fa-hdd"></i>
              <span>{{ product.specs.disk }} GB NVMe SSD</span>
            </li>
            <li>
              <i class="fas fa-exchange-alt"></i>
              <span>{{ product.specs.bandwidth }} TB Bandwidth</span>
            </li>
          </ul>

        <!-- Tombol Aksi di Dashboard -->
        <div class="card-actions">
          <router-link
            :to="`/client/products/${product.publicId}`"
            class="btn btn-primary"
          >
            Pilih Paket
          </router-link>
    

          </div>
        </div>
      </div>
    </div>
</div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { listPublicProductsClient } from '@/api/publicProduct';
import type { ClientProductDTO } from '@/api/publicProduct';

const products = ref<ClientProductDTO[]>([]);
const loadingProducts = ref(true);
const errorProducts = ref<string | null>(null);

const fetchProducts = async () => {
  loadingProducts.value = true;
  errorProducts.value = null;
  try {
    const res = await listPublicProductsClient();
    if (res.data.success) {
      products.value = res.data.data;
    }
  } catch (err: any) {
    console.error(err);
    errorProducts.value = err.message || 'Gagal memuat daftar paket. Coba lagi nanti.';
  } finally {
    loadingProducts.value = false;
  }
};

const formatPrice = (value: number): string => {
  if (!value || value <= 0) return '—';
  return new Intl.NumberFormat('id-ID').format(value);
};

const getPricePerMonth = (
  pricing?: { months: number; price: number; backupPrice?: number | null }[]
) => {
  if (!pricing || pricing.length === 0) return 0;
  const sorted = [...pricing].sort((a, b) => a.months - b.months);
  const minPkg = sorted[0];
  if (!minPkg || minPkg.months <= 0) return 0;
  return Math.ceil(minPkg.price / minPkg.months);
};

const isPopular = (name: string): boolean => {
  const popularKeywords = ['pro', 'business', 'premium'];
  const lowerName = name.toLowerCase();
  return popularKeywords.some(kw => lowerName.includes(kw));
};

onMounted(() => fetchProducts());
</script>

<style scoped>
/* ========== GLOBAL ========== */
.public-products-layout {
  padding: 2.5rem 1.25rem;
  max-width: 1320px;
  margin: 0 auto;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #ffffff;
  color: #1e293b;
}

/* ========== HERO ========== */
.hero-section {
  text-align: center;
  margin-bottom: 2.75rem;
}
.hero-title {
  font-size: 2.25rem;
  font-weight: 700;
  margin: 0;
  color: #1e293b;
  letter-spacing: -0.02em;
}
.hero-subtitle {
  font-size: 1.0625rem;
  color: #64748b;
  margin-top: 1rem;
  line-height: 1.5;
  max-width: 680px;
  margin-left: auto;
  margin-right: auto;
  font-weight: 400;
}

/* ========== STATUS MESSAGES ========== */
.status-message {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1.25rem;
  border-radius: 12px;
  margin-bottom: 2.5rem;
  font-size: 1rem;
  font-weight: 600;
  background-color: #f8fafc;
}
.status-message.info {
  color: #0c4a6e;
  background-color: #f0f9ff;
}
.status-message.error {
  color: #dc2626;
  background-color: #fef2f2;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(106, 91, 239, 0.3);
  border-top: 2px solid #6A5BEF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ========== PRODUCTS ========== */
.products-container {
  padding: 0 1rem;
}
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.75rem;
  max-width: 1280px;
  margin: 0 auto;
}

/* ========== PRODUCT CARD ========== */
.product-card {
  background: #ffffff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  position: relative;
  border: 1px solid #f0efff;
}
.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(106, 91, 239, 0.12);
}

.badge-popular {
  position: absolute;
  top: -10px;
  right: -10px;
  background: #6A5BEF;
  color: white;
  padding: 0.25rem 0.85rem;
  border-radius: 20px;
  font-size: 0.8125rem;
  font-weight: 700;
  z-index: 2;
  box-shadow: 0 4px 8px rgba(106, 91, 239, 0.25);
}

.card-header {
  padding: 1.75rem 1.5rem 1.25rem;
  text-align: center;
  border-bottom: 1px solid #f0efff;
}
.product-name {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 1rem;
  color: #1e293b;
}
.price-section {
  display: flex;
  justify-content: center;
  gap: 0.375rem;
  align-items: flex-end;
}
.price-value {
  font-size: 2rem;
  font-weight: 800;
  color: #1e293b;
  line-height: 1;
}
.price-unit {
  font-size: 0.9375rem;
  color: #64748b;
  align-self: flex-end;
  margin-bottom: 0.125rem;
}

.specs-list {
  list-style: none;
  padding: 1.5rem;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.specs-list li {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  font-size: 1rem;
  color: #374151;
  font-weight: 500;
}
.specs-list i {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f4ff;
  border-radius: 8px;
  color: #6A5BEF;
  font-size: 0.875rem;
}

.card-actions {
  padding: 0 1.5rem 1.75rem;
}
.btn {
  display: block;
  width: 100%;
  padding: 0.875rem;
  font-weight: 600;
  font-size: 1rem;
  border-radius: 12px;
  text-align: center;
  text-decoration: none;
  transition: all 0.2s ease;
}
.btn-primary {
  background: #6A5BEF;
  color: white;
  border: none;
  box-shadow: 0 2px 6px rgba(106, 91, 239, 0.2);
}
.btn-primary:hover {
  background: #5a4dbd;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(106, 91, 239, 0.3);
}

/* ========== RESPONSIVE ========== */
@media (max-width: 768px) {
  .public-products-layout {
    padding: 1.75rem 1rem;
  }
  .hero-title {
    font-size: 1.75rem;
  }
  .hero-subtitle {
    font-size: 1rem;
    padding: 0 0.5rem;
  }
  .price-value {
    font-size: 1.75rem;
  }
  .products-grid {
    gap: 1.25rem;
  }
  .product-card {
    border-radius: 14px;
  }
}
</style>