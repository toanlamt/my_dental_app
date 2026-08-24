import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

export function LanguageSwitcher() {
  const { t } = useTranslation();
  return <div className="flex items-center gap-1" aria-label={t('language.switch')}><button type="button" aria-pressed={i18n.language === 'en'} className={i18n.language === 'en' ? 'rounded px-1 font-semibold text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary' : 'rounded px-1 text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary'} onClick={() => void i18n.changeLanguage('en')}>EN</button><span className="text-muted-foreground">/</span><button type="button" aria-pressed={i18n.language === 'vi'} className={i18n.language === 'vi' ? 'rounded px-1 font-semibold text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary' : 'rounded px-1 text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary'} onClick={() => void i18n.changeLanguage('vi')}>VI</button></div>;
}