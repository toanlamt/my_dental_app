import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/protected-route';
import { AppLayout } from '@/layouts/app-layout';
import { LoginPage } from '@/pages/login-page';
import { DashboardPageV2 as DashboardPage } from '@/pages/dashboard-page-v2';
import { PatientsPageV2 as PatientsPage } from '@/pages/patients-page-v2';
import { PatientDetailPageV2 as PatientDetailPage } from '@/pages/patient-detail-page-v2';
import { CalendarPageV2 as CalendarPage } from '@/pages/calendar-page-v2';
import { PublicLayout } from '@/layouts/public-layout';
import { LandingPage } from '@/pages/landing-page';
import { AboutPage, ContactPage, DoctorDetailPage, DoctorsPage, FaqPage, ServiceDetailPage, ServicesPage } from '@/pages/public-pages';
import '@/i18n';

export default function AppRouter() {
  return <BrowserRouter><AuthProvider><Routes><Route element={<PublicLayout />}><Route index element={<LandingPage />} /><Route path="services" element={<ServicesPage />} /><Route path="services/:slug" element={<ServiceDetailPage />} /><Route path="about" element={<AboutPage />} /><Route path="doctors" element={<DoctorsPage />} /><Route path="doctors/:slug" element={<DoctorDetailPage />} /><Route path="faq" element={<FaqPage />} /><Route path="contact" element={<ContactPage />} /></Route><Route path="/login" element={<LoginPage />} /><Route element={<ProtectedRoute />}><Route element={<AppLayout />}><Route path="/dashboard" element={<DashboardPage />} /><Route path="/patients" element={<PatientsPage />} /><Route path="/patients/:id" element={<PatientDetailPage />} /><Route path="/calendar" element={<CalendarPage />} /></Route></Route><Route path="*" element={<Navigate to="/" replace />} /></Routes></AuthProvider></BrowserRouter>;
}
