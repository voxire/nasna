import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';

const IDLE_MS = 30 * 60 * 1000; // 30 minutes

export function useIdleTimeout() {
  const navigate = useNavigate();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    const reset = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(async () => {
        await logout();
        toast.info('Session expired due to inactivity.');
        navigate('/auth/login');
      }, IDLE_MS);
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'] as const;
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();

    return () => {
      if (timer.current) clearTimeout(timer.current);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [logout, navigate]);
}
