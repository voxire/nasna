import { Suspense, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import ErrorBoundary from './ErrorBoundary';

interface Props {
  children: ReactNode;
}

export default function LazyBoundary({ children }: Props) {
  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <div className="flex min-h-[50vh] items-center justify-center bg-transparent">
            <Loader2 className="h-8 w-8 animate-spin text-[#12a89d]" />
          </div>
        }
      >
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}
