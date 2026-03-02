import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { TextField, Button, Box } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { useSnackBar } from '../../Components/NasnaSnackBar';
import { loginUser } from '../../redux/reducers/userSlice';
import { useTranslation } from 'react-i18next';

function Login() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAppSelector((state) => state.user);
  const { showSnackbar } = useSnackBar();

  useEffect(() => {
    if (user) {
      navigate(-1);
    }
  }, [user, navigate, location.state]);

  const handleFirebaseError = (errorCode: string) => {
    switch (errorCode) {
      case 'auth/user-not-found':
        showSnackbar(t('login.toast.userNotFound'), 'error');
        break;
      case 'auth/wrong-password':
        showSnackbar(t('login.toast.wrongPassword'), 'error');
        break;
      case 'auth/invalid-email':
        showSnackbar(t('login.toast.invalidEmailFormat'), 'error');
        break;
      case 'auth/invalid-credential':
        showSnackbar(t('login.toast.invalidCredential'), 'error');
        break;
      default:
        showSnackbar(t('login.toast.genericError'), 'error');
        break;
    }
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      showSnackbar(t('login.toast.emailPasswordRequired'), 'error');
      return;
    }

    const result = await dispatch(loginUser({ email, password }));
    if (loginUser.fulfilled.match(result)) {
      showSnackbar(t('login.toast.success'), 'success');
      navigate('/ngo/submissions');
    } else {
      handleFirebaseError((result.payload as string) ?? '');
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        padding: '0 20px',
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: '400px',
          textAlign: 'center',
          padding: '20px',
          borderRadius: '8px',
        }}
      >
        <img
          src="/Nasna Logo.png"
          alt={t('login.logoAlt')}
          style={{ width: '230px', marginBottom: 20 }}
        />
        <TextField
          label={t('login.fields.email')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
          margin="normal"
        />
        <TextField
          label={t('login.fields.password')}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          margin="normal"
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleSignIn}
          fullWidth
          sx={{ mt: 2 }}
          disabled={loading}
        >
          {loading ? t('login.buttons.loading') : t('login.buttons.signIn')}
        </Button>
      </Box>
    </Box>
  );
}

export default Login;
