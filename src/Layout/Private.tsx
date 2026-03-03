import { ReactNode } from 'react';
import Header from '../Components/Header';
import PageTransition from '../Components/PageTransition';

interface PrivateProps {
  children: ReactNode;
}

function Private({ children }: PrivateProps) {
  return (
    <div>
      <Header dashboard={true} />
      <div style={{ padding: 20 }}>
        <PageTransition>{children}</PageTransition>
      </div>
    </div>
  );
}

export default Private;
