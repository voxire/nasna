import { lazy } from 'react';
import Admin from '../Layout/Admin/Admin';
import type { RouteConfig } from '../types';

const Dashboard = lazy(() => import('../Screens/Admin/Dashboard'));
const DispatchCenter = lazy(() => import('../Screens/Admin/DispatchCenter'));
const CenterManagement = lazy(() => import('../Screens/Admin/CenterManagement'));
const HousingReview = lazy(() => import('../Screens/Admin/HousingReview'));
const ImpactDashboard = lazy(() => import('../Screens/Admin/ImpactDashboard'));
const AdminSubmissions = lazy(() => import('../Screens/Admin/AdminSubmissions'));
const Members = lazy(() => import('../Screens/Admin/Members'));
const Agents = lazy(() => import('../Screens/Admin/Agents'));
const FeedbackManagement = lazy(() => import('../Screens/Admin/FeedbackManagement'));
const EmergencyContactsManagement = lazy(
  () => import('../Screens/Admin/EmergencyContactsManagement'),
);
const OffersManagement = lazy(() => import('../Screens/Admin/OffersManagement'));

const AdminRoutes: RouteConfig[] = [
  {
    path: '/manage',
    element: (
      <Admin>
        <Dashboard />
      </Admin>
    ),
  },
  {
    path: '/manage/dispatch',
    element: (
      <Admin>
        <DispatchCenter />
      </Admin>
    ),
  },
  {
    path: '/manage/centers',
    element: (
      <Admin>
        <CenterManagement />
      </Admin>
    ),
  },
  {
    path: '/manage/housing',
    element: (
      <Admin>
        <HousingReview />
      </Admin>
    ),
  },
  {
    path: '/manage/impact',
    element: (
      <Admin>
        <ImpactDashboard />
      </Admin>
    ),
  },
  {
    path: '/manage/submissions',
    element: (
      <Admin>
        <AdminSubmissions />
      </Admin>
    ),
  },
  {
    path: '/manage/ngo',
    element: (
      <Admin>
        <Members />
      </Admin>
    ),
  },
  {
    path: '/manage/agents',
    element: (
      <Admin>
        <Agents />
      </Admin>
    ),
  },
  {
    path: '/manage/feedback',
    element: (
      <Admin>
        <FeedbackManagement />
      </Admin>
    ),
  },
  {
    path: '/manage/emergency',
    element: (
      <Admin>
        <EmergencyContactsManagement />
      </Admin>
    ),
  },
  {
    path: '/manage/offers',
    element: (
      <Admin>
        <OffersManagement />
      </Admin>
    ),
  },
];

export default AdminRoutes;
