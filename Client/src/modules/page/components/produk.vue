<template>
  <div class="public-products-layout">
    <!-- Hero Section -->
    <div class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">VPS Hosting Plans</h1>
        <p class="hero-subtitle">
          Reliable, scalable, and high-performance virtual servers.<br />
          Choose your plan and deploy in seconds.
        </p>
      </div>
    </div>

    <!-- Products Grid -->
    <div class="products-container">
      <!-- Loading & Error -->
      <div v-if="loadingProducts" class="status-message info">
        <div class="spinner"></div>
        <span>Loading available plans...</span>
      </div>
      <div v-else-if="errorProducts" class="status-message error">
        <i class="fas fa-exclamation-circle"></i>
        <span>{{ errorProducts }}</span>
      </div>

      <!-- Product Cards -->
      <div v-else class="products-grid">
        <div
          v-for="product in products"
          :key="product.publicId"
          class="product-card"
          :class="{ 'featured': isPopular(product.name) }"
        >
          <!-- Badge (opsional) -->
          <div v-if="isPopular(product.name)" class="badge-popular">Most Popular</div>

          <div class="card-header">
            <h2 class="product-name">{{ product.name }}</h2>
            <div class="price-section">
              <span class="price-value">Rp {{ formatPrice(getPricePerMonth(product.pricing)) }}</span>
              <span class="price-unit">/bulan</span>
            </div>
          </div>

          <ul class="specs-list">
            <li>
              <i class="fas fa-microchip"></i>
              <span>{{ product.specs.cpu }} vCPU</span>
            </li>
            <li>
              <i class="fas fa-memory"></i>
              <span>{{ product.specs.ram }} MB RAM</span>
            </li>
            <li>
              <i class="fas fa-hdd"></i>
              <span>{{ product.specs.disk }} GB NVMe SSD</span>
            </li>
            <li>
              <i class="fas fa-exchange-alt"></i>
              <span>{{ product.specs.bandwidth }} GB Bandwidth</span>
            </li>
          </ul>

          <router-link
            :to="`/products/${product.publicId}`"
            class="btn btn-primary"
          >
            Beli Sekarang
          </router-link>
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
    errorProducts.value = err.message || 'Gagal memuat produk. Silakan coba lagi nanti.';
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

// Tandai produk populer (opsional)
const isPopular = (name: string): boolean => {
  return name.toLowerCase().includes('pro') || name.toLowerCase().includes('business');
};

onMounted(() => fetchProducts());
</script>

<style scoped>
/* ========== GLOBAL ========== */
.public-products-layout {
  padding: 3rem 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #ffffff;
  color: #1e293b;
}

/* ========== HERO ========== */
.hero-section {
  text-align: center;
  margin-bottom: 3.5rem;
  padding: 0 1rem;
}

.hero-title {
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0;
  background: linear-gradient(135deg, #1e293b, #475569);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  letter-spacing: -0.02em;
}

.hero-subtitle {
  font-size: 1.125rem;
  color: #64748b;
  margin-top: 1rem;
  line-height: 1.6;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
  font-weight: 400;
}

/* ========== STATUS MESSAGE ========== */
.status-message {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 2.5rem;
  font-size: 1rem;
  font-weight: 600;
}
.status-message.info {
  background: #f0f9ff;
  color: #0c4a6e;
}
.status-message.error {
  background: #fef2f2;
  color: #dc2626;
}

/* Spinner */
.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(14, 165, 233, 0.3);
  border-top: 2px solid #0ea5e9;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ========== PRODUCTS GRID ========== */
.products-container {
  padding: 0 1rem;
}
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

/* ========== PRODUCT CARD ========== */
.product-card {
  background: #ffffff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 16px -2px rgba(91, 62, 150, 0.06);
  transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
  position: relative;
  border: 1px solid #f0efff;
}
.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px -4px rgba(91, 62, 150, 0.12);
}

/* Badge Populer */
.badge-popular {
  position: absolute;
  top: -12px;
  right: -12px;
  background: #6A5BEF;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.825rem;
  font-weight: 700;
  box-shadow: 0 4px 10px rgba(106, 91, 239, 0.3);
  z-index: 2;
}

.card-header {
  padding: 2rem 1.5rem 1.25rem;
  text-align: center;
  border-bottom: 1px solid #f0efff;
}
.product-name {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 1rem;
  color: #1e293b;
  letter-spacing: -0.01em;
}
.price-section {
  display: flex;
  justify-content: center;
  gap: 0.25rem;
  align-items: flex-end;
}
.price-value {
  font-size: 2.25rem;
  font-weight: 800;
  color: #1e293b;
  line-height: 1;
}
.price-unit {
  font-size: 1rem;
  color: #64748b;
  margin-bottom: 0.25rem;
}

/* Specs */
.specs-list {
  list-style: none;
  padding: 1.5rem 1.5rem;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.specs-list li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1rem;
  color: #374151;
  font-weight: 500;
}
.specs-list li i {
  width: 24px;
  height: 24px;
  background: #f5f4ff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6A5BEF;
  font-size: 0.875rem;
}

/* CTA Button */
.btn {
  display: block;
  width: calc(100% - 3rem);
  margin: 0 auto 1.75rem;
  padding: 0.875rem;
  font-weight: 600;
  font-size: 1rem;
  border-radius: 12px;
  text-align: center;
  transition: all 0.2s ease;
  text-decoration: none;
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
  box-shadow: 0 4px 12px rgba(106, 91, 239, 0.3);
}

/* ========== RESPONSIVE ========== */
@media (max-width: 768px) {
  .public-products-layout {
    padding: 2rem 1rem;
  }
  .hero-title {
    font-size: 1.75rem;
  }
  .hero-subtitle {
    font-size: 1rem;
  }
  .price-value {
    font-size: 1.875rem;
  }
  .products-grid {
    gap: 1.5rem;
  }
  .product-card {
    border-radius: 12px;
  }
}
</style>