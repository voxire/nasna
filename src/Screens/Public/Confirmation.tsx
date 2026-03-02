import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import Lottie from 'lottie-react';
import animationData from '../../../public/animation/Nasna.json';

function Confirmation() {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '86dvh',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '24px',
          textAlign: 'center',
          flexGrow: 0.7,
        }}
      >
        <Lottie animationData={animationData} style={{ width: 300, height: 300 }} />
        <Typography variant="h4" component="h1" gutterBottom>
          {t('confirmation.thankYou')}
        </Typography>
        <Typography variant="h6" component="p" gutterBottom>
          {t('confirmation.submissionRecieved')}
        </Typography>
        <Typography variant="body1" component="p" gutterBottom>
          {t('confirmation.appreciation')}
        </Typography>
      </Box>
    </Box>
  );
}

export default Confirmation;
