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
