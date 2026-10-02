import { Star, Quote } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function TestimonialsSection() {
  const { t } = useTranslation();
  const testimonials = t('public.testimonials.items', { returnObjects: true }) as Array<{
    quote: string;
    name: string;
  }>;

  return (
    <section className="relative mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
      <div className="mb-14 text-center">
        <p className="public-kicker">{t('public.about.eyebrow')}</p>
        <h2 className="mt-3 font-serif text-3xl font-normal tracking-tight text-[#12343b] sm:text-4xl">
          {t('public.hero.card')}
        </h2>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {testimonials.map((item, index) => (
          <figure
            key={item.name}
            className="relative flex flex-col justify-between rounded-3xl border border-[#dce9e5] bg-gradient-to-b from-white to-[#fbfdfc] p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between text-amber-400 mb-6">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={15} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <Quote size={28} className="text-[#dce9e5]" />
              </div>

              <blockquote className="font-serif text-lg leading-relaxed text-[#12343b]">
                "{item.quote}"
              </blockquote>
            </div>

            <figcaption className="mt-8 flex items-center gap-3 border-t border-[#f0f6f4] pt-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#12343b] font-serif text-sm font-bold text-[#f4c95d]">
                {item.name.charAt(item.name.length - 1) || String(index + 1)}
              </div>
              <div>
                <p className="text-sm font-bold text-[#12343b]">{item.name}</p>
                <p className="text-xs text-[#66817e]">{t('public.testimonials.placeholder')}</p>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
