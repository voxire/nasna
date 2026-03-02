import { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, IconButton, Menu, MenuItem } from '@mui/material';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLanguage, faChartBar, faSignOut } from '@fortawesome/free-solid-svg-icons';
import { selectLanguage } from '../services/i18next';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../redux/hooks';
import { logout } from '../redux/reducers/userSlice';
import type { SupportedLanguage } from '../types';

interface HeaderProps {
  dashboard?: boolean;
}

function Header({ dashboard = false }: HeaderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const tokenResult = await firebaseUser.getIdTokenResult();
          setRole(tokenResult.claims['role'] as string | null);
        } catch (error) {
          console.error('Error retrieving user role:', error);
        }
      } else {
        setRole(null);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage) {
      selectLanguage(savedLanguage as SupportedLanguage);
    }
  }, []);

  const handleLanguageChange = (lng: SupportedLanguage) => {
    selectLanguage(lng);
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      dispatch(logout());
      navigate('/auth/login');
    } catch (error) {
      console.error('Error logging out: ', error);
    }
  };

  return (
    <AppBar
      position="sticky"
      sx={{
        backgroundColor: '#f9f9f9',
        color: '#12a89d',
      }}
    >
      <Toolbar>
        <Typography
          variant="h6"
          component="div"
          sx={{
            flexGrow: 1,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
          }}
          onClick={() => navigate('/')}
        >
          <img
            src="/Nasna Logo.png"
            alt="Nasna logo"
            width="140px"
            height="100%"
            style={{ margin: '0px', cursor: 'pointer' }}
          />
        </Typography>

        {user && (
          <>
            {!dashboard && (
              <IconButton
                color="inherit"
                onClick={() => {
                  if (role === 'admin') navigate('/manage');
                  else navigate('/ngo/submissions');
                }}
              >
                <FontAwesomeIcon icon={faChartBar} />
              </IconButton>
            )}
            <IconButton color="inherit" onClick={handleLogout}>
              <FontAwesomeIcon icon={faSignOut} />
            </IconButton>
          </>
        )}

        <IconButton onClick={(event) => setAnchorEl(event.currentTarget)} color="inherit">
          <FontAwesomeIcon icon={faLanguage} style={{ color: '#12a89d' }} />
        </IconButton>
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
          <MenuItem onClick={() => handleLanguageChange('en')}>English</MenuItem>
          <MenuItem onClick={() => handleLanguageChange('ar')}>Arabic</MenuItem>
          <MenuItem onClick={() => handleLanguageChange('fr')}>French</MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}

export default Header;
