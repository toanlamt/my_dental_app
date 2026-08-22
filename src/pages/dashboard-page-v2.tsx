import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CalendarCheck2, CheckCircle2, Clock3, FileClock, Plus, UserPlus, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiRequest, useAuth } from '@/lib/auth-context';
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/primitives';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { formatDateTime } from '@/lib/utils';

type Appointment = {
  id: string;
  patient_id: string;
  doctor_id: string;
  start_at: string;
  end_at: string;
  status: string;
  reason: string | null;
};

type Dashboard = {
  summary: {
    today: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    no_show: number;
    pending_requests: number;
  };
  today: Appointment[];
  upcoming: Appointment[];
};

type PersonMap = Record<string, string>;

const statusVariant = (status: string) => {
  if (status === 'completed') return 'success' as const;
  if (status === 'cancelled') return 'danger' as const;
  if (status === 'no_show') return 'warning' as const;
  return 'default' as const;
};

export function DashboardPageV2() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [data, setData] = useState<Dashboard | null>(null);
  const [patients, setPatients] = useState<PersonMap>({});
  const [doctors, setDoctors] = useState<PersonMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const canSchedule = user?.role === 'admin' || user?.role === 'staff';

  const load = () => {
    setLoading(true);
    setError('');
    Promise.all([
      apiRequest<Dashboard>('/api/dashboard'),
      apiRequest<{ patients: { id: string; full_name: string }[] }>('/api/patients?pageSize=100'),
      apiRequest<{ doctors: { id: string; full_name: string }[] }>('/api/doctors'),
    ])
      .then(([dashboard, patientResult, doctorResult]) => {
        setData(dashboard);
        setPatients(Object.fromEntries(patientResult.patients.map((patient) => [patient.id, patient.full_name])));
        setDoctors(Object.fromEntries(doctorResult.doctors.map((doctor) => [doctor.id, doctor.full_name])));
      })
      .catch((err) => setError(err instanceof Error ? err.message : t('dashboard.unableToLoad')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(
    () => [
      { label: t('dashboard.todayAppointments'), value: data?.summary.today ?? 0, icon: CalendarCheck2 },
      { label: t('dashboard.confirmed'), value: data?.summary.confirmed ?? 0, icon: Clock3 },
      { label: t('dashboard.completed'), value: data?.summary.completed ?? 0, icon: CheckCircle2 },
      { label: t('dashboard.cancelled'), value: data?.summary.cancelled ?? 0, icon: XCircle },
      { label: t('appointments.status.no_show', { defaultValue: 'No-show' }), value: data?.summary.no_show ?? 0, icon: XCircle },
    ],
    [data, t],
  );

  const patientName = (id: string) => patients[id] ?? t('patients.patient');
  const doctorName = (id: string) => doctors[id] ?? t('appointments.doctor');

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">{t('dashboard.overview')}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            {t('dashboard.greeting', { name: user?.full_name.split(' ')[0] })}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('dashboard.description')}</p>
        </div>
        <Button onClick={() => window.location.assign('/calendar')}>
          {t('dashboard.openCalendar')} <ArrowRight size={16} />
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/patients">
          <Button className="w-full justify-start" variant="outline">
            <UserPlus size={16} /> {t('patients.add')}
          </Button>
        </Link>
        {canSchedule && (
          <Link to="/calendar">
            <Button className="w-full justify-start" variant="outline">
              <Plus size={16} /> {t('appointments.schedule')}
            </Button>
          </Link>
        )}
        <Link to="/calendar">
          <Button className="w-full justify-start" variant="outline">
            <CalendarCheck2 size={16} /> {t('dashboard.openCalendar')}
          </Button>
        </Link>
        <Link to="/appointment-requests">
          <Button className="w-full justify-start" variant="outline">
            <FileClock size={16} /> {t('navigation.appointmentRequests')}
          </Button>
        </Link>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          <p>{error}</p>
          <Button className="mt-3" variant="outline" size="sm" onClick={load}>
            {t('common.retry')}
          </Button>
        </div>
      )}

      {loading ? (
        <p className="py-12 text-center text-sm text-muted-foreground">{t('dashboard.loading')}</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {stats.map(({ label, value, icon: Icon }) => (
              <Card key={label}>
                <CardContent className="flex items-center justify-between p-5">
                  <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="mt-2 text-3xl font-semibold">{value}</p>
                  </div>
                  <Icon className="text-primary" size={22} />
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader className="sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>{t('appointmentRequests.title')}</CardTitle>
                <CardDescription>
                  {data?.summary.pending_requests ?? 0} {t('appointmentRequests.status.pending')}
                </CardDescription>
              </div>
              <Link to="/appointment-requests">
                <Button variant="outline" size="sm">{t('navigation.appointmentRequests')}</Button>
              </Link>
            </CardHeader>
          </Card>

          <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.todayAppointments')}</CardTitle>
                <CardDescription>{t('dashboard.acrossClinic')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data && data.today.length === 0 ? (
                  <p className="rounded-md bg-slate-50 p-8 text-center text-sm text-muted-foreground">
                    {t('dashboard.noToday')}
                  </p>
                ) : (
                  data?.today.map((appointment) => (
                    <Link
                      key={appointment.id}
                      to="/calendar"
                      className="block rounded-md border p-3 transition hover:bg-slate-50"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">{patientName(appointment.patient_id)}</p>
                          <p className="text-sm text-muted-foreground">{formatDateTime(appointment.start_at)}</p>
                          <p className="text-xs text-muted-foreground">{doctorName(appointment.doctor_id)}</p>
                          {appointment.reason && <p className="mt-1 text-xs text-muted-foreground">{appointment.reason}</p>}
                        </div>
                        <Badge variant={statusVariant(appointment.status)}>
                          {t(`appointments.status.${appointment.status}`, {
                            defaultValue: appointment.status.replace('_', ' '),
                          })}
                        </Badge>
                      </div>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.upcoming')}</CardTitle>
                <CardDescription>{t('dashboard.upcomingDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data && data.upcoming.length === 0 && (
                  <p className="text-sm text-muted-foreground">{t('dashboard.noUpcoming')}</p>
                )}
                {data?.upcoming.map((appointment) => (
                  <Link
                    key={appointment.id}
                    to="/calendar"
                    className="block rounded-md border p-3 transition hover:bg-slate-50"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{patientName(appointment.patient_id)}</p>
                        <p className="text-sm text-muted-foreground">{formatDateTime(appointment.start_at)}</p>
                        {appointment.reason && <p className="mt-1 text-xs text-muted-foreground">{appointment.reason}</p>}
                      </div>
                      <Badge variant={statusVariant(appointment.status)}>
                        {t(`appointments.status.${appointment.status}`, {
                          defaultValue: appointment.status.replace('_', ' '),
                        })}
                      </Badge>
                    </div>
                  </Link>
                ))}
                <Link to="/calendar" className="inline-flex items-center gap-2 text-sm font-medium text-primary">
                  {t('dashboard.viewCalendar')} <ArrowRight size={14} />
                </Link>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}