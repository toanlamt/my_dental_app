import { useTranslation } from 'react-i18next';
import { doctorRecords } from '@/data/public-data';
import { doctorCardStyling } from '@/data/landing';

export function DoctorsSection() {
  const { t } = useTranslation();
  const doctors = t('public.doctors.items', { returnObjects: true }) as Array<{
    name: string;
    specialty: string;
    description: string;
  }>;

  return (
    <section id="doctors" className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
      <p className="public-kicker">{t('public.doctors.eyebrow')}</p>
      <h2 className="public-heading mb-10">{t('public.doctors.title')}</h2>
      <div className="grid gap-5 md:grid-cols-3">
        {doctors.map((doctor) => {
          const record = doctorRecords.find((r) => r.slug === doctor.name.toLowerCase().split(' ').join('-'));
          const styling = record ? doctorCardStyling[record.slug as keyof typeof doctorCardStyling] : { bgTone: 'bg-[#d9e8df]' };
          const initials = record?.initials || doctor.name.charAt(0);

          return (
            <article key={doctor.name} className="border border-[#dce9e5] bg-white">
              <div className={`flex aspect-[4/3] items-end justify-center ${styling.bgTone}`}>
                <div className="flex h-32 w-32 translate-y-6 items-center justify-center rounded-full border-8 border-white bg-[#f4c95d] font-serif text-5xl">
                  {initials}
                </div>
              </div>
              <div className="p-7 pt-12">
                <h3 className="font-serif text-2xl">{doctor.name}</h3>
                <p className="mt-1 text-sm font-bold text-[#c18b13]">{doctor.specialty}</p>
                <p className="mt-4 text-sm leading-6 text-[#66817e]">{doctor.description}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
