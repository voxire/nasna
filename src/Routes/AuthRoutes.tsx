import { lazy } from 'react';
import Public from '../Layout/Public';
import GuestRoute from '../Components/GuestRoute';
import type { RouteConfig } from '../types';

const Login = lazy(() => import('../Screens/Auth/Login'));
const Register = lazy(() => import('../Screens/Auth/Register'));
const AgentRegister = lazy(() => import('../Screens/Auth/AgentRegister'));
const GoogleOnboarding = lazy(() => import('../Screens/Auth/GoogleOnboarding'));

const AuthRoutes: RouteConfig[] = [
  {
    path: '/auth/login',
    element: (
      <Public>
        <GuestRoute>
          <Login />
        </GuestRoute>
      </Public>
    ),
  },
  {
    path: '/auth/register',
    element: (
      <Public>
        <GuestRoute>
          <Register />
        </GuestRoute>
      </Public>
    ),
  },
  {
    path: '/auth/agent',
    element: (
      <Public>
        <GuestRoute>
          <AgentRegister />
        </GuestRoute>
      </Public>
    ),
  },
  {
    path: '/auth/onboarding',
    element: (
      <Public>
        <GoogleOnboarding />
      </Public>
    ),
  },
];

export default AuthRoutes;
