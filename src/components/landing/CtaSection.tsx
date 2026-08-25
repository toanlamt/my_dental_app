import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function CtaSection() {
  const { t } = useTranslation();

  return (
    <section className="bg-[#f4c95d]">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-14 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <div>
          <h2 className="font-serif text-4xl">{t('public.cta.title')}</h2>
          <p className="mt-2 text-sm text-[#456460]">{t('public.cta.description')}</p>
        </div>
        <a href="/book" className="public-button shrink-0 bg-[#12343b] text-white">
          {t('public.bookAppointment')}
          <ArrowRight size={16} />
        </a>
      </div>
    </section>
  );
}
