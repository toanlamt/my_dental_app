import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

export function LanguageSwitcher() {
  const { t } = useTranslation();
  return <div className="flex items-center gap-1" aria-label={t('language.switch')}><button type="button" className={i18n.language === 'en' ? 'font-semibold text-primary' : 'text-muted-foreground'} onClick={() => void i18n.changeLanguage('en')}>EN</button><span className="text-muted-foreground">/</span><button type="button" className={i18n.language === 'vi' ? 'font-semibold text-primary' : 'text-muted-foreground'} onClick={() => void i18n.changeLanguage('vi')}>VI</button></div>;
}