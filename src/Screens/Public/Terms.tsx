import { useTranslation } from 'react-i18next';

const SECTION_KEYS = [
  'acceptance',
  'purpose',
  'dataCollection',
  'consent',
  'userResponsibilities',
  'limitations',
  'modifications',
  'contact',
] as const;

function Terms() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-1">{t('terms.title')}</h1>
      <p className="text-sm text-gray-400 mb-10">{t('terms.lastUpdated')}</p>

      <div className="space-y-8">
        {SECTION_KEYS.map((key) => (
          <section key={key}>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              {t(`terms.sections.${key}.title`)}
            </h2>
            <p className="text-gray-600 leading-relaxed">
              {t(`terms.sections.${key}.body`)}
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}

export default Terms;
