import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en/common';
import vi from './locales/vi/common';
import enPublicPages from './locales/en/public-pages';
import viPublicPages from './locales/vi/public-pages';
import enPhase9 from './locales/en/phase9';
import viPhase9 from './locales/vi/phase9';

const savedLanguage = localStorage.getItem('language');

void i18n.use(initReactI18next).init({
  resources: {
    en: { common: { ...en, publicPages: enPublicPages, phase9: enPhase9 } },
    vi: { common: { ...vi, publicPages: viPublicPages, phase9: viPhase9 } },
  },
  lng: savedLanguage === 'en' ? 'en' : 'vi',
  fallbackLng: 'en',
  defaultNS: 'common',
  interpolation: { escapeValue: false },
});

i18n.on('initialized', () => {
  document.documentElement.lang = i18n.language;
});

i18n.on('languageChanged', (language) => localStorage.setItem('language', language));
i18n.on('languageChanged', (language) => {
  document.documentElement.lang = language;
});
export default i18n;