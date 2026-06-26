import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns';
import { env } from '../config/env';

export function formatCurrency(amount: number, symbol = env.CURRENCY_SYMBOL, locale = env.CURRENCY_LOCALE): string {
  return `${symbol}${amount.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(date: Date | string, fmt = 'MMM dd, yyyy'): string {
  return format(new Date(date), fmt);
}

export function getTodayRange(): { from: Date; to: Date } {
  const now = new Date();
  return { from: startOfDay(now), to: endOfDay(now) };
}

export function getWeekRange(): { from: Date; to: Date } {
  const now = new Date();
  return { from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfWeek(now, { weekStartsOn: 1 }) };
}

export function getMonthRange(): { from: Date; to: Date } {
  const now = new Date();
  return { from: startOfMonth(now), to: endOfMonth(now) };
}

export function getLastNDaysRange(n: number): { from: Date; to: Date } {
  return { from: startOfDay(subDays(new Date(), n - 1)), to: endOfDay(new Date()) };
}

export function parseDateRange(from?: string, to?: string): { from: Date; to: Date } {
  const now = new Date();
  return {
    from: from ? startOfDay(new Date(from)) : startOfMonth(now),
    to: to ? endOfDay(new Date(to)) : endOfDay(now),
  };
}
