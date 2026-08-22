import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/protected-route';
import { AppLayout } from '@/layouts/app-layout';
import { LoginPage } from '@/pages/login-page';
import { DashboardPageV2 as DashboardPage } from '@/pages/dashboard-page-v2';
import { PatientsPageV2 as PatientsPage } from '@/pages/patients-page-v2';
import { PatientDetailPageV2 as PatientDetailPage } from '@/pages/patient-detail-page-v2';
import { CalendarPageV2 as CalendarPage } from '@/pages/calendar-page-v2';
import '@/i18n';

export default function AppRouter() {
  return <BrowserRouter><AuthProvider><Routes><Route path="/login" element={<LoginPage />} /><Route element={<ProtectedRoute />}><Route element={<AppLayout />}><Route index element={<DashboardPage />} /><Route path="patients" element={<PatientsPage />} /><Route path="patients/:id" element={<PatientDetailPage />} /><Route path="calendar" element={<CalendarPage />} /></Route></Route><Route path="*" element={<Navigate to="/" replace />} /></Routes></AuthProvider></BrowserRouter>;
}
