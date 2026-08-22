import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '@/lib/auth-context';
import { Badge, Card, CardContent, CardHeader, CardTitle, Input } from '@/components/ui/primitives';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/modal';
import { useTranslation } from 'react-i18next';

type Request = {
  id: string;
  full_name: string;
  phone: string;
  service_slug: string | null;
  doctor_id: string | null;
  doctor_name?: string | null;
  preferred_date: string;
  preferred_time: string;
  message: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'converted';
  created_at: string;
  converted_appointment_id: string | null;
};

type Doctor = { id: string; full_name: string };

export function AppointmentRequestsPage() {
  const { t, i18n } = useTranslation();
  const [requests, setRequests] = useState<Request[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [status, setStatus] = useState('');
  const [query, setQuery] = useState('');
  const [date, setDate] = useState('');
  const [selected, setSelected] = useState<Request | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    setError('');
    apiRequest<{ requests: Request[] }>(
      `/api/appointment-requests?status=${status}&query=${encodeURIComponent(query)}&date=${date}`,
    )
      .then((result) => setRequests(result.requests))
      .catch(() => setError(t('appointmentRequests.requestError')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    apiRequest<{ doctors: Doctor[] }>('/api/doctors')
      .then((result) => setDoctors(result.doctors))
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, query, date]);

  const review = async (request: Request, nextStatus: 'approved' | 'rejected') => {
    if (nextStatus === 'rejected' && !window.confirm(t('appointmentRequests.rejectConfirm'))) return;
    try {
      await apiRequest(`/api/appointment-requests/${request.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus, rejection_reason: null }),
      });
      setSelected(null);
      load();
    } catch {
      setError(t('appointmentRequests.requestError'));
    }
  };

  const convert = async (request: Request) => {
    const doctorId = request.doctor_id || doctors[0]?.id;
    if (!doctorId) {
      setError(t('appointmentRequests.doctorRequired'));
      return;
    }

    try {
      await apiRequest(`/api/appointment-requests/${request.id}/convert`, {
        method: 'POST',
        body: JSON.stringify({ doctor_id: doctorId }),
      });
      setSelected(null);
      load();
    } catch (err) {
      setError(err instanceof Error && err.message.includes('appointment') ? t('appointmentRequests.conflict') : t('appointmentRequests.conversionError'));
    }
  };

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat(i18n.language === 'vi' ? 'vi-VN' : 'en-US', { dateStyle: 'medium' }).format(
      new Date(`${value}T00:00:00`),
    );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">{t('appointmentRequests.review')}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{t('appointmentRequests.title')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('appointmentRequests.description')}</p>
      </div>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-center">
          <Input placeholder={t('appointmentRequests.search')} value={query} onChange={(event) => setQuery(event.target.value)} />
          <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} aria-label={t('appointmentRequests.filterDate')} />
          <select
            className="h-10 rounded-md border px-3 text-sm"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            aria-label={t('appointmentRequests.filterStatus')}
          >
            <option value="">{t('appointmentRequests.allStatuses')}</option>
            {(['pending', 'approved', 'rejected', 'converted'] as const).map((key) => (
              <option key={key} value={key}>{t(`appointmentRequests.status.${key}`)}</option>
            ))}
          </select>
        </CardHeader>

        <CardContent>
          {loading ? (
            <p className="py-8 text-sm text-muted-foreground">{t('common.loading')}</p>
          ) : requests.length === 0 ? (
            <EmptyState title={t('appointmentRequests.noRequests')} description={t('patients.tryAgain')} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="pb-3">{t('appointmentRequests.name')}</th>
                    <th className="pb-3">{t('appointmentRequests.phone')}</th>
                    <th className="pb-3">{t('appointmentRequests.date')}</th>
                    <th className="pb-3">{t('appointmentRequests.time')}</th>
                    <th className="pb-3">{t('appointmentRequests.doctor')}</th>
                    <th className="pb-3">{t('appointmentRequests.filterStatus')}</th>
                    <th className="pb-3 text-right">{t('appointmentRequests.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {requests.map((request) => (
                    <tr key={request.id}>
                      <td className="py-4 font-medium">{request.full_name}</td>
                      <td className="py-4 text-muted-foreground">{request.phone}</td>
                      <td className="py-4">{formatDate(request.preferred_date)}</td>
                      <td className="py-4">{request.preferred_time}</td>
                      <td className="py-4 text-muted-foreground">{request.doctor_name ?? t('appointmentRequests.noPreference')}</td>
                      <td className="py-4">
                        <Badge variant={request.status === 'rejected' ? 'danger' : request.status === 'converted' ? 'success' : request.status === 'approved' ? 'default' : 'warning'}>
                          {t(`appointmentRequests.status.${request.status}`)}
                        </Badge>
                      </td>
                      <td className="py-4">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => setSelected(request)}>
                            {t('appointmentRequests.details')}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {selected && (
        <Card>
          <CardHeader>
            <CardTitle>{t('appointmentRequests.details')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p><strong>{t('appointmentRequests.name')}:</strong> {selected.full_name}</p>
            <p><strong>{t('appointmentRequests.phone')}:</strong> {selected.phone}</p>
            <p><strong>{t('appointmentRequests.date')}:</strong> {formatDate(selected.preferred_date)}</p>
            <p><strong>{t('appointmentRequests.time')}:</strong> {selected.preferred_time}</p>
            <p><strong>{t('appointmentRequests.doctor')}:</strong> {selected.doctor_name ?? t('appointmentRequests.noPreference')}</p>
            {selected.message && <p><strong>{t('appointmentRequests.message')}:</strong> {selected.message}</p>}

            <div className="flex flex-wrap gap-2 pt-1">
              {selected.status === 'pending' && (
                <>
                  <Button size="sm" onClick={() => review(selected, 'approved')}>{t('appointmentRequests.approve')}</Button>
                  <Button size="sm" variant="danger" onClick={() => review(selected, 'rejected')}>{t('appointmentRequests.reject')}</Button>
                </>
              )}

              {selected.status === 'approved' && (
                <Button size="sm" onClick={() => convert(selected)}>{t('appointmentRequests.convert')}</Button>
              )}

              {selected.status === 'converted' && (
                <Link to="/calendar">
                  <Button size="sm" variant="outline">{t('appointmentRequests.convertedAppointment')}</Button>
                </Link>
              )}

              <Button size="sm" variant="ghost" onClick={() => setSelected(null)}>{t('navigation.close')}</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default AppointmentRequestsPage;