import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { landingImages } from '@/data/landing';

export function HeroSection() {
  const { t } = useTranslation();
  const image = landingImages.hero;

  return (
    <section className="relative overflow-hidden bg-[#e5f0ec]">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-20 pt-12 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pb-28 lg:pt-20">
        <div>
          <p className="public-kicker mb-5 flex items-center gap-2">
            <span className="h-px w-8 bg-[#f0b936]" />
            {t('public.hero.eyebrow')}
          </p>
          <h1 className="max-w-2xl font-serif text-5xl leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
            {t('public.hero.title')}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[#52716e]">
            {t('public.hero.description')}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="/book" className="public-button bg-[#12343b] text-white">
              {t('public.bookAppointment')}
              <ArrowRight size={16} />
            </a>
            <a href="#services" className="public-button border border-[#9ab8b0] text-[#12343b]">
              {t('public.hero.viewServices')}
            </a>
          </div>
          <p className="mt-10 text-sm text-[#52716e]">{t('public.hero.comfortNote')}</p>
        </div>
        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="relative overflow-hidden rounded-[2rem] rounded-bl-[7rem] border-[12px] border-white bg-[#c5ddd5] shadow-2xl">
            <img
              src={image.src}
              alt={t(image.alt)}
              className="aspect-[4/5] w-full object-cover"
              fetchPriority={image.fetchPriority}
              width={image.width}
              height={image.height}
              sizes={image.sizes}
            />
          </div>
          <div className="absolute -bottom-5 -left-5 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-xl">
            <svg
              className="text-[#b77d00]"
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 9h12M9 20c-1 0-9-4-9-9s4-11 9-11 9 7 9 11-8 9-9 9z" />
            </svg>
            <span className="text-xs font-bold">{t('public.hero.card')}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
