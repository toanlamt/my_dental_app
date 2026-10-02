import { useTranslation } from 'react-i18next';
import { doctorRecords } from '@/data/public-data';
import { doctorCardStyling } from '@/data/landing';
import { ArrowRight, Stethoscope } from 'lucide-react';
import { Link } from 'react-router-dom';

export function DoctorsSection() {
  const { t } = useTranslation();
  const doctors = t('public.doctors.items', { returnObjects: true }) as Array<{
    name: string;
    specialty: string;
    description: string;
  }>;

  return (
    <section id="doctors" className="relative mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
      <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end mb-14">
        <div className="max-w-2xl">
          <p className="public-kicker flex items-center gap-2">
            <span className="h-px w-8 bg-[#f0b936]" />
            {t('public.doctors.eyebrow')}
          </p>
          <h2 className="mt-3 font-serif text-3xl font-normal tracking-tight text-[#12343b] sm:text-4xl lg:text-5xl">
            {t('public.doctors.title')}
          </h2>
        </div>
        <Link
          to="/doctors"
          className="inline-flex items-center gap-2 rounded-full border border-[#cbdad5] bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#12343b] shadow-sm transition hover:border-[#12343b] hover:bg-[#f3f9f7]"
        >
          <span>{t('public.nav.doctors')}</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {doctors.map((doctor) => {
          const record = doctorRecords.find(
            (r) => r.slug === doctor.name.toLowerCase().split(' ').join('-')
          );
          const styling = record
            ? doctorCardStyling[record.slug as keyof typeof doctorCardStyling]
            : { bgTone: 'bg-[#d9e8df]' };
          const initials = record?.initials || doctor.name.charAt(0);

          return (
            <article
              key={doctor.name}
              className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-[#dce9e5] bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-[#12343b]/5"
            >
              <div>
                {/* Visual Avatar Banner */}
                <div className={`relative flex aspect-[4/3] items-center justify-center ${styling.bgTone} p-6`}>
                  <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-white bg-gradient-to-tr from-[#f4c95d] to-[#fae19b] font-serif text-4xl text-[#12343b] shadow-md transition-transform duration-300 group-hover:scale-105">
                    {initials}
                  </div>
                  <div className="absolute bottom-3 right-4 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-[#12343b] backdrop-blur-sm shadow-sm">
                    <Stethoscope size={13} className="text-emerald-600" />
                    <span>{doctor.specialty}</span>
                  </div>
                </div>

                {/* Doctor Bio Details */}
                <div className="p-7">
                  <h3 className="font-serif text-2xl font-normal text-[#12343b]">
                    {doctor.name}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#66817e]">
                    {doctor.description}
                  </p>
                </div>
              </div>

              <div className="px-7 pb-7">
                <Link
                  to={record ? `/doctors/${record.slug}` : '/doctors'}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#e2ece8] bg-[#f9fbfb] py-2.5 text-xs font-bold uppercase tracking-wider text-[#12343b] transition-all hover:bg-[#12343b] hover:text-white"
                >
                  <span>{t('public.learnMore')}</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
