import { useEffect, useState, Suspense } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import ScrollToTop from './Components/ScrollToTop';
import PublicRoutes from './Routes/PublicRoutes';
import AuthRoutes from './Routes/AuthRoutes';
import AdminRoutes from './Routes/AdminRoutes';
import NotFound from './Components/NotFound/NotFound';
import PrivateRoutes from './Routes/PrivateRoutes';

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);

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

  return (
    <>
      <ScrollToTop />
      <Suspense
        fallback={
          <div className="flex justify-center items-center min-h-[80vh]">
            <Loader2 className="h-8 w-8 animate-spin text-[#12a89d]" />
          </div>
        }
      >
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

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}
