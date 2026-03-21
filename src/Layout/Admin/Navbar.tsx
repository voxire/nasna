import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/Components/ui/breadcrumb';

export default function AdminBreadcrumb() {
  const location = useLocation();
  const { t } = useTranslation();

  const routeLabels = useMemo<Record<string, string>>(
    () => ({
      '/manage': t('admin.nav.home'),
      '/manage/dispatch': t('admin.nav.dispatch'),
      '/manage/centers': t('admin.nav.centers'),
      '/manage/housing': t('admin.nav.housing'),
      '/manage/impact': t('admin.nav.impact'),
      '/manage/operations-map': t('admin.nav.operationsMap'),
      '/admin/map': t('admin.nav.operationsMap'),
      '/manage/submissions': t('admin.nav.submissions'),
      '/manage/ngo': t('admin.nav.ngos'),
      '/manage/agents': t('admin.nav.agents'),
      '/manage/feedback': t('admin.nav.feedback'),
      '/manage/emergency': t('admin.nav.emergency'),
      '/manage/offers': t('admin.nav.offers'),
      '/manage/audit': t('admin.nav.audit'),
      '/super/manage': t('admin.nav.home'),
      '/super/users': t('admin.nav.userManagement'),
      '/super/impact': t('admin.nav.impact'),
      '/super/settings': t('admin.nav.settings'),
      '/super/dispatch': t('admin.nav.dispatch'),
      '/super/centers': t('admin.nav.centers'),
      '/super/housing': t('admin.nav.housing'),
      '/super/map': t('admin.nav.operationsMap'),
      '/super/submissions': t('admin.nav.submissions'),
      '/super/ngo': t('admin.nav.ngos'),
      '/super/agents': t('admin.nav.agents'),
      '/super/feedback': t('admin.nav.feedback'),
      '/super/emergency': t('admin.nav.emergency'),
      '/super/offers': t('admin.nav.offers'),
      '/super/audit': t('admin.nav.audit'),
    }),
    [t],
  );

  const isSuperAdminPath = location.pathname.startsWith('/super');
  const homePath = isSuperAdminPath ? '/super/manage' : '/manage';
  const homeLabel = isSuperAdminPath ? t('admin.nav.superAdminPanel') : t('admin.nav.adminPanel');
  const label = routeLabels[location.pathname] ?? t('admin.nav.dashboard');
  const isHome = location.pathname === homePath;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href={homePath}>{homeLabel}</BreadcrumbLink>
        </BreadcrumbItem>
        {!isHome && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{label}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
