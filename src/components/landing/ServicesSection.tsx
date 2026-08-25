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
    <section id="services" className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
      <div className="mb-10">
        <p className="public-kicker">{t('public.services.eyebrow')}</p>
        <h2 className="public-heading">{t('public.services.title')}</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => {
          const record = serviceRecords.find((r) => r.slug === service.slug);
          const Icon = record ? iconMap[record.icon] : HeartPulse;
          return (
            <article
              key={service.slug}
              className="group border border-[#dce9e5] bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="mb-10 flex h-11 w-11 items-center justify-center rounded-xl bg-[#e5f0ec] text-[#24636a]">
                <Icon size={21} />
              </div>
              <h3 className="font-serif text-2xl">{service.title}</h3>
              <p className="mt-2 min-h-12 text-sm leading-6 text-[#66817e]">{service.description}</p>
              <Link
                to={`/services/${service.slug}`}
                className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#24636a]"
              >
                {t('public.learnMore')}
                <ArrowRight size={15} />
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
