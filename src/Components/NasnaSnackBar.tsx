import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Snackbar, Alert } from '@mui/material';

interface SnackBarContextType {
  showSnackbar: (
    message: string,
    severity?: 'success' | 'error' | 'warning' | 'info',
    duration?: number,
  ) => void;
}

const SnackBarContext = createContext<SnackBarContextType | undefined>(undefined);

export const useSnackBar = (): SnackBarContextType => {
  const context = useContext(SnackBarContext);
  if (!context) {
    throw new Error('useSnackBar must be used within a NasnaSnackBarProvider');
  }
  return context;
};

interface NasnaSnackBarProviderProps {
  children: ReactNode;
}

export const NasnaSnackBarProvider: React.FC<NasnaSnackBarProviderProps> = ({ children }) => {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    'success' | 'error' | 'warning' | 'info'
  >('success');
  const [autoHideDuration, setAutoHideDuration] = useState(6000);

  const showSnackbar = useCallback(
    (
      message: string,
      severity: 'success' | 'error' | 'warning' | 'info' = 'success',
      duration: number = 6000,
    ) => {
      setSnackbarMessage(message);
      setSnackbarSeverity(severity);
      setAutoHideDuration(duration);
      setSnackbarOpen(true);
    },
    [],
  );

  const handleClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <SnackBarContext.Provider value={{ showSnackbar }}>
      {children}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={autoHideDuration}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleClose} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </SnackBarContext.Provider>
  );
};
