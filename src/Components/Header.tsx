import { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { selectLanguage } from '../services/i18next';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAppDispatch } from '../redux/hooks';
import { logout } from '../redux/reducers/userSlice';
import type { SupportedLanguage } from '../types';
import { getCookie, deleteCookie } from '../utils/cookies';
import { Button } from '@/Components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { Globe, LayoutDashboard, LogOut, Menu } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const NAV_LINKS = [
  { to: '/about', labelKey: 'header.about' },
  { to: '/offer-help', labelKey: 'header.offerHelp' },
  { to: '/resources', labelKey: 'header.resources' },
  { to: '/feedback', labelKey: 'header.feedback' },
];

interface HeaderProps {
  dashboard?: boolean;
}

function Header({ dashboard = false }: HeaderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

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

  const handleLanguageChange = (lng: SupportedLanguage) => selectLanguage(lng);

  const handleLogout = async () => {
    try {
      deleteCookie('nasna_session');
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
        {/* Logo */}
        <div className="flex-1 flex items-center">
          <img
            src="/Nasna Logo.png"
            alt="Nasna logo"
            className="h-16 w-auto cursor-pointer"
            onClick={() => navigate('/')}
          />
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-1">
          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 mr-2">
            {NAV_LINKS.map(({ to, labelKey }) => (
              <Link
                key={to}
                to={to}
                className={`text-sm font-medium transition-colors no-underline ${
                  location.pathname === to
                    ? 'text-[#12a89d]'
                    : 'text-gray-600 hover:text-[#12a89d]'
                }`}
              >
                {t(labelKey)}
              </Link>
            ))}
          </nav>
          {user && (
            <>
              {!dashboard && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(role === 'admin' ? '/manage' : '/ngo/submissions')}
                >
                  <LayoutDashboard className="h-5 w-5 text-[#12a89d]" />
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-5 w-5 text-[#12a89d]" />
              </Button>
            </>
          )}

          {/* Language picker */}
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

          {/* Mobile hamburger */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5 text-[#12a89d]" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {NAV_LINKS.map(({ to, labelKey }) => (
                  <DropdownMenuItem key={to} onClick={() => navigate(to)}>
                    <span
                      className={
                        location.pathname === to ? 'text-[#12a89d] font-medium' : ''
                      }
                    >
                      {t(labelKey)}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
