import { useTranslation } from 'react-i18next';

export function TestimonialsSection() {
  const { t } = useTranslation();
  const testimonials = t('public.testimonials.items', { returnObjects: true }) as Array<{
    quote: string;
    name: string;
  }>;

  return (
    <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
      <div className="grid gap-5 md:grid-cols-3">
        {testimonials.map((item) => (
          <figure key={item.name} className="border-l-2 border-[#f4c95d] pl-5">
            <blockquote className="font-serif text-xl leading-8">"{item.quote}"</blockquote>
            <figcaption className="mt-4 text-xs font-bold uppercase tracking-wider text-[#66817e]">
              {item.name} · {t('public.testimonials.placeholder')}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
