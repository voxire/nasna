import { Suspense, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import ErrorBoundary from './ErrorBoundary';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

const defaultFallback = (
  <div className="flex min-h-[50vh] items-center justify-center bg-transparent">
    <Loader2 className="h-8 w-8 animate-spin text-[#12a89d]" />
  </div>
);

export default function LazyBoundary({ children, fallback }: Props) {
  return (
    <ErrorBoundary>
      <Suspense fallback={fallback ?? defaultFallback}>{children}</Suspense>
    </ErrorBoundary>
  );
}
