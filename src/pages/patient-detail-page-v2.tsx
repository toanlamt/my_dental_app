import { useEffect, useState } from 'react';
import { ArrowLeft, Edit3, Plus, UserRound } from 'lucide-react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { apiRequest, useAuth } from '@/lib/auth-context';
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/primitives';
import { Button } from '@/components/ui/button';
import { EmptyState, Modal, type ModalField } from '@/components/modal';
import { formatDate, formatDateTime } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { DentalChart } from '@/components/dental-chart';

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

type MedicalRecord = {
  id: string;
  appointment_id: string | null;
  author_id: string;
  author_name?: string;
  appointment_start_at?: string | null;
  record_date: string;
  reason: string;
  examination: string | null;
  diagnosis: string | null;
  treatment: string | null;
  clinical_notes: string | null;
  follow_up: string | null;
  follow_up_date: string | null;
  created_at: string;
  updated_at: string;
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

const medicalRecordFields = (appointments: Appointment[], t: (key: string, options?: Record<string, unknown>) => string): ModalField[] => [
  { name: 'record_date', label: t('medicalRecords.recordDate'), type: 'datetime-local', required: true },
  { name: 'appointment_id', label: t('medicalRecords.appointment'), type: 'select', options: appointments.map((item) => ({ label: `${formatDateTime(item.start_at)} - ${item.reason ?? t('common.notProvided')}`, value: item.id })) },
  { name: 'reason', label: t('medicalRecords.reason'), required: true },
  { name: 'examination', label: t('medicalRecords.examination'), type: 'textarea' },
  { name: 'diagnosis', label: t('medicalRecords.diagnosis'), type: 'textarea' },
  { name: 'treatment', label: t('medicalRecords.treatment'), type: 'textarea' },
  { name: 'clinical_notes', label: t('medicalRecords.clinicalNotes'), type: 'textarea' },
  { name: 'follow_up', label: t('medicalRecords.followUp'), type: 'textarea' },
  { name: 'follow_up_date', label: t('medicalRecords.followUpDate'), type: 'date' },
];

const statusVariant = (status: string) => {
  if (status === 'completed') return 'success' as const;
  if (status === 'cancelled') return 'danger' as const;
  if (status === 'no_show') return 'warning' as const;
  return 'default' as const;
};

export function PatientDetailPageV2() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Record<string, string>>({});
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'notes' | 'medicalRecords' | 'dentalChart'>('overview');
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [recordOpen, setRecordOpen] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const canEdit = user?.role === 'admin' || user?.role === 'staff';
  const canAddNote = user?.role === 'admin' || user?.role === 'staff' || user?.role === 'doctor';
  const canEditRecord = canAddNote;

  const load = () => {
    if (!id) return;
    setLoading(true);
    setError('');
    Promise.all([
      apiRequest<{ patient: Patient; notes: Note[]; appointments: Appointment[] }>(`/api/patients/${id}`),
      apiRequest<{ records: MedicalRecord[] }>(`/api/patients/${id}/medical-records?pageSize=20`),
      apiRequest<{ doctors: { id: string; full_name: string }[] }>('/api/doctors'),
    ])
      .then(([result, recordResult, doctorResult]) => {
        setPatient(result.patient);
        setNotes(result.notes);
        setAppointments(result.appointments);
        setRecords(recordResult.records);
        const linkedRecord = searchParams.get('recordId');
        if (linkedRecord) setSelectedRecord(recordResult.records.find((record) => record.id === linkedRecord) ?? null);
        if (searchParams.get('appointmentId')) setRecordOpen(true);
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

  useEffect(() => {
    if (searchParams.get('tab') === 'medicalRecords') setActiveTab('medicalRecords');
  }, [searchParams]);

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

  const saveRecord = async (values: Record<string, string>) => {
    setError('');
    try {
      const payload = { ...values, record_date: new Date(values.record_date).toISOString(), appointment_id: values.appointment_id || null, follow_up_date: values.follow_up_date || null };
      const url = selectedRecord ? `/api/medical-records/${selectedRecord.id}` : `/api/patients/${patient.id}/medical-records`;
      await apiRequest(url, { method: selectedRecord ? 'PATCH' : 'POST', body: JSON.stringify(payload) });
      setRecordOpen(false);
      setSelectedRecord(null);
      load();
      setActiveTab('medicalRecords');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('medicalRecords.unableToSave'));
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
        <Button variant={activeTab === 'medicalRecords' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('medicalRecords')}>
          {t('medicalRecords.title')}
        </Button>
        <Button variant={activeTab === 'dentalChart' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('dentalChart')}>
          {t('dentalChart.title')}
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

      {activeTab === 'medicalRecords' && (
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div><CardTitle>{t('medicalRecords.title')}</CardTitle><CardDescription>{t('medicalRecords.description')}</CardDescription></div>
            {canEditRecord && <Button size="sm" onClick={() => { setSelectedRecord(null); setRecordOpen(true); }}><Plus size={15} />{t('medicalRecords.create')}</Button>}
          </CardHeader>
          <CardContent className="space-y-3">
            {records.length === 0 ? <p className="text-sm text-muted-foreground">{t('medicalRecords.noRecords')}</p> : records.map((record) => (
              <div key={record.id} className="rounded-md border p-4">
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start"><div><p className="font-medium">{formatDateTime(record.record_date)}</p><p className="text-sm text-muted-foreground">{record.reason}</p></div><p className="text-sm text-muted-foreground">{record.author_name ?? doctors[record.author_id] ?? t('medicalRecords.doctor')}</p></div>
                {record.diagnosis && <p className="mt-2 text-sm"><span className="font-medium">{t('medicalRecords.diagnosis')}:</span> {record.diagnosis}</p>}
                {record.treatment && <p className="text-sm"><span className="font-medium">{t('medicalRecords.treatment')}:</span> {record.treatment}</p>}
                <div className="mt-3 flex gap-2"><Button size="sm" variant="outline" onClick={() => setSelectedRecord(record)}>{t('medicalRecords.view')}</Button>{canEditRecord && <Button size="sm" variant="ghost" onClick={() => { setSelectedRecord(record); setRecordOpen(true); }}>{t('medicalRecords.edit')}</Button>}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {activeTab === 'dentalChart' && (
        <DentalChart patientId={patient.id} />
      )}

      {selectedRecord && !recordOpen && (
        <Card><CardHeader><CardTitle>{t('medicalRecords.detail')}</CardTitle><CardDescription>{formatDateTime(selectedRecord.record_date)}</CardDescription></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
          {[[t('medicalRecords.doctor'), selectedRecord.author_name ?? doctors[selectedRecord.author_id]], [t('medicalRecords.appointment'), selectedRecord.appointment_start_at ? formatDateTime(selectedRecord.appointment_start_at) : t('medicalRecords.noAppointment')], [t('medicalRecords.reason'), selectedRecord.reason], [t('medicalRecords.examination'), selectedRecord.examination], [t('medicalRecords.diagnosis'), selectedRecord.diagnosis], [t('medicalRecords.treatment'), selectedRecord.treatment], [t('medicalRecords.clinicalNotes'), selectedRecord.clinical_notes], [t('medicalRecords.followUp'), selectedRecord.follow_up], [t('medicalRecords.followUpDate'), selectedRecord.follow_up_date], [t('medicalRecords.created'), formatDateTime(selectedRecord.created_at)], [t('medicalRecords.updated'), formatDateTime(selectedRecord.updated_at)]].map(([label, value]) => <div key={label}><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 whitespace-pre-wrap text-sm">{value || t('common.notProvided')}</p></div>)}
        </CardContent></Card>
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

      <Modal title={selectedRecord ? t('medicalRecords.edit') : t('medicalRecords.create')} description={t('medicalRecords.description')} fields={medicalRecordFields(appointments, t)} open={recordOpen} onOpenChange={setRecordOpen} onSubmit={saveRecord} submitLabel={selectedRecord ? t('common.save') : t('common.create')} initialValues={selectedRecord ? { record_date: selectedRecord.record_date.slice(0, 16), appointment_id: selectedRecord.appointment_id ?? '', reason: selectedRecord.reason, examination: selectedRecord.examination ?? '', diagnosis: selectedRecord.diagnosis ?? '', treatment: selectedRecord.treatment ?? '', clinical_notes: selectedRecord.clinical_notes ?? '', follow_up: selectedRecord.follow_up ?? '', follow_up_date: selectedRecord.follow_up_date ?? '' } : { record_date: new Date().toISOString().slice(0, 16), appointment_id: searchParams.get('appointmentId') ?? '' }} />

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