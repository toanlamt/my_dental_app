import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/protected-route';
import { AppLayout } from '@/layouts/app-layout';
import { PublicLayout } from '@/layouts/public-layout';
import { useTranslation } from 'react-i18next';
import { AppErrorBoundary } from '@/components/app-error-boundary';
import { NotFoundPage } from '@/pages/not-found-page';
import '@/i18n';

const LoginPage = lazy(() => import('@/pages/login-page').then((module) => ({ default: module.LoginPage })));
const DashboardPage = lazy(() => import('@/pages/dashboard-page-v2').then((module) => ({ default: module.DashboardPageV2 })));
const PatientsPage = lazy(() => import('@/pages/patients-page-v2').then((module) => ({ default: module.PatientsPageV2 })));
const PatientDetailPage = lazy(() => import('@/pages/patient-detail-page-v2').then((module) => ({ default: module.PatientDetailPageV2 })));
const CalendarPage = lazy(() => import('@/pages/calendar-page-v2').then((module) => ({ default: module.CalendarPageV2 })));
const LandingPage = lazy(() => import('@/pages/landing-page').then((module) => ({ default: module.LandingPage })));
const ServicesPage = lazy(() => import('@/pages/public-pages').then((module) => ({ default: module.ServicesPage })));
const ServiceDetailPage = lazy(() => import('@/pages/public-pages').then((module) => ({ default: module.ServiceDetailPage })));
const AboutPage = lazy(() => import('@/pages/public-pages').then((module) => ({ default: module.AboutPage })));
const DoctorsPage = lazy(() => import('@/pages/public-pages').then((module) => ({ default: module.DoctorsPage })));
const DoctorDetailPage = lazy(() => import('@/pages/public-pages').then((module) => ({ default: module.DoctorDetailPage })));
const FaqPage = lazy(() => import('@/pages/public-pages').then((module) => ({ default: module.FaqPage })));
const ContactPage = lazy(() => import('@/pages/public-pages').then((module) => ({ default: module.ContactPage })));
const AppointmentBookingPage = lazy(() =>
  import('@/pages/appointment-booking-page').then((module) => ({ default: module.AppointmentBookingPage })),
);
const AppointmentRequestsPage = lazy(() => import('@/pages/appointment-requests-page'));
const NotificationsPage = lazy(() => import('@/pages/notifications-page').then((module) => ({ default: module.NotificationsPage })));

function RouteLoadingFallback() {
  const { t } = useTranslation();
  return (
    <main className="mx-auto max-w-7xl px-5 py-20 text-center text-sm text-muted-foreground lg:px-8">
      {t('common.loading')}
    </main>
  );
}

function AppContent() {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="services/:slug" element={<ServiceDetailPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="doctors" element={<DoctorsPage />} />
          <Route path="doctors/:slug" element={<DoctorDetailPage />} />
          <Route path="faq" element={<FaqPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="book" element={<AppointmentBookingPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/patients" element={<PatientsPage />} />
            <Route path="/patients/:id" element={<PatientDetailPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/appointment-requests" element={<AppointmentRequestsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

function AppBoundary() {
  const { t } = useTranslation();

  return (
    <AppErrorBoundary
      title={t('phase9.errorBoundary.title')}
      description={t('phase9.errorBoundary.description')}
      reloadLabel={t('phase9.errorBoundary.reload')}
      homeLabel={t('publicPages.common.backHome')}
    >
      <AppContent />
    </AppErrorBoundary>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppBoundary />
      </AuthProvider>
    </BrowserRouter>
  );
}
