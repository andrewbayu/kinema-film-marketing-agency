import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('id-ID').format(num);
}

export function formatCurrency(num: number): string {
  if (num >= 1000000000) {
    return `Rp ${(num / 1000000000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} M`;
  }
  if (num >= 1000000) {
    return `Rp ${(num / 1000000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} JT`;
  }
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(num);
}
