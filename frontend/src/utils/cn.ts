import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, symbol = '₹'): string {
  return `${symbol}${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

export function formatVolume(liters: number): string {
  if (liters >= 1000) return `${(liters / 1000).toFixed(1)}kL`;
  return `${liters.toFixed(0)}L`;
}

export function formatPercent(n: number): string {
  return `${n.toFixed(1)}%`;
}

export function formatDate(date: string | Date, opts?: Intl.DateTimeFormatOptions): string {
  return new Date(date).toLocaleDateString('en-US', opts || { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
}

export function getTankStatusColor(percent: number): string {
  if (percent <= 15) return '#EF4444';
  if (percent <= 30) return '#F59E0B';
  return '#10B981';
}

export function getPumpStatusColor(status: string): string {
  const colors: Record<string, string> = {
    ACTIVE: '#10B981',
    INACTIVE: '#64748B',
    MAINTENANCE: '#F59E0B',
  };
  return colors[status] || '#64748B';
}
