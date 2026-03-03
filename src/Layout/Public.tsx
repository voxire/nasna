import { ReactNode } from 'react';
import Header from '../Components/Header';
import Footer from '../Components/Footer';
import PageTransition from '../Components/PageTransition';

interface PublicProps {
  children: ReactNode;
}

function Public({ children }: PublicProps) {
  return (
    <div>
      <Header />
      <div
        style={{
          backgroundColor: '#FAFAFA',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
        }}
      >
        <div style={{ maxWidth: '1500px', width: '100%' }}>
          <PageTransition>{children}</PageTransition>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Public;
