import { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, Button, Menu, MenuItem, IconButton } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLanguage } from '@fortawesome/free-solid-svg-icons';
import { selectLanguage } from '../../services/i18next';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../redux/hooks';
import { logout } from '../../redux/reducers/userSlice';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';
import type { SupportedLanguage } from '../../types';

function PrivateNavbar() {
  const dispatch = useAppDispatch();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const navigate = useNavigate();

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

  const handleClickAbout = () => {
    window.location.href = '/';
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
        >
          <img
            src="/Nasna Logo.png"
            alt="Nasna logo"
            width="140px"
            height="100%"
            style={{ margin: '0px', cursor: 'pointer' }}
            onClick={handleClickAbout}
          />
        </Typography>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Button color="inherit" onClick={handleLogout} sx={{ marginLeft: '10px' }}>
            Logout
          </Button>
          <IconButton onClick={(event) => setAnchorEl(event.currentTarget)} color="inherit">
            <FontAwesomeIcon icon={faLanguage} style={{ color: '#12a89d' }} />
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
            <MenuItem onClick={() => handleLanguageChange('en')}>English</MenuItem>
            <MenuItem onClick={() => handleLanguageChange('ar')}>Arabic</MenuItem>
            <MenuItem onClick={() => handleLanguageChange('fr')}>French</MenuItem>
          </Menu>
        </div>
      </Toolbar>
    </AppBar>
  );
}

export default PrivateNavbar;
