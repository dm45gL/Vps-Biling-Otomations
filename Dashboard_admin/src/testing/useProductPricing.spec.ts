// tests/composables/useProductPricing.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useProductPricing } from '@/composables/business/useProductPricing';
import * as api from '@/api/busines/productPricing';

vi.mock('@/api/busines/productPricing');

describe('useProductPricing', () => {
  let composable: ReturnType<typeof useProductPricing>;

  const fakePricings = [
    {
      id: '1',
      rawProductId: 'prod1',
      pricingDurationId: 'd1',
      price: 100,
      backupPrice: null,
      isActive: true,
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
      pricingDuration: { id: 'd1', label: '1 Month', months: 1 },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    composable = useProductPricing();
  });

  it('fetchByRawProduct sets pricings correctly', async () => {
    (api.listPricingByRawProduct as any).mockResolvedValue({ data: fakePricings });
    
    await composable.fetchByRawProduct('prod1');

    expect(composable.pricings.value).toEqual(fakePricings);
    expect(composable.error.value).toBeNull();
    expect(composable.loading.value.fetching).toBe(false);
  });

  it('addBatch calls API and refetches', async () => {
    (api.createPricingBatch as any).mockResolvedValue({ data: [] });
    (api.listPricingByRawProduct as any).mockResolvedValue({ data: fakePricings });

    await composable.addBatch('prod1', [{ months: 1, price: 100 }]);

    expect(api.createPricingBatch).toHaveBeenCalledWith({
      rawProductId: 'prod1',
      pricings: [{ months: 1, price: 100, backupPrice: null }],
    });
    expect(composable.pricings.value).toEqual(fakePricings);
  });

  it('updateItem updates local state', async () => {
    composable.pricings.value = [...fakePricings];
    const updatedItem = { ...fakePricings[0], price: 200 };
    (api.updatePricing as any).mockResolvedValue({ data: updatedItem });

    await composable.updateItem('1', { price: 200 });

    expect(composable.pricings.value[0].price).toBe(200);
  });

  it('removeItem deletes pricing locally if no rawProductId', async () => {
    composable.pricings.value = [...fakePricings];
    (api.deletePricing as any).mockResolvedValue({ success: true });

    await composable.removeItem('1');

    expect(composable.pricings.value).toHaveLength(0);
  });

  it('removeItem calls fetchByRawProduct if rawProductId provided', async () => {
    composable.pricings.value = [...fakePricings];
    (api.deletePricing as any).mockResolvedValue({ success: true });
    (api.listPricingByRawProduct as any).mockResolvedValue({ data: fakePricings });

    await composable.removeItem('1', 'prod1');

    expect(api.listPricingByRawProduct).toHaveBeenCalledWith('prod1');
    expect(composable.pricings.value).toEqual(fakePricings);
  });
});
