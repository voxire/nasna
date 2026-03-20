import { useEffect } from 'react';
import { selectLanguage } from '../services/i18next';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import type { SupportedLanguage } from '../types';
import { getCookie } from '../utils/cookies';
import { Button } from '@/Components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { Globe, LayoutDashboard, LogOut, Menu } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { resolvePostLoginPath, useAuthStore } from '@/stores/authStore';
import { trackClick } from '@/services/analytics';

const NAV_LINKS = [
  { to: '/centers-map', labelKey: 'header.centersMap' },
  { to: '/housing', labelKey: 'header.housing' },
  { to: '/emergency', labelKey: 'header.emergency' },
  { to: '/hotlines', labelKey: 'header.hotlines' },
  { to: '/offer-help', labelKey: 'header.offerHelp' },
  { to: '/resources', labelKey: 'header.resources' },
  { to: '/feedback', labelKey: 'header.feedback' },
];

interface HeaderProps {
  dashboard?: boolean;
}

function Header({ dashboard = false }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.firebaseUser);
  const role = useAuthStore((state) => state.role);
  const profile = useAuthStore((state) => state.profile);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    const savedLanguage = getCookie('language');
    if (savedLanguage) {
      selectLanguage(savedLanguage as SupportedLanguage);
    }
  }, []);

  const handleLanguageChange = (lng: SupportedLanguage) => selectLanguage(lng);

  const handleLogout = async () => {
    try {
      await logout();
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
          <nav className="hidden md:flex items-center gap-6 mr-2">
            {NAV_LINKS.map(({ to, labelKey }) => (
              <Link
                key={to}
                to={to}
                onClick={() => trackClick('nav_' + to.replace('/', ''), to)}
                className={`text-sm font-medium transition-colors no-underline ${
                  location.pathname === to ? 'text-[#12a89d]' : 'text-gray-600 hover:text-[#12a89d]'
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
                  onClick={() =>
                    navigate(
                      resolvePostLoginPath(
                        role,
                        role === 'admin' || role === 'super_admin' || profile?.onboarded === true,
                      ),
                    )
                  }
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
              <DropdownMenuItem onClick={() => handleLanguageChange('en')}>
                English
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleLanguageChange('ar')}>Arabic</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleLanguageChange('fr')}>French</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5 text-[#12a89d]" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {NAV_LINKS.map(({ to, labelKey }) => (
                  <DropdownMenuItem
                    key={to}
                    onClick={() => {
                      trackClick('nav_mobile_' + to.replace('/', ''), to);
                      navigate(to);
                    }}
                  >
                    <span className={location.pathname === to ? 'text-[#12a89d] font-medium' : ''}>
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
