import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePageMeta } from '@/lib/seo';

export function NotFoundPage() {
  const { t } = useTranslation();

  usePageMeta({
    title: t('phase9.notFound.metaTitle'),
    description: t('phase9.notFound.metaDescription'),
    noIndex: true,
  });

  return (
    <main className="mx-auto max-w-3xl px-5 py-24 text-center lg:px-8">
      <h1 className="public-heading mx-auto">{t('phase9.notFound.title')}</h1>
      <p className="mt-5 text-[#66817e]">{t('phase9.notFound.description')}</p>
      <Link to="/" className="public-button mt-8 bg-[#12343b] text-white">
        {t('publicPages.common.backHome')}
      </Link>
    </main>
  );
}
