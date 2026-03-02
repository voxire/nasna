import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { I18nextProvider } from 'react-i18next';
import { CssBaseline } from '@mui/material';
import App from './App';
import i18next from './services/i18next';
import './styles/index.scss';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import store, { persistor } from './redux/store';
import { PersistGate } from 'redux-persist/integration/react';
import { NasnaSnackBarProvider } from './Components/NasnaSnackBar';

const theme = createTheme({
  palette: {
    primary: {
      main: '#12a89d',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#AEDFF7',
    },
  },
  components: {
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #424242',
        },
      },
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ThemeProvider theme={theme}>
          <I18nextProvider i18n={i18next}>
            <NasnaSnackBarProvider>
              <CssBaseline />
              <Router>
                <App />
              </Router>
            </NasnaSnackBarProvider>
          </I18nextProvider>
        </ThemeProvider>
      </PersistGate>
    </Provider>
  </StrictMode>,
);
