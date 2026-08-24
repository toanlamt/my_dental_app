import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { serviceRecords } from '@/data/public-data';
import { apiRequest } from '@/lib/auth-context';
import { usePageMeta } from '@/lib/seo';

type Doctor = { id: string; full_name: string };

export function AppointmentBookingPage() {
  const { t } = useTranslation();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  usePageMeta({
    title: t('phase9.meta.bookingTitle'),
    description: t('phase9.meta.bookingDescription'),
  });

  useEffect(() => {
    apiRequest<{ doctors: Doctor[] }>('/api/public/doctors')
      .then((result) => setDoctors(result.doctors))
      .catch(() => setDoctors([]));
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const values = Object.fromEntries(new FormData(event.currentTarget).entries()) as Record<string, string>;

    if (!values.full_name.trim()) return setError(t('appointmentRequests.requiredName'));
    if (!/^\+?[0-9 ()-]{7,30}$/.test(values.phone.trim())) return setError(t('appointmentRequests.invalidPhone'));
    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) return setError(t('appointmentRequests.invalidEmail'));
    if (!values.preferred_date) return setError(t('appointmentRequests.requiredDate'));
    if (values.preferred_date < today) return setError(t('appointmentRequests.pastDate'));
    if (!values.preferred_time) return setError(t('appointmentRequests.requiredTime'));
    if (values.message.length > 1000) return setError(t('appointmentRequests.tooLongMessage'));

    setSending(true);
    try {
      const result = await apiRequest<{ request: { id: string } }>('/api/public/appointment-requests', {
        method: 'POST',
        body: JSON.stringify({
          ...values,
          email: values.email || null,
          service_slug: values.service_slug || null,
          doctor_id: values.doctor_id || null,
          message: values.message || null,
        }),
      });
      setSent(result.request.id);
    } catch (err) {
      setError(err instanceof Error && err.message.includes('similar') ? t('appointmentRequests.duplicate') : t('appointmentRequests.requestError'));
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-20 lg:px-8">
        <div className="border border-[#dce9e5] bg-white p-8 lg:p-12">
          <p className="public-kicker">{t('public.bookAppointment')}</p>
          <h1 className="public-heading">{t('appointmentRequests.receivedTitle')}</h1>
          <p className="mt-6 text-lg leading-8 text-[#52716e]">{t('appointmentRequests.receivedDescription')}</p>
          <p className="mt-8 text-sm text-[#66817e]">
            {t('appointmentRequests.reference')}: <strong className="text-[#12343b]">{sent}</strong>
          </p>
          <Link to="/" className="public-button mt-8 bg-[#12343b] text-white">
            {t('appointmentRequests.backHome')}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-[#e5f0ec] px-5 py-14 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-5xl">
        <p className="public-kicker">{t('public.bookAppointment')}</p>
        <h1 className="public-heading max-w-3xl">{t('appointmentRequests.newRequest')}</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-[#52716e]">{t('appointmentRequests.receivedDescription')}</p>

        <form onSubmit={submit} className="mt-10 grid gap-5 border border-[#dce9e5] bg-white p-6 lg:grid-cols-2 lg:p-10">
          <div className="grid gap-2 text-sm font-semibold">
            <label htmlFor="booking-full-name">{t('appointmentRequests.name')}</label>
            <input id="booking-full-name" name="full_name" required maxLength={200} className="h-11 rounded-md border px-3 font-normal" />
          </div>

          <div className="grid gap-2 text-sm font-semibold">
            <label htmlFor="booking-phone">{t('appointmentRequests.phone')}</label>
            <input id="booking-phone" name="phone" required type="tel" maxLength={30} className="h-11 rounded-md border px-3 font-normal" />
          </div>

          <div className="grid gap-2 text-sm font-semibold">
            <label htmlFor="booking-email">
              {t('appointmentRequests.email')} <span className="font-normal text-[#66817e]">({t('appointmentRequests.optional')})</span>
            </label>
            <input id="booking-email" name="email" type="email" maxLength={200} className="h-11 rounded-md border px-3 font-normal" />
          </div>

          <div className="grid gap-2 text-sm font-semibold">
            <label htmlFor="booking-date">{t('appointmentRequests.date')}</label>
            <input id="booking-date" name="preferred_date" required type="date" min={today} className="h-11 rounded-md border px-3 font-normal" />
          </div>

          <div className="grid gap-2 text-sm font-semibold">
            <label htmlFor="booking-time">{t('appointmentRequests.time')}</label>
            <input id="booking-time" name="preferred_time" required type="time" className="h-11 rounded-md border px-3 font-normal" />
          </div>

          <div className="grid gap-2 text-sm font-semibold">
            <label htmlFor="booking-service">
              {t('appointmentRequests.service')} <span className="font-normal text-[#66817e]">({t('appointmentRequests.optional')})</span>
            </label>
            <select id="booking-service" name="service_slug" className="h-11 rounded-md border px-3 font-normal">
              <option value="">{t('appointmentRequests.chooseService')}</option>
              {serviceRecords.map((service) => (
                <option key={service.slug} value={service.slug}>
                  {t(`publicPages.services.items.${service.slug}.title`)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2 text-sm font-semibold">
            <label htmlFor="booking-doctor">
              {t('appointmentRequests.doctor')} <span className="font-normal text-[#66817e]">({t('appointmentRequests.optional')})</span>
            </label>
            <select id="booking-doctor" name="doctor_id" className="h-11 rounded-md border px-3 font-normal">
              <option value="">{t('appointmentRequests.noPreference')}</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.full_name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2 text-sm font-semibold lg:col-span-2">
            <label htmlFor="booking-message">
              {t('appointmentRequests.message')} <span className="font-normal text-[#66817e]">({t('appointmentRequests.optional')})</span>
            </label>
            <textarea id="booking-message" name="message" maxLength={1000} rows={4} className="rounded-md border px-3 py-2 font-normal" />
          </div>

          {error && (
            <p role="alert" aria-live="assertive" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 lg:col-span-2">
              {error}
            </p>
          )}

          <button disabled={sending} className="public-button w-fit bg-[#12343b] text-white disabled:opacity-60" type="submit">
            {sending ? t('appointmentRequests.sending') : t('appointmentRequests.submit')}
          </button>
        </form>
      </div>
    </main>
  );
}
