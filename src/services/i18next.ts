import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { SupportedLanguage } from '../types';
import { getCookie, setCookie } from '../utils/cookies';

type LocaleNamespace = Record<string, unknown>;
type LocaleModule = { default: LocaleNamespace };

const loadLocaleModules = (pattern: string): Record<string, LocaleModule> =>
  import.meta.glob<LocaleModule>(pattern, { eager: true });

const buildResources = () => {
  const resources: Record<string, Record<string, Record<string, unknown>>> = {
    en: { translation: {} },
    ar: { translation: {} },
    fr: { translation: {} },
  };

  const enModules = loadLocaleModules('../locales/en/*.json');
  Object.entries(enModules).forEach(([path, mod]) => {
    const key = path.split('/').pop()?.replace('.json', '') ?? '';
    if (key) resources.en.translation[key] = mod.default;
  });

  const arModules = loadLocaleModules('../locales/ar/*.json');
  Object.entries(arModules).forEach(([path, mod]) => {
    const key = path.split('/').pop()?.replace('.json', '') ?? '';
    if (key) resources.ar.translation[key] = mod.default;
  });

  const frModules = loadLocaleModules('../locales/fr/*.json');
  Object.entries(frModules).forEach(([path, mod]) => {
    const key = path.split('/').pop()?.replace('.json', '') ?? '';
    if (key) resources.fr.translation[key] = mod.default;
  });

  return resources;
};

const savedLanguage = (getCookie('language') as SupportedLanguage) || 'ar';

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
    setCookie('language', language, 365 * 24 * 60 * 60);
  }
};

export default i18next;
