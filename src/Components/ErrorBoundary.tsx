import { Component, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

function ErrorFallback({ onReset }: { onReset: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
      <h1 className="text-2xl font-bold text-gray-800">{t('common.errorTitle')}</h1>
      <p className="text-center text-sm text-gray-500">{t('common.errorDescription')}</p>
      <button
        className="rounded-lg bg-[#12a89d] px-6 py-2 text-sm font-medium text-white hover:bg-[#0e9088]"
        onClick={onReset}
      >
        {t('common.errorRefresh')}
      </button>
    </div>
  );
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error): void {
    // Log error type only — no PII
    console.error('[ErrorBoundary]', error.name, error.message);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onReset={() => window.location.reload()} />;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
