import { lazy } from 'react';
import Admin from '../Layout/Admin/Admin';
import type { RouteConfig } from '../types';

const Dashboard = lazy(() => import('../Screens/Admin/Dashboard'));
const DispatchCenter = lazy(() => import('../Screens/Admin/DispatchCenter'));
const AdminSubmissions = lazy(() => import('../Screens/Admin/AdminSubmissions'));
const Members = lazy(() => import('../Screens/Admin/Members'));
const Agents = lazy(() => import('../Screens/Admin/Agents'));
const FeedbackManagement = lazy(() => import('../Screens/Admin/FeedbackManagement'));
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
    path: '/manage/offers',
    element: (
      <Admin>
        <OffersManagement />
      </Admin>
    ),
  },
];

export default AdminRoutes;
