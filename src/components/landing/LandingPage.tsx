import { usePageMeta } from '@/lib/seo';
import { useTranslation } from 'react-i18next';
import { HeroSection } from './HeroSection';
import { BenefitsBar } from './BenefitsBar';
import { ServicesSection } from './ServicesSection';
import { AboutSection } from './AboutSection';
import { DoctorsSection } from './DoctorsSection';
import { WhyAndFaqSection } from './WhyAndFaqSection';
import { CtaSection } from './CtaSection';
import { TestimonialsSection } from './TestimonialsSection';

/**
 * Landing page component
 * Orchestrates all landing page sections
 */
export function LandingPage() {
  const { t } = useTranslation();

  usePageMeta({
    title: t('phase9.meta.homeTitle'),
    description: t('phase9.meta.homeDescription'),
  });

  return (
    <main id="top">
      <HeroSection />
      <BenefitsBar />
      <ServicesSection />
      <AboutSection />
      <DoctorsSection />
      <WhyAndFaqSection />
      <CtaSection />
      <TestimonialsSection />
    </main>
  );
}
