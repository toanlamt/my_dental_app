import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en/common';
import vi from './locales/vi/common';

const savedLanguage = localStorage.getItem('language');

void i18n.use(initReactI18next).init({
  resources: { en: { common: en }, vi: { common: vi } },
  lng: savedLanguage === 'en' ? 'en' : 'vi',
  fallbackLng: 'en',
  defaultNS: 'common',
  interpolation: { escapeValue: false },
});

i18n.on('languageChanged', (language) => localStorage.setItem('language', language));
export default i18n;