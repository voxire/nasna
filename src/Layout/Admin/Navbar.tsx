import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';
import { useAppDispatch } from '../../redux/hooks';
import { logout } from '../../redux/reducers/userSlice';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';

interface NavbarProps {
  openSidebar: (source: string) => void;
}

const Navbar = ({ openSidebar }: NavbarProps) => {
  const [openModal, setOpenModal] = useState(false);
  const dispatch = useAppDispatch();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      dispatch(logout());
      toast.success('You have been logged out.');
      setOpenModal(false);
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Failed to log out. Please try again.');
    }
  };

  return (
    <div className="navbar">
      <div className="nav_icon" onClick={() => openSidebar('navbar')}>
        <FontAwesomeIcon icon={faBars} />
      </div>

      <div className="navbar__left">
        <p>{auth?.currentUser?.email}</p>
      </div>
      <div className="navbar__right">
        <div onClick={() => setOpenModal(true)}>
          <p>Log out</p>
        </div>
      </div>

      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
            <DialogDescription>Are you sure you want to log out?</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-between">
            <Button variant="destructive" onClick={handleLogout}>
              Confirm
            </Button>
            <Button variant="outline" onClick={() => setOpenModal(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Navbar;
