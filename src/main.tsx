import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import App from './App';
import i18next from './services/i18next';
import './styles/globals.css';
import './styles/index.scss';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import store, { persistor } from './redux/store';
import { PersistGate } from 'redux-persist/integration/react';
import { Toaster } from 'sonner';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <I18nextProvider i18n={i18next}>
          <Router>
            <App />
            <Toaster position="top-center" richColors />
          </Router>
        </I18nextProvider>
      </PersistGate>
    </Provider>
  </StrictMode>,
);
