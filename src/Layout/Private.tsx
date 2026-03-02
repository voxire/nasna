import { ReactNode } from 'react';
import Header from '../Components/Header';

interface PrivateProps {
  children: ReactNode;
}

function Private({ children }: PrivateProps) {
  return (
    <div>
      <Header dashboard={true} />
      <div
        style={{
          padding: 20,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default Private;
