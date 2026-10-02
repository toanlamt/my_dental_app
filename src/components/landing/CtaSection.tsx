import { ArrowRight, Calendar, PhoneCall } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function CtaSection() {
  const { t, i18n } = useTranslation();
  const isVi = i18n.language === 'vi';

  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-[#12343b] via-[#1a4750] to-[#12343b] py-16 text-white lg:py-20">
      {/* Decorative ambient elements */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 top-1/2 -z-0 h-64 w-64 -translate-y-1/2 rounded-full bg-[#f4c95d]/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 top-1/2 -z-0 h-64 w-64 -translate-y-1/2 rounded-full bg-[#38b2ac]/15 blur-3xl"
      />

      <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-5 lg:flex-row lg:px-8">
        <div className="max-w-2xl text-center lg:text-left">
          <p className="text-xs font-bold uppercase tracking-widest text-[#f4c95d]">
            {isVi ? 'Đồng hành cùng nụ cười của bạn' : 'Caring for your smile'}
          </p>
          <h2 className="mt-2 font-serif text-3xl font-normal tracking-tight sm:text-4xl lg:text-5xl">
            {t('public.cta.title')}
          </h2>
          <p className="mt-3 text-base text-[#b8cfca] sm:text-lg">
            {t('public.cta.description')}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <a
            href="/book"
            className="group inline-flex items-center gap-2.5 rounded-full bg-[#f4c95d] px-7 py-3.5 text-sm font-bold text-[#12343b] shadow-lg shadow-black/10 transition-all hover:bg-[#fae19b] hover:shadow-xl active:scale-[0.98]"
          >
            <Calendar size={17} />
            <span>{t('public.bookAppointment')}</span>
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </a>

          <a
            href="tel:+84909599005"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20 active:scale-[0.98]"
          >
            <PhoneCall size={16} />
            <span>+84 909 599 005</span>
          </a>
        </div>
      </div>
    </section>
  );
}
