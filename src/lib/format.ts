/**
 * Number formatters used across Kinema UI.
 *
 * `formatNumber`     — locale-aware integer formatting (1.234.567 in Indonesian).
 * `formatCurrency`   — IDR with M/JT suffix for large amounts (Rp 1,2 JT, Rp 1,5 M).
 * `formatBigNumber`  — compact non-currency (1JT, 1RB) for chart ticks + counters.
 */

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('id-ID').format(num);
}

export function formatCurrency(num: number): string {
  if (num >= 1_000_000_000) {
    return `Rp ${(num / 1_000_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} M`;
  }
  if (num >= 1_000_000) {
    return `Rp ${(num / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} JT`;
  }
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(num);
}

/**
 * Compact big-number formatter for charts and stat cards. Indonesian convention:
 * 1.000 → 1RB, 1.000.000 → 1JT. Pass `precise: true` for tooltip values (extra
 * decimal); ticks default to short form.
 */
export function formatBigNumber(val: number, precise = false): string {
  if (val >= 1_000_000) {
    return `${(val / 1_000_000).toFixed(precise ? 2 : 1)}JT`;
  }
  if (val >= 1_000) {
    return `${(val / 1_000).toFixed(precise ? 1 : 0)}RB`;
  }
  return val.toLocaleString('id-ID');
}
