import { useLocation, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { useAppDispatch } from '../../redux/hooks';
import { logout } from '../../redux/reducers/userSlice';
import { toast } from 'sonner';
import { Home, List, Bell, UserPlus, LogOut } from 'lucide-react';
import type { User } from 'firebase/auth';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Button } from '@/Components/ui/button';

const NAV_ITEMS = [
  { path: '/manage', label: 'Home', icon: Home },
  { path: '/manage/submissions', label: 'Submissions', icon: List },
  { path: '/manage/ngo', label: 'NGO/Initiative', icon: Bell },
  { path: '/manage/agents', label: 'Agents', icon: UserPlus },
];

interface AppSidebarProps {
  user: User;
}

export default function AppSidebar({ user }: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      dispatch(logout());
      toast.success('You have been logged out.');
    } catch {
      toast.error('Failed to log out. Please try again.');
    }
  };

  return (
    <Sidebar
      style={
        {
          '--sidebar': '#262626',
          '--sidebar-foreground': '#ffffff',
          '--sidebar-accent': '#3a3a3a',
          '--sidebar-accent-foreground': '#ffffff',
          '--sidebar-border': 'rgba(255,255,255,0.08)',
          '--sidebar-primary': '#12a89d',
          '--sidebar-primary-foreground': '#ffffff',
          '--sidebar-ring': '#12a89d',
        } as React.CSSProperties
      }
    >
      <SidebarHeader className="px-4 py-5">
        <img
          src="/Nasna Logo.png"
          alt="Nasna"
          className="h-12 w-auto cursor-pointer brightness-0 invert"
          onClick={() => navigate('/')}
        />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
                <SidebarMenuItem key={path}>
                  <SidebarMenuButton
                    isActive={location.pathname === path}
                    onClick={() => navigate(path)}
                    className="cursor-pointer"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-4 py-4 border-t border-white/10">
        <div className="flex flex-col gap-2">
          <p className="text-xs text-white/50 truncate">{user.email}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="justify-start gap-2 text-white/70 hover:text-white hover:bg-white/10 px-2"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
