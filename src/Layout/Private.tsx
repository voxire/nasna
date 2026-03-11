import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, WifiOff } from 'lucide-react';
import PrivateNavbar from './Private/PrivateNavbar';
import PageTransition from '../Components/PageTransition';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface PrivateProps {
  children: ReactNode;
}

function Private({ children }: PrivateProps) {
  const { t } = useTranslation('common');
  const { isOnline, wasOffline } = useOnlineStatus();

  return (
    <div>
      {!isOnline && (
        <div className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-red-600 px-4 py-2 text-sm text-white">
          <WifiOff className="h-4 w-4 shrink-0" />
          <span>{t('offlineBanner')}</span>
        </div>
      )}
      {isOnline && wasOffline && (
        <div className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-sm text-white">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
          <span>{t('syncingBanner')}</span>
        </div>
      )}
      <PrivateNavbar />
      <div style={{ padding: 20 }}>
        <PageTransition>{children}</PageTransition>
      </div>
    </div>
  );
}

export default Private;
