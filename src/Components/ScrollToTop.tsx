import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = (): null => {
  const { pathname } = useLocation();

  useEffect(() => {
    const scrollToTop = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    scrollToTop();

    return () => {
      window.removeEventListener('scroll', scrollToTop);
    };
  }, [pathname]);

  return null;
};

export default ScrollToTop;
