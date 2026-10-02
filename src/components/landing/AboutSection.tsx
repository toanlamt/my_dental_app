import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { landingImages } from '@/data/landing';

export function AboutSection() {
  const { t, i18n } = useTranslation();
  const image = landingImages.about;
  const isVi = i18n.language === 'vi';

  return (
    <section id="about" className="relative overflow-hidden bg-gradient-to-b from-[#f0f6f3] to-[#eaf3ef] py-20 lg:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 lg:grid-cols-12 lg:gap-14 lg:px-8">
        
        {/* Left: Image with organic layered shape */}
        <div className="relative lg:col-span-6">
          <div className="relative mx-auto max-w-md lg:max-w-none">
            {/* Background decorative tone */}
            <div className="absolute -inset-4 rounded-[3rem] bg-[#12343b]/5 blur-xl" />
            
            <div className="relative overflow-hidden rounded-[2.5rem] border-4 border-white bg-[#c5ddd5] shadow-2xl">
              <img
                src={image.src}
                alt={t(image.alt)}
                className="aspect-[4/3] w-full object-cover transition-transform duration-500 hover:scale-105"
                loading="lazy"
                width={image.width}
                height={image.height}
                sizes={image.sizes}
              />
            </div>

            {/* Experience mini card badge */}
            <div className="absolute -bottom-6 -right-4 rounded-2xl border border-white/80 bg-white/95 p-5 shadow-xl backdrop-blur-sm sm:-right-6">
              <p className="font-serif text-3xl font-bold text-[#12343b]">15+</p>
              <p className="text-xs font-semibold text-[#66817e]">
                {isVi ? 'Năm kinh nghiệm chuyên môn' : 'Years of clinical care'}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Narrative & Philosophy */}
        <div className="lg:col-span-6">
          <p className="public-kicker flex items-center gap-2">
            <span className="h-px w-8 bg-[#f0b936]" />
            {t('public.about.eyebrow')}
          </p>
          <h2 className="mt-3 font-serif text-3xl font-normal leading-tight text-[#12343b] sm:text-4xl lg:text-5xl">
            {t('public.about.title')}
          </h2>
          <p className="mt-6 text-base leading-relaxed text-[#52716e] sm:text-lg">
            {t('public.about.description')}
          </p>

          <div className="mt-8 space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 size={18} className="mt-1 text-emerald-600 shrink-0" />
              <p className="text-sm leading-6 text-[#52716e]">
                {isVi
                  ? 'Bác sĩ luôn giải thích rõ ràng phác đồ và chi phí trước khi thực hiện.'
                  : 'Clear explanation of treatment plans and costs upfront.'}
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 size={18} className="mt-1 text-emerald-600 shrink-0" />
              <p className="text-sm leading-6 text-[#52716e]">
                {isVi
                  ? 'Quy trình vô trùng tuyệt đối theo chuẩn quốc tế, bảo vệ sức khỏe tối đa.'
                  : 'Strict clinical sterilization standards ensuring patient safety.'}
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 size={18} className="mt-1 text-emerald-600 shrink-0" />
              <p className="text-sm leading-6 text-[#52716e]">
                {isVi
                  ? 'Không gian thư giãn, giảm bớt áp lực và cảm giác sợ nha khoa.'
                  : 'Calm, modern atmosphere designed to ease dental anxiety.'}
              </p>
            </div>
          </div>

          <div className="mt-10">
            <a
              href="/about"
              className="inline-flex items-center gap-2.5 rounded-full bg-[#12343b] px-7 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#1a4a54] hover:shadow-lg active:scale-[0.98]"
            >
              <span>{t('public.about.cta')}</span>
              <ArrowRight size={16} />
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}
