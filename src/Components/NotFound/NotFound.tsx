import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router';
import { Button } from '@mui/material';
import { useTranslation } from 'react-i18next';

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
        <Button variant="contained" color="primary" className="goBack" onClick={() => navigate(-1)}>
          <FontAwesomeIcon icon={faArrowLeft} />
        </Button>
      </div>
    </div>
  );
}

export default NotFound;
