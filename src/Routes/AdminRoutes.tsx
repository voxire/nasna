import { lazy } from 'react';
import Admin from '../Layout/Admin/Admin';
import LazyBoundary from '../Components/LazyBoundary';
import type { RouteConfig } from '../types';

const Dashboard = lazy(() => import('../Screens/Admin/Dashboard'));
const DispatchCenter = lazy(() => import('../Screens/Admin/DispatchCenter'));
const CenterManagement = lazy(() => import('../Screens/Admin/CenterManagement'));
const HousingReview = lazy(() => import('../Screens/Admin/HousingReview'));
const ImpactDashboard = lazy(() => import('../Screens/Admin/ImpactDashboard'));
const OperationsMap = lazy(() => import('../Screens/Admin/OperationsMap'));
const AdminSubmissions = lazy(() => import('../Screens/Admin/AdminSubmissions'));
const Members = lazy(() => import('../Screens/Admin/Members'));
const Agents = lazy(() => import('../Screens/Admin/Agents'));
const UserManagement = lazy(() => import('../Screens/Admin/UserManagement'));
const PlatformSettings = lazy(() => import('../Screens/Admin/PlatformSettings'));
const FeedbackManagement = lazy(() => import('../Screens/Admin/FeedbackManagement'));
const EmergencyContactsManagement = lazy(
  () => import('../Screens/Admin/EmergencyContactsManagement'),
);
const OffersManagement = lazy(() => import('../Screens/Admin/OffersManagement'));
const AuditLog = lazy(() => import('../Screens/Admin/AuditLog'));

const AdminRoutes: RouteConfig[] = [
  {
    path: '/manage',
    element: (
      <Admin>
        <LazyBoundary>
          <Dashboard />
        </LazyBoundary>
      </Admin>
    ),
  },
  {
    path: '/manage/dispatch',
    element: (
      <Admin>
        <LazyBoundary>
          <DispatchCenter />
        </LazyBoundary>
      </Admin>
    ),
  },
  {
    path: '/manage/centers',
    element: (
      <Admin>
        <LazyBoundary>
          <CenterManagement />
        </LazyBoundary>
      </Admin>
    ),
  },
  {
    path: '/manage/housing',
    element: (
      <Admin>
        <LazyBoundary>
          <HousingReview />
        </LazyBoundary>
      </Admin>
    ),
  },
  {
    path: '/manage/impact',
    element: (
      <Admin>
        <LazyBoundary>
          <ImpactDashboard />
        </LazyBoundary>
      </Admin>
    ),
  },
  {
    path: '/manage/operations-map',
    element: (
      <Admin fullBleed>
        <LazyBoundary>
          <OperationsMap />
        </LazyBoundary>
      </Admin>
    ),
  },
  {
    path: '/admin/map',
    element: (
      <Admin fullBleed>
        <LazyBoundary>
          <OperationsMap />
        </LazyBoundary>
      </Admin>
    ),
  },
  {
    path: '/manage/submissions',
    element: (
      <Admin>
        <LazyBoundary>
          <AdminSubmissions />
        </LazyBoundary>
      </Admin>
    ),
  },
  {
    path: '/manage/ngo',
    element: (
      <Admin>
        <LazyBoundary>
          <Members />
        </LazyBoundary>
      </Admin>
    ),
  },
  {
    path: '/manage/agents',
    element: (
      <Admin>
        <LazyBoundary>
          <Agents />
        </LazyBoundary>
      </Admin>
    ),
  },
  {
    path: '/manage/feedback',
    element: (
      <Admin>
        <LazyBoundary>
          <FeedbackManagement />
        </LazyBoundary>
      </Admin>
    ),
  },
  {
    path: '/manage/emergency',
    element: (
      <Admin>
        <LazyBoundary>
          <EmergencyContactsManagement />
        </LazyBoundary>
      </Admin>
    ),
  },
  {
    path: '/manage/offers',
    element: (
      <Admin>
        <LazyBoundary>
          <OffersManagement />
        </LazyBoundary>
      </Admin>
    ),
  },
  {
    path: '/manage/audit',
    element: (
      <Admin>
        <LazyBoundary>
          <AuditLog />
        </LazyBoundary>
      </Admin>
    ),
  },
  {
    path: '/super/manage',
    element: (
      <Admin allowedRoles={['super_admin']}>
        <LazyBoundary>
          <Dashboard />
        </LazyBoundary>
      </Admin>
    ),
  },
  {
    path: '/super/users',
    element: (
      <Admin allowedRoles={['super_admin']}>
        <LazyBoundary>
          <UserManagement />
        </LazyBoundary>
      </Admin>
    ),
  },
  {
    path: '/super/settings',
    element: (
      <Admin allowedRoles={['super_admin']}>
        <LazyBoundary>
          <PlatformSettings />
        </LazyBoundary>
      </Admin>
    ),
  },
  {
    path: '/super/impact',
    element: (
      <Admin allowedRoles={['super_admin']}>
        <LazyBoundary>
          <ImpactDashboard />
        </LazyBoundary>
      </Admin>
    ),
  },
  {
    path: '/super/dispatch',
    element: (
      <Admin allowedRoles={['super_admin']}>
        <LazyBoundary>
          <DispatchCenter />
        </LazyBoundary>
      </Admin>
    ),
  },
  {
    path: '/super/centers',
    element: (
      <Admin allowedRoles={['super_admin']}>
        <LazyBoundary>
          <CenterManagement />
        </LazyBoundary>
      </Admin>
    ),
  },
  {
    path: '/super/housing',
    element: (
      <Admin allowedRoles={['super_admin']}>
        <LazyBoundary>
          <HousingReview />
        </LazyBoundary>
      </Admin>
    ),
  },
  {
    path: '/super/map',
    element: (
      <Admin allowedRoles={['super_admin']} fullBleed>
        <LazyBoundary>
          <OperationsMap />
        </LazyBoundary>
      </Admin>
    ),
  },
  {
    path: '/super/submissions',
    element: (
      <Admin allowedRoles={['super_admin']}>
        <LazyBoundary>
          <AdminSubmissions />
        </LazyBoundary>
      </Admin>
    ),
  },
  {
    path: '/super/ngo',
    element: (
      <Admin allowedRoles={['super_admin']}>
        <LazyBoundary>
          <Members />
        </LazyBoundary>
      </Admin>
    ),
  },
  {
    path: '/super/agents',
    element: (
      <Admin allowedRoles={['super_admin']}>
        <LazyBoundary>
          <Agents />
        </LazyBoundary>
      </Admin>
    ),
  },
  {
    path: '/super/feedback',
    element: (
      <Admin allowedRoles={['super_admin']}>
        <LazyBoundary>
          <FeedbackManagement />
        </LazyBoundary>
      </Admin>
    ),
  },
  {
    path: '/super/emergency',
    element: (
      <Admin allowedRoles={['super_admin']}>
        <LazyBoundary>
          <EmergencyContactsManagement />
        </LazyBoundary>
      </Admin>
    ),
  },
  {
    path: '/super/offers',
    element: (
      <Admin allowedRoles={['super_admin']}>
        <LazyBoundary>
          <OffersManagement />
        </LazyBoundary>
      </Admin>
    ),
  },
  {
    path: '/super/audit',
    element: (
      <Admin allowedRoles={['super_admin']}>
        <LazyBoundary>
          <AuditLog />
        </LazyBoundary>
      </Admin>
    ),
  },
];

export default AdminRoutes;
