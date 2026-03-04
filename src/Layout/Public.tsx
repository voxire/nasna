import { ReactNode } from 'react';
import Header from '../Components/Header';
import Footer from '../Components/Footer';
import PageTransition from '../Components/PageTransition';

interface PublicProps {
  children: ReactNode;
}

function Public({ children }: PublicProps) {
  return (
    <div className="overflow-x-hidden">
      <Header />
      <PageTransition>{children}</PageTransition>
      <Footer />
    </div>
  );
}

export default Public;
