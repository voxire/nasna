import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@/Components/ui/button';
import { ArrowLeft } from 'lucide-react';

function NotFound() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="FourOFour">
      <div className="error">404</div>
      <br />
      <br />
      <span className="info">{t('NotFound')}</span>
      <div className="goBack">
        <Button variant="default" className="goBack" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default NotFound;
