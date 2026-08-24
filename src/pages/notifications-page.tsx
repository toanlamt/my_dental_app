import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/primitives';
import { formatDateTime, formatRelativeTime } from '@/lib/utils';
import { getNotificationI18nParams, getNotificationRoute, type NotificationItem } from '@/lib/notifications';
import { useTranslation } from 'react-i18next';

type NotificationListResponse = {
  notifications: NotificationItem[];
  total: number;
  unread: number;
  page: number;
  pageSize: number;
};

const PAGE_SIZE = 20;

export function NotificationsPage() {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  const load = async (nextPage: number, nextFilter: 'all' | 'unread') => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(nextPage), pageSize: String(PAGE_SIZE), filter: nextFilter });
      const result = await apiRequest<NotificationListResponse>(`/api/notifications?${params.toString()}`);
      setNotifications(result.notifications);
      setTotal(result.total);
      setUnread(result.unread);
      setPage(result.page);
    } catch {
      setError(t('notifications.unableToLoad'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(page, filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, page]);

  const markRead = async (notificationId: string) => {
    try {
      await apiRequest(`/api/notifications/${notificationId}/read`, { method: 'PATCH' });
      setNotifications((current) =>
        current.map((item) => (item.id === notificationId ? { ...item, read_at: item.read_at ?? new Date().toISOString() } : item)),
      );
      setUnread((current) => Math.max(0, current - 1));
    } catch {
      setError(t('notifications.unableToMarkRead'));
    }
  };

  const markAllRead = async () => {
    try {
      await apiRequest('/api/notifications/read-all', { method: 'POST' });
      setNotifications((current) => current.map((item) => ({ ...item, read_at: item.read_at ?? new Date().toISOString() })));
      setUnread(0);
      if (filter === 'unread') {
        await load(1, 'unread');
      }
    } catch {
      setError(t('notifications.unableToMarkRead'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">{t('navigation.notifications')}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">{t('notifications.title')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('notifications.description')}</p>
        </div>
        <Button variant="outline" onClick={() => void markAllRead()} disabled={unread === 0}>
          {t('notifications.markAllAsRead')}
        </Button>
      </div>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <Card>
        <CardHeader className="sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>{t('notifications.title')}</CardTitle>
            <CardDescription>{t('notifications.unreadCount', { count: unread })}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant={filter === 'all' ? 'default' : 'outline'} onClick={() => { setPage(1); setFilter('all'); }}>
              {t('notifications.filters.all')}
            </Button>
            <Button size="sm" variant={filter === 'unread' ? 'default' : 'outline'} onClick={() => { setPage(1); setFilter('unread'); }}>
              {t('notifications.filters.unread')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-8 text-sm text-muted-foreground">{t('common.loading')}</p>
          ) : notifications.length === 0 ? (
            <p className="py-8 text-sm text-muted-foreground">{t('notifications.empty')}</p>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => {
                const params = getNotificationI18nParams(notification);
                return (
                  <div
                    key={notification.id}
                    className={`rounded-md border p-3 ${notification.read_at ? 'border-slate-200 bg-white' : 'border-amber-200 bg-amber-50/40'}`}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-medium text-slate-900">
                          {t(`notifications.types.${notification.type}.title`, { defaultValue: notification.type.replaceAll('_', ' ') })}
                        </p>
                        <p className="text-sm text-slate-600">{t(`notifications.types.${notification.type}.message`, params)}</p>
                        <p className="mt-1 text-xs text-muted-foreground" title={formatDateTime(notification.created_at)}>
                          {formatRelativeTime(notification.created_at)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Link to={getNotificationRoute(notification)}>
                          <Button size="sm" variant="outline">{t('notifications.open')}</Button>
                        </Link>
                        {!notification.read_at && (
                          <Button size="sm" variant="ghost" onClick={() => void markRead(notification.id)}>
                            {t('notifications.markAsRead')}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between border-t pt-3">
            <p className="text-sm text-muted-foreground">{t('patients.page', { page, pages: totalPages })}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                {t('patients.previous')}
              </Button>
              <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>
                {t('patients.next')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
