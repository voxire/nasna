import { useTranslation } from 'react-i18next';
import Lottie from 'lottie-react';
import animationData from '../../../public/animation/Nasna.json';

function Confirmation() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col justify-between" style={{ height: '86dvh' }}>
      <div className="flex flex-col justify-center items-center p-6 text-center flex-grow">
        <Lottie animationData={animationData} style={{ width: 300, height: 300 }} />
        <h1 className="text-3xl font-bold mb-2">{t('confirmation.thankYou')}</h1>
        <h2 className="text-xl mb-2">{t('confirmation.submissionRecieved')}</h2>
        <p className="text-base">{t('confirmation.appreciation')}</p>
      </div>
    </div>
  );
}

export default Confirmation;
