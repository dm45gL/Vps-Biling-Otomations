<template>
  <div class="checkout-page">
    <div class="columns is-gapless">
      <!-- Form Section (Kiri) -->
      <div class="column is-12-tablet is-8-desktop">
        <div class="form-section card">
          <header class="card-header">
            <p class="card-header-title">Detail Penagihan</p>
          </header>
          <div class="card-content">
            <!-- Error Global -->
            <div v-if="errorProduct || error" class="notification is-danger is-light mb-4">
              {{ errorProduct || error }}
            </div>

            <!-- Billing Address Form -->
            <BillingAddressForm
              v-model="billingAddress"
              :disabled="checkoutLoading"
            />

            <!-- Backup Toggle -->
            <div class="field mt-5" v-if="productDetail">
              <label class="label">
                <input
                  v-model="backupEnabled"
                  type="checkbox"
                  class="checkbox mr-2"
                />
                Aktifkan Backup Otomatis (Rp {{ formatPrice(backupCostPerMonth) }}/bulan)
              </label>
              <p class="help">
                Backup harian disimpan selama 7 hari. Dapat dinonaktifkan kapan saja.
              </p>
            </div>

            <!-- Promo Code -->
            <div class="field mt-4">
              <label class="label">Kode Promo (Opsional)</label>
              <div class="field has-addons">
                <div class="control is-expanded">
                  <input
                    v-model="promoCode"
                    :disabled="checkoutLoading || promoLoading"
                    class="input"
                    type="text"
                    placeholder="Masukkan kode promo"
                    @keyup.enter="triggerPromoValidation"
                  />
                </div>
                <div class="control">
                  <button
                    type="button"
                    class="button is-primary"
                    :class="{ 'is-loading': promoLoading }"
                    :disabled="promoLoading"
                    @click="triggerPromoValidation"
                  >
                    Terapkan
                  </button>
                </div>
              </div>
              <p v-if="promoResult" class="help has-text-success mt-2">
                ✔ Promo berhasil diterapkan! Diskon Rp {{ formatPrice(promoResult.discount) }}
              </p>
              <p v-if="promoError" class="help has-text-danger mt-2">
                {{ promoError }}
              </p>
            </div>

            <!-- Submit Button -->
            <div class="mt-6">
              <button
                class="button is-fullwidth is-primary is-size-5 py-3"
                :class="{ 'is-loading': checkoutLoading }"
                :disabled="checkoutLoading || !isFormValid || !productDetail"
                @click="handleSubmit"
              >
                Lanjutkan ke Pembayaran
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Summary Section (Kanan) -->
      <div class="column is-12-tablet is-4-desktop">
        <div class="summary-section card is-sticky">
          <header class="card-header">
            <p class="card-header-title">Ringkasan Pesanan</p>
          </header>
          <div class="card-content">
            <div v-if="productDetail">
              <div class="summary-item">
                <span class="label">Paket</span>
                <span class="value">{{ productName }}</span>
              </div>
              <div class="summary-item">
                <span class="label">Durasi</span>
                <span class="value">{{ durationMonths }} bulan</span>
              </div>
              <div class="summary-item">
                <span class="label">Region</span>
                <span class="value">{{ selectedRegion }}</span>
              </div>
              <div class="summary-item">
                <span class="label">Harga Dasar</span>
                <span class="value">Rp {{ formatPrice(basePrice) }}</span>
              </div>
              <div v-if="backupEnabled" class="summary-item">
                <span class="label">Backup</span>
                <span class="value">+ Rp {{ formatPrice(backupCostPerMonth * durationMonths) }}</span>
              </div>
              <div v-if="promoResult?.discount" class="summary-item">
                <span class="label">Diskon</span>
                <span class="value has-text-danger">– Rp {{ formatPrice(promoResult.discount) }}</span>
              </div>
              <hr class="my-3" />
              <div class="summary-item total">
                <span class="label">Total</span>
                <span class="value">Rp {{ formatPrice(totalPrice) }}</span>
              </div>
              <p class="help mt-3">
                Anda akan diarahkan ke halaman pembayaran Xendit setelah checkout.
              </p>
            </div>
            <div v-else>
              <p>Memuat produk...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useClientAuth } from '@/composables/auth/useClientAuth';
import { usePromoClient } from '@/composables/usePromo';
import { useOrderClient } from '@/composables/useOrderClient';
import BillingAddressForm from '../components/checkout/BillingAddressForm.vue';
import { formatPrice } from '@/utils/formatters';
import { getPublicProductDetail } from '@/api/publicProduct';
import type { ClientProductDTO } from '@/api/publicProduct';

// ------------------------
// Auth & Route
// ------------------------
const route = useRoute();
const { client } = useClientAuth();

// ------------------------
// State
// ------------------------
const productDetail = ref<ClientProductDTO | null>(null);
const loadingProduct = ref(false);
const errorProduct = ref<string | null>(null);

const publicId = (route.query.publicId as string) || '';
const pricingId = (route.query.pricingId as string) || '';
const regionParam = (route.query.region as string) || '';
const backupParam = route.query.backupEnabled === '1';

const backupEnabled = ref(backupParam);
const promoCode = ref('');

// Billing form
const billingAddress = ref({
  fullName: '',
  email: '',
  companyName: '',
  country: 'Indonesia',
  state: '',
  city: '',
  addressLine1: '',
  addressLine2: '',
  postalCode: '',
  phone: '',
});

// ------------------------
// Composables
// ------------------------
const { checkout, loading: checkoutLoading, error } = useOrderClient();
const { validate: validatePromo, result: promoResult, loading: promoLoading, error: promoError } = usePromoClient();

// ------------------------
// Selected options
// ------------------------
const selectedRegion = ref('');
const selectedDuration = ref<number>(0);
const selectedPricingId = ref<string>('');
const selectedTemplate = ref<string>('');

// ------------------------
// Fetch Product Detail
// ------------------------
const fetchProductDetail = async (publicId: string) => {
  loadingProduct.value = true;
  errorProduct.value = null;

  try {
    const res = await getPublicProductDetail(publicId);
    if (!res.data.success) throw new Error('Gagal mengambil detail produk');

    productDetail.value = res.data.data;

    // Region default
    selectedRegion.value =
      regionParam && productDetail.value.regions?.includes(regionParam)
        ? regionParam
        : productDetail.value.regions?.[0] ?? '';

    // Pricing default
    const pricingOption =
      productDetail.value.pricing?.find(
        p => p.id === pricingId || p.months.toString() === pricingId
      ) ?? productDetail.value.pricing?.[0];

    selectedDuration.value = pricingOption?.months ?? 0;
    selectedPricingId.value = pricingOption?.id ?? '';

    // Template default (ambil template pertama dari kategori pertama)
    const firstCategory = productDetail.value.categories?.[0];
    const firstTemplate = firstCategory?.groups?.[0]?.templates?.[0];
    selectedTemplate.value = firstTemplate?.id || '';
  } catch (err: any) {
    console.error(err);
    errorProduct.value = err.message || 'Terjadi kesalahan';
  } finally {
    loadingProduct.value = false;
  }
};

// ------------------------
// Computed
// ------------------------
const productName = computed(() => productDetail.value?.name ?? '—');

const basePrice = computed(() => {
  const p = productDetail.value?.pricing?.find(p => p.id === selectedPricingId.value);
  return p?.price ?? 0;
});

const durationMonths = computed(() => selectedDuration.value);

const backupCostPerMonth = computed(() => {
  const p = productDetail.value?.pricing?.find(p => p.id === selectedPricingId.value);
  return p?.backupPrice ?? 0;
});

const totalPrice = computed(() => {
  let total =
    basePrice.value +
    (backupEnabled.value ? backupCostPerMonth.value * durationMonths.value : 0);

  if (promoResult.value?.discount) total -= promoResult.value.discount;

  return total > 0 ? total : 0;
});

// ------------------------
// Promo Validation
// ------------------------
const triggerPromoValidation = async () => {
  if (!promoCode.value || !totalPrice.value) return;

  try {
    await validatePromo({
      code: promoCode.value,
      amount: totalPrice.value,
    });
  } catch {
    // error sudah ditangani composable
  }
};
watch([promoCode, totalPrice], triggerPromoValidation);

// ------------------------
// Form Validation
// ------------------------
const isFormValid = computed(() => {
  const a = billingAddress.value;
  return (
    a.fullName &&
    a.email &&
    a.country &&
    a.state &&
    a.city &&
    a.addressLine1 &&
    a.postalCode &&
    a.phone &&
    selectedRegion.value &&
    selectedPricingId.value &&
    selectedTemplate.value
  );
});

// ------------------------
// Submit Order → Redirect Xendit
// ------------------------
const handleSubmit = async () => {
  if (!isFormValid.value) {
    alert('Form belum lengkap atau pilihan produk belum dipilih');
    return;
  }

  if (!client.value?.id) {
    alert('Kamu harus login sebelum checkout');
    return;
  }

  try {
    const res = await checkout({
      pricingId: selectedPricingId.value,
      promoId: promoResult.value?.promoId || undefined,
      backupEnabled: backupEnabled.value,
      billingAddress: billingAddress.value,
      region: selectedRegion.value,
      templateId: selectedTemplate.value,
    });

    if (!res?.invoiceUrl) throw new Error('Invoice URL tidak ditemukan');

    // Redirect ke Xendit
    window.location.href = res.invoiceUrl;
  } catch (err: any) {
    console.error('Order error:', err);
    alert(error.value || 'Gagal membuat order');
  }
};

// ------------------------
// Init
// ------------------------
onMounted(() => {
  if (publicId) fetchProductDetail(publicId);
  else errorProduct.value = 'ID produk tidak valid';
});
</script>















<style scoped>
.checkout-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem;
}

.card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid #f0efff;
}

.card-header {
  background-color: #faf9ff;
  border-bottom: 1px solid #f0efff;
}
.card-header-title {
  font-weight: 600;
  color: #1e293b;
  font-size: 1.125rem;
}

.summary-section {
  position: sticky;
  top: 2rem;
}
.summary-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}
.summary-item .label {
  color: #64748b;
  font-weight: 500;
}
.summary-item .value {
  font-weight: 600;
  color: #1e293b;
}
.summary-item.total .value {
  font-size: 1.25rem;
  color: #6A5BEF;
  font-weight: 700;
}

/* Override Bulma primary */
:deep(.button.is-primary) {
  background-color: #6A5BEF;
  border-color: transparent;
}
:deep(.button.is-primary:hover) {
  background-color: #5a4dbd;
}

hr {
  border-color: #f0efff;
}

@media (max-width: 1023px) {
  .is-sticky {
    position: static;
  }
}
</style>