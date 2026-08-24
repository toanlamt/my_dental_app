import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Edit3, Plus } from 'lucide-react';
import { apiRequest, useAuth } from '@/lib/auth-context';
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from '@/components/ui/primitives';
import { Button } from '@/components/ui/button';
import { EmptyState, Modal, type ModalField } from '@/components/modal';
import { formatDateTime } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

type Appointment = {
  id: string;
  patient_id: string;
  doctor_id: string;
  start_at: string;
  end_at: string;
  status: string;
  reason: string | null;
  notes: string | null;
};

type Person = { id: string; full_name?: string; name?: string };

const fields = (
  patients: Person[],
  doctors: Person[],
  t: (key: string, options?: Record<string, unknown>) => string,
): ModalField[] => [
  {
    name: 'patient_id',
    label: t('appointments.patient'),
    type: 'select',
    required: true,
    options: patients.map((item) => ({ label: item.full_name ?? t('appointments.patient'), value: item.id })),
  },
  {
    name: 'doctor_id',
    label: t('appointments.doctor'),
    type: 'select',
    required: true,
    options: doctors.map((item) => ({ label: item.full_name ?? item.name ?? t('appointments.doctor'), value: item.id })),
  },
  { name: 'start_at', label: t('appointments.start'), type: 'datetime-local', required: true },
  { name: 'end_at', label: t('appointments.end'), type: 'datetime-local', required: true },
  { name: 'reason', label: t('appointments.reason') },
  { name: 'notes', label: t('appointments.notes'), type: 'textarea' },
];

const statusVariant = (status: string) => {
  if (status === 'completed') return 'success' as const;
  if (status === 'cancelled') return 'danger' as const;
  if (status === 'no_show') return 'warning' as const;
  return 'default' as const;
};

const allStatuses = ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'] as const;

export function CalendarPageV2() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [date, setDate] = useState(new Date());
  const [mode, setMode] = useState<'day' | 'week'>('day');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Person[]>([]);
  const [doctors, setDoctors] = useState<Person[]>([]);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [doctorFilter, setDoctorFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [patientQuery, setPatientQuery] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const canSchedule = user?.role === 'admin' || user?.role === 'staff';
  const canEdit = user?.role === 'admin' || user?.role === 'staff';

  const range = useMemo(() => {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    if (mode === 'week') start.setDate(start.getDate() - start.getDay());
    const end = new Date(start);
    end.setDate(end.getDate() + (mode === 'week' ? 7 : 1));
    return { start, end };
  }, [date, mode]);

  const load = () => {
    setLoading(true);
    setError('');
    const query = new URLSearchParams({
      from: range.start.toISOString(),
      to: range.end.toISOString(),
    });

    if (user?.role !== 'doctor' && doctorFilter) query.set('doctorId', doctorFilter);
    if (statusFilter) query.set('status', statusFilter);

    apiRequest<{ appointments: Appointment[] }>(`/api/appointments?${query.toString()}`)
      .then((result) => setAppointments(result.appointments))
      .catch((err) => setError(err instanceof Error ? err.message : t('appointments.unableToLoad')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.start.toISOString(), range.end.toISOString(), doctorFilter, statusFilter, user?.role]);

  useEffect(() => {
    Promise.all([
      apiRequest<{ patients: Person[] }>('/api/patients?pageSize=100'),
      apiRequest<{ doctors: Person[] }>('/api/doctors'),
    ]).then(([p, d]) => {
      setPatients(p.patients);
      setDoctors(d.doctors);
    }).catch(() => undefined);
  }, []);

  const patientName = (id: string) => patients.find((item) => item.id === id)?.full_name ?? t('appointments.patient');
  const doctorName = (id: string) => doctors.find((item) => item.id === id)?.full_name ?? doctors.find((item) => item.id === id)?.name ?? t('appointments.doctor');

  const filteredAppointments = appointments.filter((appointment) => {
    if (!patientQuery.trim()) return true;
    return patientName(appointment.patient_id).toLowerCase().includes(patientQuery.toLowerCase());
  });

  const create = async (values: Record<string, string>) => {
    setError('');
    const start = new Date(values.start_at);
    const end = new Date(values.end_at);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      setError(t('appointments.endAfterStart'));
      return;
    }

    try {
      await apiRequest('/api/appointments', {
        method: 'POST',
        body: JSON.stringify({ ...values, start_at: start.toISOString(), end_at: end.toISOString() }),
      });
      setOpen(false);
      load();
    } catch (err) {
      if (err instanceof Error && err.message.includes('Doctor already has an appointment')) {
        setError(t('appointmentRequests.conflict'));
        return;
      }
      setError(err instanceof Error ? err.message : t('appointments.unableToCreate'));
    }
  };

  const updateStatus = async (status: string) => {
    if (!selected) return;
    if (status === 'cancelled' && !window.confirm(t('appointments.cancelConfirm'))) return;
    setError('');
    try {
      await apiRequest(`/api/appointments/${selected.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setSelected(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.requestFailed'));
    }
  };

  const update = async (values: Record<string, string>) => {
    if (!selected) return;
    setError('');
    const start = new Date(values.start_at);
    const end = new Date(values.end_at);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      setError(t('appointments.endAfterStart'));
      return;
    }

    try {
      await apiRequest(`/api/appointments/${selected.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ ...values, start_at: start.toISOString(), end_at: end.toISOString() }),
      });
      setEditOpen(false);
      setSelected(null);
      load();
    } catch (err) {
      if (err instanceof Error && err.message.includes('Doctor already has an appointment')) {
        setError(t('appointmentRequests.conflict'));
        return;
      }
      setError(err instanceof Error ? err.message : t('appointments.unableToCreate'));
    }
  };

  const move = (amount: number) =>
    setDate((current) => {
      const next = new Date(current);
      next.setDate(next.getDate() + amount * (mode === 'week' ? 7 : 1));
      return next;
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">{t('dashboard.overview')}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">{t('navigation.calendar')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('dashboard.openCalendar')}</p>
        </div>
        {canSchedule && (
          <Button onClick={() => setOpen(true)}>
            <Plus size={16} />
            {t('appointments.schedule')}
          </Button>
        )}
      </div>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <Card>
        <CardHeader className="flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>
              {mode === 'day'
                ? range.start.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
                : `${range.start.toLocaleDateString([], { month: 'short', day: 'numeric' })} - ${new Date(range.end.getTime() - 1).toLocaleDateString([], { month: 'short', day: 'numeric' })}`}
            </CardTitle>
            <CardDescription>{t('appointments.inView', { count: filteredAppointments.length })}</CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-md border p-1">
              <Button variant={mode === 'day' ? 'default' : 'ghost'} size="sm" onClick={() => setMode('day')}>
                {t('appointments.day')}
              </Button>
              <Button variant={mode === 'week' ? 'default' : 'ghost'} size="sm" onClick={() => setMode('week')}>
                {t('appointments.week')}
              </Button>
            </div>
            <Button variant="outline" size="icon" onClick={() => move(-1)} aria-label={t('appointments.previous')}>
              <ChevronLeft size={16} />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDate(new Date())}>
              {t('appointments.today')}
            </Button>
            <Button variant="outline" size="icon" onClick={() => move(1)} aria-label={t('appointments.next')}>
              <ChevronRight size={16} />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {user?.role !== 'doctor' && (
              <div>
                <Label htmlFor="doctor-filter">{t('appointments.doctor')}</Label>
                <select
                  id="doctor-filter"
                  className="mt-1 flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={doctorFilter}
                  onChange={(event) => setDoctorFilter(event.target.value)}
                >
                  <option value="">{t('appointmentRequests.allStatuses')}</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>{doctor.full_name ?? doctor.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <Label htmlFor="status-filter">{t('appointmentRequests.filterStatus')}</Label>
              <select
                id="status-filter"
                className="mt-1 flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="">{t('appointmentRequests.allStatuses')}</option>
                {allStatuses.map((status) => (
                  <option key={status} value={status}>
                    {t(`appointments.status.${status}`)}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="patient-filter">{t('patients.search')}</Label>
              <Input
                id="patient-filter"
                className="mt-1"
                value={patientQuery}
                onChange={(event) => setPatientQuery(event.target.value)}
                placeholder={t('patients.search')}
              />
            </div>
          </div>

          {loading ? (
            <p className="py-8 text-sm text-muted-foreground">{t('common.loading')}</p>
          ) : filteredAppointments.length === 0 ? (
            <EmptyState title={t('appointments.noAppointments')} description={t('appointments.noAppointmentsDescription')} />
          ) : (
            <div className="space-y-3">
              {filteredAppointments.map((appointment) => (
                <button
                  type="button"
                  key={appointment.id}
                  className="flex w-full items-center justify-between gap-3 rounded-md border p-3 text-left transition hover:bg-slate-50"
                  onClick={() => setSelected(appointment)}
                >
                  <div>
                    <p className="font-medium">{patientName(appointment.patient_id)}</p>
                    <p className="text-sm text-muted-foreground">{formatDateTime(appointment.start_at)}</p>
                    <p className="text-xs text-muted-foreground">{doctorName(appointment.doctor_id)}</p>
                    <p className="text-xs text-muted-foreground">{appointment.reason ?? t('common.notProvided')}</p>
                  </div>
                  <Badge variant={statusVariant(appointment.status)}>
                    {t(`appointments.status.${appointment.status}`, { defaultValue: appointment.status.replace('_', ' ') })}
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selected && (
        <Card>
          <CardHeader className="sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>{patientName(selected.patient_id)}</CardTitle>
              <CardDescription>{formatDateTime(selected.start_at)}</CardDescription>
            </div>
            <Badge variant={statusVariant(selected.status)}>
              {t(`appointments.status.${selected.status}`, { defaultValue: selected.status.replace('_', ' ') })}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{doctorName(selected.doctor_id)}</p>
            <p className="text-sm">{selected.reason ?? t('common.notProvided')}</p>
            <div className="flex flex-wrap gap-2">
              {canEdit && selected.status !== 'cancelled' && (
                <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
                  <Edit3 size={14} />
                  {t('appointments.edit')}
                </Button>
              )}
              {['confirmed', 'completed', 'no_show', 'cancelled'].map((status) => (
                <Button key={status} size="sm" variant={status === 'cancelled' ? 'danger' : 'outline'} onClick={() => updateStatus(status)}>
                  {t(`appointments.status.${status}`)}
                </Button>
              ))}
              <Button size="sm" variant="ghost" onClick={() => setSelected(null)}>
                {t('navigation.close')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Modal
        title={t('appointments.schedule')}
        fields={fields(patients, doctors, t)}
        open={open}
        onOpenChange={setOpen}
        onSubmit={create}
        submitLabel={t('common.create')}
      />

      {selected && (
        <Modal
          title={t('appointments.edit')}
          fields={fields(patients, doctors, t)}
          open={editOpen}
          onOpenChange={setEditOpen}
          onSubmit={update}
          submitLabel={t('common.save')}
          initialValues={{
            patient_id: selected.patient_id,
            doctor_id: selected.doctor_id,
            start_at: selected.start_at.slice(0, 16),
            end_at: selected.end_at.slice(0, 16),
            reason: selected.reason ?? '',
            notes: selected.notes ?? '',
          }}
        />
      )}
    </div>
  );
}