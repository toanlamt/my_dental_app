import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { apiRequest } from '@/lib/auth-context';
import { formatDateTime, formatRelativeTime } from '@/lib/utils';
import { getNotificationI18nParams, getNotificationRoute, type NotificationItem } from '@/lib/notifications';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

type NotificationListResponse = {
  notifications: NotificationItem[];
  total: number;
  unread: number;
  page: number;
  pageSize: number;
};

export function NotificationBell() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const unreadLabel = useMemo(() => {
    if (unreadCount <= 99) return String(unreadCount);
    return '99+';
  }, [unreadCount]);

  const loadUnreadCount = async () => {
    try {
      const result = await apiRequest<{ unread: number }>('/api/notifications/unread-count');
      setUnreadCount(result.unread);
    } catch {
      setUnreadCount(0);
    }
  };

  const loadNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await apiRequest<NotificationListResponse>('/api/notifications?page=1&pageSize=8');
      setNotifications(result.notifications);
      setUnreadCount(result.unread);
    } catch {
      setError(t('notifications.unableToLoad'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUnreadCount();
  }, []);

  useEffect(() => {
    if (!open) return;
    void loadNotifications();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  const markRead = async (notificationId: string) => {
    try {
      await apiRequest(`/api/notifications/${notificationId}/read`, { method: 'PATCH' });
      setNotifications((current) =>
        current.map((item) => (item.id === notificationId ? { ...item, read_at: item.read_at ?? new Date().toISOString() } : item)),
      );
      setUnreadCount((current) => Math.max(0, current - 1));
    } catch {
      setError(t('notifications.unableToMarkRead'));
    }
  };

  const onOpenNotification = async (notification: NotificationItem) => {
    if (!notification.read_at) {
      await markRead(notification.id);
    }
    setOpen(false);
    navigate(getNotificationRoute(notification));
  };

  const onMarkAllRead = async () => {
    try {
      await apiRequest('/api/notifications/read-all', { method: 'POST' });
      setNotifications((current) => current.map((item) => ({ ...item, read_at: item.read_at ?? new Date().toISOString() })));
      setUnreadCount(0);
    } catch {
      setError(t('notifications.unableToMarkRead'));
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        className="relative rounded-md p-2 text-slate-500 hover:bg-slate-100"
        aria-label={t('navigation.notifications')}
        onClick={() => setOpen((current) => !current)}
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-amber-500 px-1.5 py-0.5 text-center text-[10px] font-semibold text-white">
            {unreadLabel}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[360px] rounded-lg border bg-white p-3 shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">{t('notifications.title')}</p>
            <Button size="sm" variant="ghost" onClick={onMarkAllRead} disabled={unreadCount === 0}>
              {t('notifications.markAllAsRead')}
            </Button>
          </div>

          {error && <p role="alert" aria-live="assertive" className="mb-2 rounded-md bg-red-50 px-2 py-1 text-xs text-red-700">{error}</p>}

          {loading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">{t('common.loading')}</p>
          ) : notifications.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">{t('notifications.empty')}</p>
          ) : (
            <div className="max-h-80 space-y-2 overflow-auto pr-1">
              {notifications.map((notification) => {
                const params = getNotificationI18nParams(notification);
                return (
                  <button
                    type="button"
                    key={notification.id}
                    className={`w-full rounded-md border p-2 text-left transition hover:bg-slate-50 ${notification.read_at ? 'border-slate-200' : 'border-amber-200 bg-amber-50/40'}`}
                    onClick={() => void onOpenNotification(notification)}
                  >
                    <p className="text-sm font-medium text-slate-900">
                      {t(`notifications.types.${notification.type}.title`, { defaultValue: notification.type.replaceAll('_', ' ') })}
                    </p>
                    {!notification.read_at && <p className="mt-0.5 text-[11px] font-semibold text-amber-700">{t('notifications.filters.unread')}</p>}
                    <p className="mt-0.5 text-xs text-slate-600">
                      {t(`notifications.types.${notification.type}.message`, params)}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground" title={formatDateTime(notification.created_at)}>
                      {formatRelativeTime(notification.created_at)}
                    </p>
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-3 border-t pt-2 text-right">
            <Link to="/notifications" className="text-xs font-medium text-primary" onClick={() => setOpen(false)}>
              {t('notifications.viewAll')}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
