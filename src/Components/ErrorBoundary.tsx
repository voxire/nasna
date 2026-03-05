import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6">
          <h1 className="text-2xl font-bold text-gray-800">Something went wrong</h1>
          <p className="text-sm text-gray-500 text-center">
            Please refresh the page and try again.
          </p>
          <button
            className="px-6 py-2 bg-[#12a89d] text-white rounded-lg hover:bg-[#0e9088] text-sm font-medium"
            onClick={() => window.location.reload()}
          >
            Refresh
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
