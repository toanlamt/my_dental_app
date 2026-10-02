import { ArrowRight, HeartPulse, Sparkles, Sun, ShieldCheck, Smile, Baby } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { serviceRecords } from '@/data/public-data';

const iconMap = {
  heart: HeartPulse,
  sparkles: Sparkles,
  sun: Sun,
  shield: ShieldCheck,
  smile: Smile,
  baby: Baby,
};

export function ServicesSection() {
  const { t } = useTranslation();
  const services = t('public.services.items', { returnObjects: true }) as Array<{
    slug: string;
    title: string;
    description: string;
  }>;

  return (
    <section id="services" className="relative mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
      {/* Section Header */}
      <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end mb-14">
        <div className="max-w-2xl">
          <p className="public-kicker flex items-center gap-2">
            <span className="h-px w-8 bg-[#f0b936]" />
            {t('public.services.eyebrow')}
          </p>
          <h2 className="mt-3 font-serif text-3xl font-normal tracking-tight text-[#12343b] sm:text-4xl lg:text-5xl">
            {t('public.services.title')}
          </h2>
        </div>
        <Link
          to="/services"
          className="inline-flex items-center gap-2 rounded-full border border-[#cbdad5] bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#12343b] shadow-sm transition hover:border-[#12343b] hover:bg-[#f3f9f7]"
        >
          <span>{t('public.services.viewAll')}</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* Services Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => {
          const record = serviceRecords.find((r) => r.slug === service.slug);
          const Icon = record ? iconMap[record.icon] : HeartPulse;
          return (
            <article
              key={service.slug}
              className="group relative flex flex-col justify-between rounded-3xl border border-[#dce9e5] bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-[#24636a]/30 hover:shadow-xl hover:shadow-[#12343b]/5"
            >
              <div>
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eaf4f0] text-[#12343b] transition-transform duration-300 group-hover:scale-110 group-hover:bg-[#12343b] group-hover:text-[#f4c95d]">
                  <Icon size={26} />
                </div>
                <h3 className="font-serif text-2xl font-normal text-[#12343b] group-hover:text-[#1d525c] transition-colors">
                  {service.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[#66817e]">
                  {service.description}
                </p>
              </div>

              <div className="mt-8 border-t border-[#f0f6f4] pt-4">
                <Link
                  to={`/services/${service.slug}`}
                  className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#12343b] transition-colors group-hover:text-[#24636a]"
                >
                  <span>{t('public.learnMore')}</span>
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
