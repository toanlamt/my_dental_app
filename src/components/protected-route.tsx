import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { useTranslation } from 'react-i18next';

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  if (loading) return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">{t('common.loading')}</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}
