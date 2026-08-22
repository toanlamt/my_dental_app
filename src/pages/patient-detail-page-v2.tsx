import { useEffect, useState } from 'react';
import { ArrowLeft, Edit3, Plus, UserRound } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiRequest, useAuth } from '@/lib/auth-context';
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/primitives';
import { Button } from '@/components/ui/button';
import { EmptyState, Modal, type ModalField } from '@/components/modal';
import { formatDate, formatDateTime } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

type Patient = {
  id: string;
  full_name: string;
  date_of_birth: string | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  medical_notes: string | null;
};

type Note = { id: string; note: string; author_id: string; created_at: string };

type Appointment = {
  id: string;
  start_at: string;
  end_at: string;
  doctor_id: string;
  status: string;
  reason: string | null;
};

const editFields = (t: (key: string, options?: Record<string, unknown>) => string): ModalField[] => [
  { name: 'full_name', label: t('patients.patient'), required: true },
  { name: 'phone', label: t('patients.phone'), type: 'tel' },
  { name: 'email', label: t('common.email'), type: 'email' },
  { name: 'date_of_birth', label: t('patients.dateOfBirth'), type: 'date' },
  {
    name: 'gender',
    label: t('patients.gender'),
    type: 'select',
    options: [
      { label: t('gender.female'), value: 'female' },
      { label: t('gender.male'), value: 'male' },
      { label: t('gender.other'), value: 'other' },
    ],
  },
  { name: 'address', label: t('common.address') },
];

const noteFields = (t: (key: string, options?: Record<string, unknown>) => string): ModalField[] => [
  {
    name: 'note',
    label: t('patientDetail.note'),
    type: 'textarea',
    required: true,
    placeholder: t('patientDetail.notePlaceholder'),
  },
];

const statusVariant = (status: string) => {
  if (status === 'completed') return 'success' as const;
  if (status === 'cancelled') return 'danger' as const;
  if (status === 'no_show') return 'warning' as const;
  return 'default' as const;
};

export function PatientDetailPageV2() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'notes'>('overview');
  const [editOpen, setEditOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const canEdit = user?.role === 'admin' || user?.role === 'staff';
  const canAddNote = user?.role === 'admin' || user?.role === 'staff' || user?.role === 'doctor';

  const load = () => {
    if (!id) return;
    setLoading(true);
    setError('');
    Promise.all([
      apiRequest<{ patient: Patient; notes: Note[]; appointments: Appointment[] }>(`/api/patients/${id}`),
      apiRequest<{ doctors: { id: string; full_name: string }[] }>('/api/doctors'),
    ])
      .then(([result, doctorResult]) => {
        setPatient(result.patient);
        setNotes(result.notes);
        setAppointments(result.appointments);
        setDoctors(Object.fromEntries(doctorResult.doctors.map((doctor) => [doctor.id, doctor.full_name])));
      })
      .catch(() => {
        navigate('/patients');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return <p className="py-12 text-center text-sm text-muted-foreground">{t('patientDetail.unableToLoad')}</p>;
  }

  if (!patient) {
    return <EmptyState title={t('patients.noFound')} description={t('patients.tryAgain')} />;
  }

  const update = async (values: Record<string, string>) => {
    await apiRequest(`/api/patients/${patient.id}`, { method: 'PATCH', body: JSON.stringify(values) });
    setEditOpen(false);
    load();
  };

  const addNote = async (values: Record<string, string>) => {
    setError('');
    try {
      await apiRequest(`/api/patients/${patient.id}/notes`, { method: 'POST', body: JSON.stringify(values) });
      setNoteOpen(false);
      load();
      setActiveTab('notes');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('patientDetail.unableToAddNote'));
    }
  };

  return (
    <div className="space-y-6">
      <Link to="/patients" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft size={16} />
        {t('patientDetail.back')}
      </Link>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserRound size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-semibold tracking-tight">{patient.full_name}</h1>
              <Badge variant="success">{t('patientDetail.active')}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{t('patientDetail.record', { id: patient.id.slice(0, 8) })}</p>
          </div>
        </div>
        {canEdit && (
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Edit3 size={15} />
            {t('patients.editDetails')}
          </Button>
        )}
      </div>

      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <Button variant={activeTab === 'overview' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('overview')}>
          {t('patientDetail.personal')}
        </Button>
        <Button variant={activeTab === 'appointments' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('appointments')}>
          {t('patientDetail.appointments')}
        </Button>
        <Button variant={activeTab === 'notes' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('notes')}>
          {t('patientDetail.notes')}
        </Button>
      </div>

      {activeTab === 'overview' && (
        <Card>
          <CardHeader>
            <CardTitle>{t('patientDetail.personal')}</CardTitle>
            <CardDescription>{t('patientDetail.contact')}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              [t('patients.dateOfBirth'), formatDate(patient.date_of_birth)],
              [t('patients.gender'), patient.gender ? t(`gender.${patient.gender}`) : t('common.notProvided')],
              [t('patients.phone'), patient.phone ?? t('common.notProvided')],
              [t('common.email'), patient.email ?? t('common.notProvided')],
              [t('common.address'), patient.address ?? t('common.notProvided')],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
                <p className="mt-1 text-sm font-medium">{value}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {activeTab === 'appointments' && (
        <Card>
          <CardHeader>
            <CardTitle>{t('patientDetail.appointments')}</CardTitle>
            <CardDescription>
              {appointments.length} {t('patientDetail.appointments').toLowerCase()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {appointments.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('patientDetail.noAppointments')}</p>
            ) : (
              appointments.map((appointment) => (
                <Link
                  key={appointment.id}
                  to="/calendar"
                  className="flex items-center justify-between gap-3 rounded-md border p-3 transition hover:bg-slate-50"
                >
                  <div>
                    <p className="font-medium">{formatDateTime(appointment.start_at)}</p>
                    <p className="text-sm text-muted-foreground">{doctors[appointment.doctor_id] ?? t('appointments.doctor')}</p>
                    <p className="text-sm text-muted-foreground">{appointment.reason ?? t('common.notProvided')}</p>
                  </div>
                  <Badge variant={statusVariant(appointment.status)}>
                    {t(`appointments.status.${appointment.status}`, { defaultValue: appointment.status.replace('_', ' ') })}
                  </Badge>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'notes' && (
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>{t('patientDetail.notes')}</CardTitle>
              <CardDescription>{t('patientDetail.notesDescription')}</CardDescription>
            </div>
            {canAddNote && (
              <Button size="sm" onClick={() => setNoteOpen(true)}>
                <Plus size={15} />
                {t('patientDetail.addNote')}
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {notes.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('patientDetail.noNotes')}</p>
            ) : (
              notes.map((note) => (
                <div key={note.id} className="rounded-md bg-slate-50 p-3">
                  <p className="text-sm">{note.note}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{formatDateTime(note.created_at)}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      <Modal
        title={t('patients.edit')}
        description={t('patientDetail.contact')}
        fields={editFields(t)}
        initialValues={{
          full_name: patient.full_name,
          phone: patient.phone ?? '',
          email: patient.email ?? '',
          date_of_birth: patient.date_of_birth ?? '',
          gender: patient.gender ?? '',
          address: patient.address ?? '',
        }}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSubmit={update}
        submitLabel={t('patients.saveChanges')}
      />

      <Modal
        title={t('patientDetail.addNote')}
        fields={noteFields(t)}
        open={noteOpen}
        onOpenChange={setNoteOpen}
        onSubmit={addNote}
        submitLabel={t('patientDetail.addNote')}
      />
    </div>
  );
}