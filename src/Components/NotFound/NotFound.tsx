import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@/Components/ui/button';
import { ArrowLeft } from 'lucide-react';

function NotFound() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white text-center px-4">
      <h1 className="text-[120px] font-bold leading-none text-[#12a89d] select-none">404</h1>
      <p className="text-gray-500 text-lg mt-2 mb-8">{t('common.notFound')}</p>
      <Button variant="default" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        {t('common.goBack')}
      </Button>
    </div>
  );
}

export default NotFound;
