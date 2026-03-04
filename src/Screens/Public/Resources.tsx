import { useTranslation } from 'react-i18next';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/Components/ui/button';

const ORGS = [
  { name: 'UNHCR Lebanon', url: 'https://www.unhcr.org/lb' },
  { name: 'Lebanese Red Cross', url: 'https://www.redcross.org.lb' },
  { name: 'UNICEF Lebanon', url: 'https://www.unicef.org/lebanon' },
  { name: 'Caritas Lebanon', url: 'https://www.caritasliban.org.lb' },
  { name: 'WFP Lebanon', url: 'https://www.wfp.org/countries/lebanon' },
  { name: 'MSF Lebanon', url: 'https://www.msf.org/lebanon' },
  { name: 'ICRC Lebanon', url: 'https://www.icrc.org/en/where-we-work/middle-east/lebanon' },
  { name: 'IRC Lebanon', url: 'https://www.rescue.org/country/lebanon' },
  { name: 'Arcenciel', url: 'https://www.arcenciel.org' },
  { name: 'ABAAD', url: 'https://www.abaadmena.org' },
];

export default function Resources() {
  const { t } = useTranslation();

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-1">{t('resources.title')}</h1>
      <p className="text-gray-500 mb-8">{t('resources.subtitle')}</p>

      <div className="space-y-3">
        {ORGS.map(({ name, url }) => (
          <div
            key={name}
            className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-6 py-5"
          >
            <span className="font-medium text-gray-900">{name}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
            >
              {t('resources.visitWebsite')}
              <ExternalLink className="h-4 w-4 ml-1.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
