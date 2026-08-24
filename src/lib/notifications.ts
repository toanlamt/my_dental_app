import { formatDateTime } from '@/lib/utils';

export type NotificationType =
  | 'appointment_request_created'
  | 'appointment_confirmed'
  | 'appointment_cancelled'
  | 'appointment_rescheduled'
  | 'upcoming_appointment';

export type NotificationItem = {
  id: string;
  type: NotificationType;
  entity_type: 'appointment_request' | 'appointment' | 'patient' | 'system' | null;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
};

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

export function getNotificationRoute(notification: NotificationItem): string {
  if (notification.entity_type === 'patient' && notification.entity_id) {
    return `/patients/${notification.entity_id}`;
  }
  if (notification.entity_type === 'appointment_request') {
    if (notification.entity_id) return `/appointment-requests?requestId=${encodeURIComponent(notification.entity_id)}`;
    return '/appointment-requests';
  }
  if (notification.entity_type === 'appointment') {
    return '/calendar';
  }
  return '/notifications';
}

export function getNotificationI18nParams(notification: NotificationItem): Record<string, string> {
  const startAt = asString(notification.metadata?.start_at);
  return {
    datetime: startAt ? formatDateTime(startAt) : '',
  };
}
