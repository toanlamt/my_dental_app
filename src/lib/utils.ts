import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import i18n from '@/i18n';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return i18n.t('common.notProvided');
  return new Intl.DateTimeFormat(i18n.language === 'vi' ? 'vi-VN' : 'en-US', { dateStyle: 'medium' }).format(new Date(`${value}T00:00:00`));
}

export function formatRelativeTime(value: string): string {
  const now = Date.now();
  const target = new Date(value).getTime();
  if (Number.isNaN(target)) return '';

  const diffMs = target - now;
  const diffMinutes = Math.round(diffMs / (60 * 1000));
  const diffHours = Math.round(diffMs / (60 * 60 * 1000));
  const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));
  const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (Math.abs(diffMinutes) < 60) return formatter.format(diffMinutes, 'minute');
  if (Math.abs(diffHours) < 24) return formatter.format(diffHours, 'hour');
  return formatter.format(diffDays, 'day');
}
