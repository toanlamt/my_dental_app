import { Link, Outlet } from 'react-router-dom';
import { Menu, Stethoscope, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useTranslation } from 'react-i18next';

export function PublicLayout() {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const links = [['/services', 'services'], ['/about', 'about'], ['/doctors', 'doctors'], ['/faq', 'faq'], ['/contact', 'contact']] as const;

  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  return <div className="public-site min-h-screen bg-[#f8fbfa] text-[#12343b]">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:font-semibold focus:text-[#12343b] focus:shadow">
        {t('phase9.a11y.skipToMain')}
      </a>
      <header className="border-b border-[#dce9e5] bg-[#f8fbfa]/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
          <Link to="/" className="flex items-center gap-3" aria-label={t('public.brand')}>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#12343b] text-[#f4c95d]">
              <Stethoscope size={21} />
            </span>
            <span>
              <strong className="block font-serif text-lg tracking-tight">{t('public.brand')}</strong>
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#66817e]">{t('public.brandTagline')}</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-7 lg:flex" aria-label={t('public.navigationLabel')}>
            {links.map(([path, label]) => <Link key={path} to={path} className="public-nav-link">{t(`public.nav.${label}`)}</Link>)}
          </nav>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Link to="/book" className="hidden rounded-full bg-[#f4c95d] px-5 py-2.5 text-sm font-bold text-[#12343b] sm:inline-flex">{t('public.bookAppointment')}</Link>
            <button type="button" onClick={() => setMenuOpen(true)} aria-label={t('public.mobile.open')} aria-expanded={menuOpen} aria-controls="public-mobile-menu" className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#12343b] text-white lg:hidden"><Menu size={20} /></button>
          </div>
        </div>
      </header>
      <div id="main-content">
        <Outlet />
      </div>
      {menuOpen && <div id="public-mobile-menu" role="dialog" aria-modal="true" aria-label={t('public.navigationLabel')} className="fixed inset-0 z-50 bg-[#12343b] p-6 text-white lg:hidden"><div className="flex items-center justify-between"><span className="font-serif text-xl">{t('public.brand')}</span><button type="button" onClick={() => setMenuOpen(false)} aria-label={t('public.mobile.close')}><X size={24} /></button></div><nav className="mt-16 grid gap-6 text-2xl font-serif" aria-label={t('public.navigationLabel')}>{links.map(([path, label]) => <Link key={path} to={path} onClick={() => setMenuOpen(false)}>{t(`public.nav.${label}`)}</Link>)}<Link to="/book" className="text-[#f4c95d]" onClick={() => setMenuOpen(false)}>{t('public.bookAppointment')}</Link></nav></div>}
      <footer className="bg-[#12343b] text-[#eaf4f1]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-8">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f4c95d] text-[#12343b]">
                <Stethoscope size={18} />
              </span>
              <strong className="font-serif text-xl">{t('public.brand')}</strong>
            </div>
            <p className="max-w-xs text-sm leading-6 text-[#b8cfca]">{t('public.footerDescription')}</p>
          </div>
          <div>
            <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-[#f4c95d]">{t('public.footerExplore')}</h2>
            <div className="grid gap-3 text-sm text-[#b8cfca]">
              {links.slice(0, 3).map(([path, label]) => <Link key={path} to={path}>{t(`public.nav.${label}`)}</Link>)}
            </div>
          </div>
          <div>
            <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-[#f4c95d]">{t('public.footerContact')}</h2>
            <p className="text-sm leading-6 text-[#b8cfca]">{t('publicPages.contact.address')}<br />{t('publicPages.contact.phone')}<br />{t('publicPages.contact.email')}</p>
          </div>
          <div>
            <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-[#f4c95d]">{t('public.footerHours')}</h2>
            <p className="text-sm leading-6 text-[#b8cfca]">{t('publicPages.contact.hours')}</p>
          </div>
        </div>
        <div className="border-t border-[#31535a] py-5 text-center text-xs text-[#8eafaa]">{t('public.copyright')}</div>
      </footer>
    </div>;
}