import { ShieldCheck, HeartPulse, Clock3, UsersRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const benefitIcons = [ShieldCheck, HeartPulse, Clock3, UsersRound];

export function BenefitsBar() {
  const { t } = useTranslation();
  const benefits = t('public.benefits.items', { returnObjects: true }) as Array<{
    title: string;
    description: string;
  }>;

  return (
    <div className="border-b border-[#dce9e5] bg-white">
      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-7 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        {benefits.map((item, index) => {
          const Icon = benefitIcons[index];
          return (
            <article key={item.title} className="flex gap-3">
              <Icon className="mt-0.5 shrink-0 text-[#c18b13]" size={21} />
              <div>
                <h2 className="text-sm font-bold">{item.title}</h2>
                <p className="mt-1 text-xs leading-5 text-[#66817e]">{item.description}</p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
