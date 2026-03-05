import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import App from './App';
import i18next from './services/i18next';
import './styles/globals.css';
import { BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from 'sonner';
import ErrorBoundary from './Components/ErrorBoundary';

// Self-XSS warning
console.log('%cSTOP!', 'color:#e53e3e;font-size:52px;font-weight:bold;');
console.log(
  '%cThis browser feature is intended for developers only.\nIf someone told you to paste anything here, they are trying to compromise accounts on this platform.',
  'font-size:15px;',
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <I18nextProvider i18n={i18next}>
        <Router>
          <App />
          <Toaster position="top-center" richColors />
        </Router>
      </I18nextProvider>
    </ErrorBoundary>
  </StrictMode>,
);
