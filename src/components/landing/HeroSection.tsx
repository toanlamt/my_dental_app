import { ArrowRight, Star, ShieldCheck, Clock, Award, Sparkles, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { landingImages } from '@/data/landing';

export function HeroSection() {
  const { t, i18n } = useTranslation();
  const image = landingImages.hero;
  const isVi = i18n.language === 'vi';

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#f3f9f7] via-[#eaf4f0] to-[#ffffff] pb-16 pt-8 lg:pb-24 lg:pt-16">
      {/* Decorative subtle ambient lights */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-[#12343b]/10 to-[#38b2ac]/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 top-1/3 -z-10 h-72 w-72 rounded-full bg-[#f4c95d]/20 blur-2xl"
      />

      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
          
          {/* Left Column: Headline & Action */}
          <div className="lg:col-span-7">
            {/* Trust badge pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#12343b]/15 bg-white/80 px-4 py-1.5 shadow-sm backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#12343b]">
                {t('public.hero.eyebrow')}
              </span>
              <span className="text-[#9ab8b0]">|</span>
              <div className="flex items-center gap-1 text-amber-500">
                <Star size={12} className="fill-amber-400 text-amber-400" />
                <span className="text-xs font-bold text-[#12343b]">4.9/5</span>
                <span className="text-[11px] text-[#66817e] font-normal">
                  ({isVi ? 'Hơn 2,500 nụ cười tin tưởng' : '2,500+ happy smiles'})
                </span>
              </div>
            </div>

            {/* Main Heading */}
            <h1 className="mt-6 font-serif text-4xl font-normal tracking-tight text-[#12343b] sm:text-5xl lg:text-6xl lg:leading-[1.12]">
              {t('public.hero.title')}
            </h1>

            {/* Subheading / Description */}
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#52716e] sm:text-lg">
              {t('public.hero.description')}
            </p>

            {/* Value bullets */}
            <div className="mt-6 grid grid-cols-2 gap-3 sm:max-w-lg">
              <div className="flex items-center gap-2 text-sm font-medium text-[#12343b]">
                <CheckCircle2 size={17} className="text-emerald-600 shrink-0" />
                <span>{isVi ? 'Thăm khám & tư vấn chu đáo' : 'Gentle & thorough exams'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-[#12343b]">
                <CheckCircle2 size={17} className="text-emerald-600 shrink-0" />
                <span>{isVi ? 'Không đau, êm ái tối đa' : 'Pain-free, comfortable care'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-[#12343b]">
                <CheckCircle2 size={17} className="text-emerald-600 shrink-0" />
                <span>{isVi ? 'Trang thiết bị hiện đại' : 'Modern high-tech clinic'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-[#12343b]">
                <CheckCircle2 size={17} className="text-emerald-600 shrink-0" />
                <span>{isVi ? 'Báo giá minh bạch, rõ ràng' : 'Transparent pricing upfront'}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="/book"
                className="group inline-flex items-center justify-center gap-2.5 rounded-full bg-[#12343b] px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#12343b]/20 transition-all hover:bg-[#1a4a54] hover:shadow-xl hover:shadow-[#12343b]/30 active:scale-[0.98]"
              >
                <span>{t('public.bookAppointment')}</span>
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </a>

              <a
                href="#services"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#cbdad5] bg-white px-6 py-3.5 text-sm font-semibold text-[#12343b] shadow-sm transition hover:border-[#12343b]/40 hover:bg-[#f6faf8] active:scale-[0.98]"
              >
                {t('public.hero.viewServices')}
              </a>
            </div>

            {/* Mini social proof / comfort note */}
            <div className="mt-8 flex items-center gap-4 border-t border-[#d8e6e1] pt-6 text-xs text-[#66817e]">
              <div className="flex items-center gap-1.5 font-medium text-[#12343b]">
                <ShieldCheck size={16} className="text-emerald-600" />
                <span>{isVi ? 'Bảo đảm an toàn y khoa' : 'Medical Grade Hygiene'}</span>
              </div>
              <span className="text-[#cbdad5]">•</span>
              <div className="flex items-center gap-1.5 font-medium text-[#12343b]">
                <Clock size={16} className="text-[#12343b]" />
                <span>{isVi ? 'Linh hoạt mọi ngày trong tuần' : 'Open 7 days a week'}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual composition */}
          <div className="relative lg:col-span-5">
            {/* Main Visual Frame */}
            <div className="relative mx-auto w-full max-w-md lg:max-w-none">
              
              {/* Soft decorative background aura */}
              <div className="absolute -inset-2 rounded-[2.5rem] bg-gradient-to-tr from-[#38b2ac]/30 via-white to-[#f4c95d]/30 blur-xl" />

              {/* Main image container */}
              <div className="relative overflow-hidden rounded-[2.25rem] border-4 border-white bg-slate-100 shadow-2xl ring-1 ring-slate-900/5">
                <img
                  src={image.src}
                  alt={t(image.alt)}
                  className="aspect-[4/5] w-full object-cover transition-transform duration-700 hover:scale-105"
                  fetchPriority={image.fetchPriority}
                  width={image.width}
                  height={image.height}
                  sizes={image.sizes}
                />
                {/* Subtle gradient overlay at bottom of photo */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
              </div>

              {/* Floating Badge 1: Top Right - Experience/Rating */}
              <div className="absolute -right-3 top-6 flex items-center gap-3 rounded-2xl border border-white/80 bg-white/95 px-4 py-3 shadow-xl backdrop-blur-md sm:-right-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Award size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <Star size={13} className="fill-amber-400 text-amber-400" />
                    <span className="text-xs font-bold text-slate-800">100%</span>
                  </div>
                  <p className="text-[11px] font-medium text-slate-500">
                    {isVi ? 'Tận tâm & An toàn' : 'Certified Quality'}
                  </p>
                </div>
              </div>

              {/* Floating Badge 2: Bottom Left - Dedicated doctors */}
              <div className="absolute -bottom-6 -left-3 flex items-center gap-3 rounded-2xl border border-white/80 bg-white/95 p-3.5 shadow-xl backdrop-blur-md sm:-left-6">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Sparkles size={22} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    {isVi ? 'Đội ngũ Bác sĩ Chuyên khoa' : 'Expert Dental Care'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {isVi ? 'Tận tình từ lần gặp đầu tiên' : 'Gentle visit every time'}
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
