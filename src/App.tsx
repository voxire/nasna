import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import ScrollToTop from './Components/ScrollToTop';
import PublicRoutes from './Routes/PublicRoutes';
import AuthRoutes from './Routes/AuthRoutes';
import AdminRoutes from './Routes/AdminRoutes';
import NotFound from './Components/NotFound/NotFound';
import PrivateRoutes from './Routes/PrivateRoutes';
import LoadingScreen from './Components/LoadingScreen';
import { useAuthStore } from './stores/authStore';
import { trackPageView } from './services/analytics';

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const authLoading = useAuthStore((state) => state.loading);
  const authInitialized = useAuthStore((state) => state.initialized);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname === '/index.html') {
      setIsRedirecting(true);
      navigate('/', { replace: true });
    } else {
      setIsRedirecting(false);
    }
  }, [location.pathname, navigate]);

  if (isRedirecting) {
    return null;
  }

  if (!authInitialized && authLoading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <ScrollToTop />
      <Routes key={location.pathname} location={location}>
        {PublicRoutes.map((route, index) => (
          <Route key={index} path={route.path} element={route.element} />
        ))}

        {AuthRoutes.map((route, index) => (
          <Route key={index} path={route.path} element={route.element} />
        ))}

        {AdminRoutes.map((route, index) => (
          <Route key={index} path={route.path} element={route.element} />
        ))}

        {PrivateRoutes.map((route, index) => (
          <Route key={index} path={route.path} element={route.element} />
        ))}

        <Route path="/login" element={<Navigate to="/auth/login" replace />} />
        <Route path="/register" element={<Navigate to="/auth/register" replace />} />
        <Route path="/admin" element={<Navigate to="/manage" replace />} />
        <Route path="/dashboard" element={<Navigate to="/manage" replace />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
