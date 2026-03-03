import { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { selectLanguage } from '../services/i18next';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../redux/hooks';
import { logout } from '../redux/reducers/userSlice';
import type { SupportedLanguage } from '../types';
import { getCookie } from '../utils/cookies';
import { Button } from '@/Components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { Globe, LayoutDashboard, LogOut } from 'lucide-react';

interface HeaderProps {
  dashboard?: boolean;
}

function Header({ dashboard = false }: HeaderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
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
    const savedLanguage = getCookie('language');
    if (savedLanguage) {
      selectLanguage(savedLanguage as SupportedLanguage);
    }
  }, []);

  const handleLanguageChange = (lng: SupportedLanguage) => {
    selectLanguage(lng);
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
            onClick={() => navigate('/')}
          />
        </div>

        <div className="flex items-center gap-1">
          {user && (
            <>
              {!dashboard && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (role === 'admin') navigate('/manage');
                    else navigate('/ngo/submissions');
                  }}
                >
                  <LayoutDashboard className="h-5 w-5 text-[#12a89d]" />
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-5 w-5 text-[#12a89d]" />
              </Button>
            </>
          )}

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

export default Header;
