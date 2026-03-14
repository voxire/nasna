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
];

export default AdminRoutes;
