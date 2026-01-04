/**
 * Memformat angka menjadi string Rupiah (IDR) tanpa simbol "Rp" di awal.
 * Contoh: 1500000 → "1.500.000"
 *
 * @param value - Angka yang akan diformat (boleh number atau string numerik)
 * @returns string dalam format angka Indonesia, atau "0" jika tidak valid
 */
export const formatPrice = (value: number | string | null | undefined): string => {
  if (value == null || value === '') return '0';

  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';

  return new Intl.NumberFormat('id-ID').format(Math.floor(num));
};

/**
 * Memformat angka menjadi string Rupiah lengkap dengan simbol "Rp".
 * Contoh: 1500000 → "Rp 1.500.000"
 *
 * @param value - Angka yang akan diformat
 * @returns string dengan prefix "Rp"
 */
export const formatPriceWithCurrency = (value: number | string | null | undefined): string => {
  return `Rp ${formatPrice(value)}`;
};