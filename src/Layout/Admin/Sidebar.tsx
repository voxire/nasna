import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Home,
  List,
  Bell,
  UserPlus,
  ChevronsUpDown,
  LogOut,
  MessageSquare,
  HandHeart,
  Radar,
  ShieldPlus,
  Building2,
  House,
  ChartColumn,
  Map,
} from 'lucide-react';
import type { User } from 'firebase/auth';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/Components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/Components/ui/avatar';
import { useAuthStore } from '@/stores/authStore';

const NAV_ITEMS = [
  { path: '/manage', label: 'Home', icon: Home },
  { path: '/manage/dispatch', label: 'Dispatch Center', icon: Radar },
  { path: '/manage/centers', label: 'Centers', icon: Building2 },
  { path: '/manage/housing', label: 'Housing Review', icon: House },
  { path: '/manage/impact', label: 'Impact Dashboard', icon: ChartColumn },
  { path: '/admin/map', label: 'Operations Map', icon: Map },
  { path: '/manage/submissions', label: 'Submissions', icon: List },
  { path: '/manage/ngo', label: 'NGO / Initiative', icon: Bell },
  { path: '/manage/agents', label: 'Agents', icon: UserPlus },
  { path: '/manage/feedback', label: 'Feedback', icon: MessageSquare },
  { path: '/manage/emergency', label: 'Emergency', icon: ShieldPlus },
  { path: '/manage/offers', label: 'Aid Offers', icon: HandHeart },
];

interface AppSidebarProps {
  user: User;
}

function getInitials(email: string) {
  return email.slice(0, 2).toUpperCase();
}

export default function AppSidebar({ user }: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('You have been logged out.');
    } catch {
      toast.error('Failed to log out. Please try again.');
    }
  };

  return (
    <Sidebar collapsible="none" className="w-64 shrink-0 h-full">
      {/* Header — logo + app name */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="cursor-pointer" onClick={() => navigate('/')}>
              <div className="flex aspect-square h-8 w-8 items-center justify-center rounded-lg bg-[#12a89d] text-white shrink-0 font-bold text-base">
                N
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-semibold text-sm">Nasna</span>
                <span className="text-xs text-muted-foreground">Admin Panel</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
                <SidebarMenuItem key={path}>
                  <SidebarMenuButton
                    tooltip={label}
                    isActive={location.pathname === path}
                    onClick={() => navigate(path)}
                    className="cursor-pointer"
                  >
                    <Icon />
                    <span>{label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer — user avatar + email + logout */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-[#12a89d] text-white text-xs">
                      {getInitials(user.email ?? 'AD')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col leading-tight min-w-0">
                    <span className="text-sm font-medium truncate">
                      {user.displayName ?? 'Admin'}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56">
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-red-600 focus:text-red-600"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
