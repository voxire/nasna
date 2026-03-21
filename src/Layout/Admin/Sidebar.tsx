import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  ClipboardList,
  Users,
  Settings,
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

interface NavItem {
  path: string;
  label: string;
  icon: typeof Home;
}

interface AppSidebarProps {
  user: User;
}

function getInitials(email: string) {
  return email.slice(0, 2).toUpperCase();
}

export default function AppSidebar({ user }: AppSidebarProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const role = useAuthStore((state) => state.role);

  const isSuperAdmin = role === 'super_admin';
  const basePath = isSuperAdmin ? '/super' : '/manage';

  const navItems = useMemo<NavItem[]>(() => {
    const shared: NavItem[] = [
      { path: `${basePath}/manage`, label: t('admin.nav.home'), icon: Home },
      { path: `${basePath}/dispatch`, label: t('admin.nav.dispatch'), icon: Radar },
      { path: `${basePath}/centers`, label: t('admin.nav.centers'), icon: Building2 },
      { path: `${basePath}/housing`, label: t('admin.nav.housing'), icon: House },
      { path: `${basePath}/impact`, label: t('admin.nav.impact'), icon: ChartColumn },
      { path: `${basePath}/map`, label: t('admin.nav.operationsMap'), icon: Map },
      { path: `${basePath}/submissions`, label: t('admin.nav.submissions'), icon: List },
      { path: `${basePath}/ngo`, label: t('admin.nav.ngos'), icon: Bell },
      { path: `${basePath}/agents`, label: t('admin.nav.agents'), icon: UserPlus },
      { path: `${basePath}/feedback`, label: t('admin.nav.feedback'), icon: MessageSquare },
      { path: `${basePath}/emergency`, label: t('admin.nav.emergency'), icon: ShieldPlus },
      { path: `${basePath}/offers`, label: t('admin.nav.offers'), icon: HandHeart },
      { path: `${basePath}/audit`, label: t('admin.nav.audit'), icon: ClipboardList },
    ];

    if (!isSuperAdmin) {
      return shared;
    }

    return [
      { path: '/super/manage', label: t('admin.nav.home'), icon: Home },
      { path: '/super/users', label: t('admin.nav.userManagement'), icon: Users },
      { path: '/super/impact', label: t('admin.nav.impact'), icon: ChartColumn },
      { path: '/super/settings', label: t('admin.nav.settings'), icon: Settings },
      ...shared.filter((item) => item.path !== '/super/manage' && item.path !== '/super/impact'),
    ];
  }, [basePath, isSuperAdmin, t]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success(t('admin.nav.loggedOut'));
    } catch {
      toast.error(t('admin.nav.logoutError'));
    }
  };

  const panelLabel = isSuperAdmin ? t('admin.nav.superAdminPanel') : t('admin.nav.adminPanel');
  const displayName =
    user.displayName ??
    (isSuperAdmin ? t('admin.nav.superAdminFallback') : t('admin.nav.adminFallback'));

  return (
    <Sidebar collapsible="none" className="h-full w-64 shrink-0">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="cursor-pointer" onClick={() => navigate('/')}>
              <div className="flex aspect-square h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#12a89d] text-base font-bold text-white">
                N
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-semibold">Nasna</span>
                <span className="text-xs text-muted-foreground">{panelLabel}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t('admin.nav.platform')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(({ path, label, icon: Icon }) => (
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

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="cursor-pointer data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-[#12a89d] text-xs text-white">
                      {getInitials(user.email ?? 'AD')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex flex-col leading-tight">
                    <span className="truncate text-sm font-medium">{displayName}</span>
                    <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56">
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-red-600 focus:text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('admin.nav.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
