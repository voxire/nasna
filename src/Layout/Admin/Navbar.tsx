import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';
import { Modal, Box, Typography, Button } from '@mui/material';
import { useAppDispatch } from '../../redux/hooks';
import { logout } from '../../redux/reducers/userSlice';
import { useSnackBar } from '../../Components/NasnaSnackBar';

interface NavbarProps {
  openSidebar: (source: string) => void;
}

const Navbar = ({ openSidebar }: NavbarProps) => {
  const [openModal, setOpenModal] = useState(false);
  const dispatch = useAppDispatch();
  const { showSnackbar } = useSnackBar();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      dispatch(logout());

      showSnackbar('You have been logged out.', 'success');
      setOpenModal(false);
    } catch (error) {
      console.error('Logout failed:', error);
      showSnackbar('Failed to log out. Please try again.', 'error');
    }
  };

  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => setOpenModal(false);

  return (
    <div className="navbar">
      <div className="nav_icon" onClick={() => openSidebar('navbar')}>
        <FontAwesomeIcon icon={faBars} />
      </div>

      <div className="navbar__left">
        <p>{auth?.currentUser?.email}</p>
      </div>
      <div className="navbar__right">
        <div onClick={handleOpenModal}>
          <p>Log out</p>
        </div>
      </div>

      <Modal open={openModal} onClose={handleCloseModal}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '400px',
            backgroundColor: 'white',
            boxShadow: 24,
            p: 4,
            borderRadius: '8px',
          }}
        >
          <Typography id="logout-modal-title" variant="h6" component="h2">
            Confirm Logout
          </Typography>
          <Typography id="logout-modal-description" sx={{ mt: 2 }}>
            Are you sure you want to log out?
          </Typography>
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Button variant="contained" color="error" onClick={handleLogout}>
              Confirm
            </Button>
            <Button variant="outlined" onClick={handleCloseModal}>
              Cancel
            </Button>
          </Box>
        </Box>
      </Modal>
    </div>
  );
};

export default Navbar;
