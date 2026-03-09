import { Suspense, ReactNode } from 'react';
import ErrorBoundary from './ErrorBoundary';
import LoadingScreen from './LoadingScreen';

interface Props {
  children: ReactNode;
}

export default function LazyBoundary({ children }: Props) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingScreen />}>{children}</Suspense>
    </ErrorBoundary>
  );
}
