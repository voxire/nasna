import { lazy } from 'react';
import Admin from '../Layout/Admin/Admin';
import type { RouteConfig } from '../types';

const Dashboard = lazy(() => import('../Screens/Admin/Dashboard'));
const AdminSubmissions = lazy(() => import('../Screens/Admin/AdminSubmissions'));
const Members = lazy(() => import('../Screens/Admin/Members'));
const Agents = lazy(() => import('../Screens/Admin/Agents'));

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
];

export default AdminRoutes;
