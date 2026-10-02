import { Check, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { faqKeys } from '@/data/public-data';

export function WhyAndFaqSection() {
  const { t } = useTranslation();
  const whyItems = (t('public.why.items', { returnObjects: true }) as string[]) || [];
  const faqItems = faqKeys.map((key) => ({
    question: t(`publicPages.faq.items.${key}.0`),
    answer: t(`publicPages.faq.items.${key}.1`),
  }));

  return (
    <section className="bg-[#12343b] text-white">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 lg:grid-cols-2 lg:px-8">
        <div>
          <p className="public-kicker text-[#f4c95d]">{t('public.why.eyebrow')}</p>
          <h2 className="public-heading text-white">{t('public.why.title')}</h2>
          <div className="mt-8 space-y-5">
            {whyItems.map((item) => (
              <p key={item} className="flex gap-3 text-sm leading-6 text-[#b8cfca]">
                <Check className="mt-1 shrink-0 text-[#f4c95d]" size={18} />
                {item}
              </p>
            ))}
          </div>
        </div>
        <div id="faq">
          <p className="public-kicker text-[#f4c95d]">{t('public.faq.eyebrow')}</p>
          <h2 className="font-serif text-3xl">{t('public.faq.title')}</h2>
          <div className="mt-6 divide-y divide-[#31535a]">
            {faqItems.map((item) => (
              <details key={item.question} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f4c95d]">
                  <span>{item.question}</span>
                  <ChevronDown className="shrink-0 transition group-open:rotate-180" size={17} />
                </summary>
                <p className="mt-3 text-sm leading-6 text-[#b8cfca]">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
