import { ref, computed } from 'vue';
import type {
  ClientPublicProduct,
  ClientPricingDTO,
  ClientTemplateDTO,
  ClientCategoryDTO,
} from '@/api/publicProduct';
import { getPublicProductDetail } from '@/api/publicProduct';

export function useProductDetail() {
  const productDetail = ref<ClientPublicProduct | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const selectedDuration = ref<number>(1); // default 1 bulan

  const fetchProductDetail = async (publicId: string) => {
    loading.value = true;
    error.value = null;
    try {
      const res = await getPublicProductDetail(publicId);
      if (res.data.success) {
        const data = res.data.data;

        // --------------------------
        // Ambil semua region unik dari master template
        // --------------------------
        const regionSet = new Set<string>();
        data.categories?.forEach(cat => {
          cat.groups.forEach(grp => {
            grp.templates.forEach(tpl => {
              if ((tpl as any).isMasterHypervisor && (tpl as any).availableRegions) {
                (tpl as any).availableRegions.forEach((r: string) => regionSet.add(r));
              }
            });
          });
        });

        data.regions = Array.from(regionSet);

        productDetail.value = data;

        // Set default duration jika ada pricing
        const pricingList = productDetail.value?.pricing;
        if (pricingList && pricingList.length > 0) {
          const sorted = [...pricingList].sort((a, b) => a.months - b.months);
          const firstPricing = sorted[0]; 
          if (firstPricing) {
            selectedDuration.value = firstPricing.months;
          }
        }
      } else {
        productDetail.value = null;
        error.value = 'Product not found';
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch product detail';
      productDetail.value = null;
    } finally {
      loading.value = false;
    }
  };

  // --------------------------
  // Durasi & Harga
  // --------------------------
  const getPricingOptions = () => {
    const pricingList = productDetail.value?.pricing;
    if (!pricingList) return [];
    return [...pricingList]
      .sort((a, b) => a.months - b.months)
      .map(p => ({
        value: p.months,
        label: p.durationLabel,
        price: p.price,
        originalPrice: p.price,
        savings: p.backupPrice ?? 0,
      }));
  };

  const setSelectedDuration = (months: number) => {
    selectedDuration.value = months;
  };

  const getSelectedPricing = (): ClientPricingDTO | null => {
    const pricingList = productDetail.value?.pricing;
    if (!pricingList) return null;
    return pricingList.find(p => p.months === selectedDuration.value) || null;
  };

  const getPricePerMonth = (pricing: ClientPricingDTO | null): number => {
    if (!pricing) return 0;
    return Math.ceil(pricing.price / pricing.months);
  };

  const getOriginalPricePerMonth = (pricing: ClientPricingDTO | null): number => {
    if (!pricing) return 0;
    return Math.ceil(pricing.price / pricing.months);
  };

  // --------------------------
  // Regions
  // --------------------------
  const getRegions = (): string[] => {
    return Array.isArray(productDetail.value?.regions) ? productDetail.value.regions : [];
  };

const getLatencyInfo = (region?: string): number | string | undefined => {
  if (!region) return 'Region tidak tersedia';
  // return data latensi dari sumber / variable / service
  // jika belum ada data, jangan return angka statis
  return undefined; 
};



  // --------------------------
  // Categories & Templates
  // --------------------------
  const getCategories = (): ClientCategoryDTO[] => productDetail.value?.categories ?? [];

  const getAllTemplates = (): ClientTemplateDTO[] => {
    const categories = productDetail.value?.categories ?? [];
    const templates: ClientTemplateDTO[] = [];
    categories.forEach(cat => {
      cat.groups.forEach(grp => {
        grp.templates.forEach(tpl => {
          if (tpl.isMasterHypervisor) templates.push({ ...tpl });
        });
      });
    });
    return templates;
  };

  const getTemplatesByType = (type: 'biasa' | 'panel' | 'aplikasi'): ClientTemplateDTO[] => {
    const allTemplates = getAllTemplates();
    switch (type) {
      case 'biasa':
        return allTemplates.filter(
          tpl => !tpl.name.toLowerCase().includes('panel') && !tpl.name.toLowerCase().includes('wordpress')
        );
      case 'panel':
        return allTemplates.filter(
          tpl =>
            tpl.name.toLowerCase().includes('panel') ||
            tpl.name.toLowerCase().includes('cpanel') ||
            tpl.name.toLowerCase().includes('whm')
        );
      case 'aplikasi':
        return allTemplates.filter(tpl =>
          ['wordpress', 'woocommerce', 'docker', 'n8n', 'openlitespeed', 'icewarp'].some(keyword =>
            tpl.name.toLowerCase().includes(keyword)
          )
        );
      default:
        return allTemplates;
    }
  };

  // --------------------------
  // Backup Policy
  // --------------------------
  const hasBackupPolicy = (): boolean => !!productDetail.value?.backupPolicy;

  const getBackupPrice = (): number => getSelectedPricing()?.backupPrice ?? 0;

  // --------------------------
  // Computed Properties
  // --------------------------
  const selectedPricing = computed(() => getSelectedPricing());
  const pricePerMonth = computed(() => getPricePerMonth(selectedPricing.value));
  const originalPricePerMonth = computed(() => getOriginalPricePerMonth(selectedPricing.value));
  const isDiscounted = computed(() => false);

  const savingsAmount = computed(() => {
    const pricing = selectedPricing.value;
    if (!pricing) return 0;
    const otherPricings = productDetail.value?.pricing?.filter(p => p.months !== selectedDuration.value) || [];
    if (otherPricings.length > 0) {
      const cheapestOther = Math.min(...otherPricings.map(p => Math.ceil(p.price / p.months)));
      const originalMonthly = Math.ceil(pricing.price / pricing.months);
      return cheapestOther - originalMonthly;
    }
    return 0;
  });

  return {
    productDetail,
    loading,
    error,
    fetchProductDetail,
    selectedDuration,
    setSelectedDuration,
    getPricingOptions,
    getSelectedPricing,
    getPricePerMonth,
    getOriginalPricePerMonth,
    getRegions,
    getLatencyInfo,
    getCategories,
    getAllTemplates,
    getTemplatesByType,
    hasBackupPolicy,
    getBackupPrice,
    selectedPricing,
    pricePerMonth,
    originalPricePerMonth,
    isDiscounted,
    savingsAmount,
  };
}
