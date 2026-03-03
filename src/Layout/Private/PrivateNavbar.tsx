import { useEffect } from 'react';
import { getCookie } from '../../utils/cookies';
import { Globe, LogOut } from 'lucide-react';
import { selectLanguage } from '../../services/i18next';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../redux/hooks';
import { logout } from '../../redux/reducers/userSlice';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';
import type { SupportedLanguage } from '../../types';
import { Button } from '@/Components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';

function PrivateNavbar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const savedLanguage = getCookie('language');
    if (savedLanguage) {
      selectLanguage(savedLanguage as SupportedLanguage);
    }
  }, []);

  const handleLanguageChange = (lng: SupportedLanguage) => {
    selectLanguage(lng);
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
    <header className="sticky top-0 z-50 h-20 bg-white border-b border-gray-200">
      <div className="flex items-center h-full px-6">
        <div className="flex-1 flex items-center">
          <img
            src="/Nasna Logo.png"
            alt="Nasna logo"
            className="h-16 w-auto cursor-pointer"
            onClick={handleClickAbout}
          />
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" onClick={handleLogout} className="text-[#12a89d]">
            <LogOut className="h-4 w-4 mr-1" />
            Logout
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Globe className="h-5 w-5 text-[#12a89d]" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleLanguageChange('en')}>English</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleLanguageChange('ar')}>Arabic</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleLanguageChange('fr')}>French</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

export default PrivateNavbar;
