import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { landingImages } from '@/data/landing';

export function AboutSection() {
  const { t } = useTranslation();
  const image = landingImages.about;

  return (
    <section id="about" className="bg-[#f0f6f3]">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 lg:grid-cols-2 lg:px-8 lg:py-28">
        <div className="overflow-hidden rounded-[2rem] rounded-tr-[7rem] bg-[#c5ddd5]">
          <img
            src={image.src}
            alt={t(image.alt)}
            className="aspect-[5/4] w-full object-cover"
            loading="lazy"
            width={image.width}
            height={image.height}
            sizes={image.sizes}
          />
        </div>
        <div>
          <p className="public-kicker">{t('public.about.eyebrow')}</p>
          <h2 className="public-heading">{t('public.about.title')}</h2>
          <p className="mt-5 text-base leading-8 text-[#52716e]">{t('public.about.description')}</p>
          <a href="/about" className="public-button mt-7 bg-[#12343b] text-white">
            {t('public.about.cta')}
            <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </section>
  );
}
