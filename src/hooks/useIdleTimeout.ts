import { useEffect, useRef } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAppDispatch } from '../redux/hooks';
import { logout } from '../redux/reducers/userSlice';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const IDLE_MS = 30 * 60 * 1000; // 30 minutes

export function useIdleTimeout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const reset = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(async () => {
        await signOut(auth);
        dispatch(logout());
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
  }, [dispatch, navigate]);
}
