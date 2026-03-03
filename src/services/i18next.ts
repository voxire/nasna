import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { SupportedLanguage } from '../types';

const buildResources = () => {
  const resources: Record<string, Record<string, Record<string, unknown>>> = {
    en: { translation: {} },
    ar: { translation: {} },
    fr: { translation: {} },
  };

  const enModules = import.meta.glob<{ default: Record<string, unknown> }>(
    '../locales/en/*.json',
    { eager: true }
  );
  Object.entries(enModules).forEach(([path, mod]) => {
    const key = path.split('/').pop()?.replace('.json', '') ?? '';
    if (key) resources.en.translation[key] = mod.default ?? mod;
  });

  const arModules = import.meta.glob<{ default: Record<string, unknown> }>(
    '../locales/ar/*.json',
    { eager: true }
  );
  Object.entries(arModules).forEach(([path, mod]) => {
    const key = path.split('/').pop()?.replace('.json', '') ?? '';
    if (key) resources.ar.translation[key] = mod.default ?? mod;
  });

  const frModules = import.meta.glob<{ default: Record<string, unknown> }>(
    '../locales/fr/*.json',
    { eager: true }
  );
  Object.entries(frModules).forEach(([path, mod]) => {
    const key = path.split('/').pop()?.replace('.json', '') ?? '';
    if (key) resources.fr.translation[key] = mod.default ?? mod;
  });

  return resources;
};

const savedLanguage = (localStorage.getItem('language') as SupportedLanguage) || 'ar';

i18next.use(initReactI18next).init({
  resources: buildResources(),
  lng: savedLanguage,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

i18next.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
});

document.documentElement.lang = savedLanguage;
document.documentElement.dir = savedLanguage === 'ar' ? 'rtl' : 'ltr';

export const selectLanguage = (language: SupportedLanguage) => {
  if (language) {
    i18next.changeLanguage(language);
    localStorage.setItem('language', language);
  }
};

export default i18next;
