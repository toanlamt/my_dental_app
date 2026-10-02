import {
  Baby,
  ChevronDown,
  HeartPulse,
  MapPin,
  ShieldCheck,
  Smile,
  Sparkles,
  Sun,
  Phone,
  Mail,
  Clock,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { doctorRecords, faqKeys, serviceRecords } from "@/data/public-data";
import { usePageMeta } from "@/lib/seo";

const iconMap = {
  heart: HeartPulse,
  sparkles: Sparkles,
  sun: Sun,
  shield: ShieldCheck,
  smile: Smile,
  baby: Baby,
};

function useMeta(title: string, description: string, noIndex = false) {
  usePageMeta({ title, description, noIndex });
}

function PageIntro({
  eyebrow,
  title,
  intro,
}: {
  eyebrow: string;
  title: string;
  intro: string;
}) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#f3f9f7] via-[#eaf4f0] to-[#f8fbfa] px-5 py-16 lg:px-8 lg:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-72 w-[600px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-[#12343b]/10 to-[#38b2ac]/15 blur-3xl"
      />
      <div className="mx-auto max-w-7xl">
        <p className="public-kicker flex items-center gap-2">
          <span className="h-px w-8 bg-[#f0b936]" />
          {eyebrow}
        </p>
        <h1 className="public-heading mt-3 max-w-3xl font-serif text-3xl font-normal tracking-tight text-[#12343b] sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#52716e] sm:text-lg">
          {intro}
        </p>
      </div>
    </section>
  );
}

function Crumbs({
  current,
  parent = "services",
}: {
  current: string;
  parent?: "services" | "doctors";
}) {
  const { t } = useTranslation("common");
  return (
    <nav
      aria-label={t("publicPages.breadcrumbs.home")}
      className="mx-auto max-w-7xl px-5 pt-8 text-xs font-semibold uppercase tracking-wider text-[#66817e] lg:px-8"
    >
      <Link to="/" className="hover:text-[#12343b] transition-colors">
        {t("publicPages.breadcrumbs.home")}
      </Link>
      <span className="px-2 text-[#9ab8b0]">/</span>
      <Link to={`/${parent}`} className="hover:text-[#12343b] transition-colors">
        {t(`publicPages.breadcrumbs.${parent}`)}
      </Link>
      <span className="px-2 text-[#9ab8b0]">/</span>
      <span className="text-[#12343b] font-bold">{current}</span>
    </nav>
  );
}

function BookButton() {
  const { t } = useTranslation("common");
  return (
    <Link
      to="/book"
      className="inline-flex items-center gap-2 rounded-full bg-[#12343b] px-7 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#1a4a54] hover:shadow-lg active:scale-[0.98]"
    >
      <span>{t("publicPages.common.book")}</span>
      <ArrowRight size={16} />
    </Link>
  );
}

function NotFound() {
  const { t } = useTranslation("common");
  return (
    <main className="mx-auto max-w-3xl px-5 py-24 text-center lg:px-8">
      <h1 className="public-heading mx-auto">
        {t("publicPages.common.notFoundTitle")}
      </h1>
      <p className="mt-5 text-[#66817e]">
        {t("publicPages.common.notFoundDescription")}
      </p>
      <Link to="/" className="public-button mt-8 bg-[#12343b] text-white">
        {t("publicPages.common.backHome")}
      </Link>
    </main>
  );
}

export function ServicesPage() {
  const { t } = useTranslation("common");
  useMeta(t("publicPages.meta.services"), t("publicPages.services.intro"));
  return (
    <>
      <PageIntro
        eyebrow={t("public.nav.services")}
        title={t("publicPages.services.title")}
        intro={t("publicPages.services.intro")}
      />
      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {serviceRecords.map((record) => {
            const Icon = iconMap[record.icon];
            return (
              <article
                key={record.slug}
                className="group flex flex-col justify-between rounded-3xl border border-[#dce9e5] bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-[#24636a]/30 hover:shadow-xl hover:shadow-[#12343b]/5"
              >
                <div>
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eaf4f0] text-[#12343b] transition-transform duration-300 group-hover:scale-110 group-hover:bg-[#12343b] group-hover:text-[#f4c95d]">
                    <Icon size={26} />
                  </div>
                  <h2 className="font-serif text-2xl font-normal text-[#12343b] group-hover:text-[#1d525c] transition-colors">
                    {t(`publicPages.services.items.${record.slug}.title`)}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-[#66817e]">
                    {t(`publicPages.services.items.${record.slug}.short`)}
                  </p>
                </div>
                <div className="mt-8 border-t border-[#f0f6f4] pt-4">
                  <Link
                    to={`/services/${record.slug}`}
                    className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#12343b] transition-colors group-hover:text-[#24636a]"
                  >
                    <span>{t("public.learnMore")}</span>
                    <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}

export function ServiceDetailPage() {
  const { slug } = useParams();
  const { t } = useTranslation("common");
  const record = serviceRecords.find((item) => item.slug === slug);
  const title = record
    ? t(`publicPages.services.items.${record.slug}.title`)
    : t("publicPages.common.notFoundTitle");
  const description = record
    ? t(`publicPages.services.items.${record.slug}.detail`)
    : t("publicPages.common.notFoundDescription");
  useMeta(title, description, !record);
  if (!record) return <NotFound />;
  const benefits = t(`publicPages.services.items.${record.slug}.benefits`, {
    returnObjects: true,
  }) as string[];
  const Icon = iconMap[record.icon];

  return (
    <>
      <Crumbs current={title} />
      <main className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-8">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eaf4f0] text-[#12343b] mb-6">
              <Icon size={32} />
            </div>
            <p className="public-kicker">{t("public.nav.services")}</p>
            <h1 className="mt-2 font-serif text-3xl font-normal text-[#12343b] sm:text-4xl lg:text-5xl">
              {title}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-[#52716e]">
              {t("publicPages.services.detailIntro")}
            </p>
            <p className="mt-6 text-base leading-relaxed text-[#52716e]">
              {t(`publicPages.services.items.${record.slug}.detail`)}
            </p>

            <h2 className="mt-12 font-serif text-2xl font-normal text-[#12343b]">
              {t("publicPages.services.benefits")}
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {benefits.map((benefit) => (
                <div
                  key={benefit}
                  className="flex items-start gap-3 rounded-2xl border border-[#dce9e5] bg-white p-5 shadow-sm"
                >
                  <CheckCircle2 size={19} className="mt-0.5 text-emerald-600 shrink-0" />
                  <span className="text-sm font-medium text-[#12343b]">{benefit}</span>
                </div>
              ))}
            </div>

            <div className="mt-10">
              <BookButton />
            </div>
          </div>

          <aside className="lg:col-span-4">
            <div className="rounded-3xl border border-[#dce9e5] bg-[#f0f6f3] p-8">
              <h3 className="font-serif text-xl font-bold text-[#12343b]">
                {t("public.brandTagline")}
              </h3>
              <p className="mt-3 text-sm leading-6 text-[#52716e]">
                {t("public.footerDescription")}
              </p>
              <div className="mt-6 space-y-3 border-t border-[#d8e6e1] pt-6">
                <div className="flex items-center gap-2.5 text-sm text-[#12343b]">
                  <Phone size={16} className="text-[#c18b13]" />
                  <span>+84 909 599 005</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-[#12343b]">
                  <Clock size={16} className="text-[#c18b13]" />
                  <span>8:00 – 20:30 (Thứ 2 - CN)</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}

export function AboutPage() {
  const { t } = useTranslation("common");
  useMeta(t("publicPages.meta.about"), t("publicPages.about.intro"));
  const values = t("publicPages.about.values", {
    returnObjects: true,
  }) as Array<{ title: string; text: string }>;
  return (
    <>
      <PageIntro
        eyebrow={t("publicPages.about.eyebrow")}
        title={t("publicPages.about.title")}
        intro={t("publicPages.about.intro")}
      />
      <main className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
        <div className="grid gap-14 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="font-serif text-3xl text-[#12343b]">
              {t("publicPages.about.missionTitle")}
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-[#52716e]">
              {t("publicPages.about.mission")}
            </p>
          </div>
          <div>
            <h2 className="font-serif text-3xl text-[#12343b]">
              {t("publicPages.about.valuesTitle")}
            </h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-3">
              {values.map((value) => (
                <article
                  key={value.title}
                  className="rounded-2xl border border-[#dce9e5] bg-white p-6 shadow-sm"
                >
                  <h3 className="font-bold text-[#12343b]">{value.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#66817e]">
                    {value.text}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-16 rounded-3xl bg-gradient-to-r from-[#eaf4f0] to-[#f0f6f3] p-8 lg:p-12">
          <h2 className="font-serif text-3xl text-[#12343b]">
            {t("publicPages.about.environmentTitle")}
          </h2>
          <p className="mt-4 max-w-2xl leading-relaxed text-[#52716e]">
            {t("publicPages.about.environment")}
          </p>
          <div className="mt-7">
            <BookButton />
          </div>
        </div>
      </main>
    </>
  );
}

export function DoctorsPage() {
  const { t } = useTranslation("common");
  useMeta(t("publicPages.meta.doctors"), t("publicPages.doctors.intro"));
  return (
    <>
      <PageIntro
        eyebrow={t("public.nav.doctors")}
        title={t("publicPages.doctors.title")}
        intro={t("publicPages.doctors.intro")}
      />
      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
        <div className="grid gap-8 md:grid-cols-3">
          {doctorRecords.map((record) => {
            return (
              <article
                key={record.slug}
                className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-[#dce9e5] bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-[#12343b]/5"
              >
                <div>
                  <div
                    className={`flex aspect-[4/3] items-center justify-center ${record.tone} p-6`}
                  >
                    <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-white bg-gradient-to-tr from-[#f4c95d] to-[#fae19b] font-serif text-4xl text-[#12343b] shadow-md transition-transform duration-300 group-hover:scale-105">
                      {record.initials}
                    </div>
                  </div>
                  <div className="p-7">
                    <h2 className="font-serif text-2xl text-[#12343b]">
                      {t(`publicPages.doctors.items.${record.slug}.name`)}
                    </h2>
                    <p className="mt-1 text-sm font-bold text-[#c18b13]">
                      {t(`publicPages.doctors.items.${record.slug}.specialty`)}
                    </p>
                    <p className="mt-4 text-sm leading-relaxed text-[#66817e]">
                      {t(`publicPages.doctors.items.${record.slug}.bio`)}
                    </p>
                  </div>
                </div>
                <div className="px-7 pb-7">
                  <Link
                    to={`/doctors/${record.slug}`}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#e2ece8] bg-[#f9fbfb] py-2.5 text-xs font-bold uppercase tracking-wider text-[#12343b] transition-all hover:bg-[#12343b] hover:text-white"
                  >
                    <span>{t("public.learnMore")}</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}

export function DoctorDetailPage() {
  const { slug } = useParams();
  const { t } = useTranslation("common");
  const record = doctorRecords.find((item) => item.slug === slug);
  const name = record
    ? t(`publicPages.doctors.items.${record.slug}.name`)
    : t("publicPages.common.notFoundTitle");
  const description = record
    ? t(`publicPages.doctors.items.${record.slug}.bio`)
    : t("publicPages.common.notFoundDescription");
  useMeta(name, description, !record);
  if (!record) return <NotFound />;
  const areas = t(`publicPages.doctors.items.${record.slug}.areas`, {
    returnObjects: true,
  }) as string[];
  return (
    <>
      <Crumbs parent="doctors" current={name} />
      <main className="mx-auto grid max-w-7xl gap-12 px-5 py-12 lg:grid-cols-[0.7fr_1.3fr] lg:px-8 lg:py-16">
        <div
          className={`flex aspect-square max-w-sm items-center justify-center rounded-3xl ${record.tone} shadow-sm`}
        >
          <div className="flex h-40 w-40 items-center justify-center rounded-full border-8 border-white bg-gradient-to-tr from-[#f4c95d] to-[#fae19b] font-serif text-5xl text-[#12343b] shadow-md">
            {record.initials}
          </div>
        </div>
        <div>
          <p className="public-kicker">
            {t(`publicPages.doctors.items.${record.slug}.specialty`)}
          </p>
          <h1 className="mt-2 font-serif text-3xl font-normal text-[#12343b] sm:text-4xl lg:text-5xl">
            {name}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-[#52716e]">
            {t(`publicPages.doctors.items.${record.slug}.bio`)}
          </p>
          <h2 className="mt-10 font-serif text-2xl text-[#12343b]">
            {t("publicPages.doctors.practice")}
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {areas.map((area) => (
              <div
                key={area}
                className="flex items-center gap-2 rounded-xl border border-[#dce9e5] bg-white p-3.5 shadow-sm text-sm font-medium text-[#12343b]"
              >
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>{area}</span>
              </div>
            ))}
          </div>
          <div className="mt-10">
            <BookButton />
          </div>
        </div>
      </main>
    </>
  );
}

export function FaqPage() {
  const { t } = useTranslation("common");
  useMeta(t("publicPages.meta.faq"), t("publicPages.faq.intro"));
  return (
    <>
      <PageIntro
        eyebrow={t("public.nav.faq")}
        title={t("publicPages.faq.title")}
        intro={t("publicPages.faq.intro")}
      />
      <main className="mx-auto max-w-4xl px-5 py-16 lg:px-8 lg:py-24">
        <div className="divide-y divide-[#dce9e5] rounded-3xl border border-[#dce9e5] bg-white px-8 py-4 shadow-sm">
          {faqKeys.map((key) => (
            <details key={key} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-base font-bold text-[#12343b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#c18b13]">
                <span>{t(`publicPages.faq.items.${key}.0`)}</span>
                <ChevronDown
                  className="shrink-0 transition-transform duration-200 group-open:rotate-180 text-[#66817e]"
                  size={19}
                />
              </summary>
              <p className="mt-4 text-sm leading-relaxed text-[#52716e]">
                {t(`publicPages.faq.items.${key}.1`)}
              </p>
            </details>
          ))}
        </div>
      </main>
    </>
  );
}

export function ContactPage() {
  const { t } = useTranslation("common");
  useMeta(t("publicPages.meta.contact"), t("publicPages.contact.intro"));
  return (
    <>
      <PageIntro
        eyebrow={t("public.nav.contact")}
        title={t("publicPages.contact.title")}
        intro={t("publicPages.contact.intro")}
      />
      <main className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-14">
          <div className="space-y-6 lg:col-span-5">
            <div className="rounded-3xl border border-[#dce9e5] bg-white p-8 shadow-sm">
              <h2 className="font-serif text-2xl font-bold text-[#12343b]">
                {t("publicPages.contact.clinic")}
              </h2>
              <div className="mt-6 space-y-5 text-sm">
                <div className="flex items-start gap-3.5">
                  <MapPin className="mt-0.5 shrink-0 text-[#c18b13]" size={18} />
                  <div>
                    <strong className="block text-xs uppercase tracking-wider text-[#66817e]">
                      {t("publicPages.contact.addressLabel")}
                    </strong>
                    <p className="mt-1 text-[#12343b]">
                      {t("publicPages.contact.address")}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3.5">
                  <Phone className="mt-0.5 shrink-0 text-[#c18b13]" size={18} />
                  <div>
                    <strong className="block text-xs uppercase tracking-wider text-[#66817e]">
                      {t("publicPages.contact.phoneLabel")}
                    </strong>
                    <p className="mt-1 font-bold text-[#12343b]">
                      {t("publicPages.contact.phone")}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3.5">
                  <Mail className="mt-0.5 shrink-0 text-[#c18b13]" size={18} />
                  <div>
                    <strong className="block text-xs uppercase tracking-wider text-[#66817e]">
                      {t("publicPages.contact.emailLabel")}
                    </strong>
                    <p className="mt-1 text-[#12343b]">
                      {t("publicPages.contact.email")}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3.5">
                  <Clock className="mt-0.5 shrink-0 text-[#c18b13]" size={18} />
                  <div>
                    <strong className="block text-xs uppercase tracking-wider text-[#66817e]">
                      {t("publicPages.contact.hoursLabel")}
                    </strong>
                    <p className="mt-1 text-[#12343b]">
                      {t("publicPages.contact.hours")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-[#12343b] p-8 text-white shadow-sm">
              <h3 className="font-serif text-xl font-bold">
                {t("public.hero.comfortNote")}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[#b8cfca]">
                {t("public.cta.description")}
              </p>
              <div className="mt-6">
                <Link
                  to="/book"
                  className="inline-flex items-center gap-2 rounded-full bg-[#f4c95d] px-6 py-3 text-sm font-bold text-[#12343b] transition hover:bg-[#fae19b]"
                >
                  <span>{t("publicPages.common.book")}</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="overflow-hidden rounded-3xl border border-[#dce9e5] bg-white p-8 shadow-sm">
              <h2 className="font-serif text-2xl font-bold text-[#12343b]">
                {t("publicPages.contact.mapTitle")}
              </h2>
              <p className="mt-2 text-sm text-[#66817e]">
                {t("publicPages.contact.mapText")}
              </p>
              <div className="mt-6 flex aspect-[16/10] flex-col items-center justify-center rounded-2xl bg-[#eaf4f0] text-center p-6 border border-[#dce9e5]">
                <MapPin size={48} className="text-[#12343b]/40 mb-3" />
                <p className="font-serif text-lg font-bold text-[#12343b]">
                  {t("publicPages.contact.clinic")}
                </p>
                <p className="text-sm text-[#52716e] max-w-sm mt-1">
                  {t("publicPages.contact.address")}
                </p>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(
                    "918 Âu Cơ, Tân Bình, Thành phố Hồ Chí Minh, Việt Nam"
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#12343b] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-[#1a4a54] transition-colors"
                >
                  <span>{t("publicPages.contact.mapLink")}</span>
                  <ArrowRight size={14} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
