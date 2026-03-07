import { useEffect, useRef, useState } from 'react';

interface OnlineStatus {
  isOnline: boolean;
  wasOffline: boolean;
}

export function useOnlineStatus(): OnlineStatus {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const handleOnline = () => {
      setIsOnline(true);
      timerRef.current = setTimeout(() => {
        setWasOffline(false);
      }, 4000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { isOnline, wasOffline };
}
