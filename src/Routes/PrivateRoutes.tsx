import { lazy } from 'react';
import PrivateRoute from '../Components/PrivateRoute';
import Private from '../Layout/Private';
import type { RouteConfig } from '../types';

const Submissions = lazy(() => import('../Screens/Private/Submissions'));
const MyCases = lazy(() => import('../Screens/Private/MyCases'));
const CaseDetail = lazy(() => import('../Screens/Private/CaseDetail'));
const ProfileCoverage = lazy(() => import('../Screens/Private/ProfileCoverage'));
const CreateSubmission = lazy(() => import('../Screens/Private/CreateSubmission'));
const AgentSubmissions = lazy(() => import('../Screens/Private/AgentSubmissions'));

const NGORoutes: RouteConfig[] = [
  {
    path: '/ngo/submissions',
    element: (
      <PrivateRoute>
        <Private>
          <Submissions />
        </Private>
      </PrivateRoute>
    ),
  },
  {
    path: '/ngo/my-cases',
    element: (
      <PrivateRoute>
        <Private>
          <MyCases />
        </Private>
      </PrivateRoute>
    ),
  },
  {
    path: '/ngo/cases/:caseId',
    element: (
      <PrivateRoute>
        <Private>
          <CaseDetail />
        </Private>
      </PrivateRoute>
    ),
  },
  {
    path: '/ngo/profile-coverage',
    element: (
      <PrivateRoute>
        <Private>
          <ProfileCoverage />
        </Private>
      </PrivateRoute>
    ),
  },
  {
    path: '/agent/create',
    element: (
      <PrivateRoute>
        <Private>
          <CreateSubmission />
        </Private>
      </PrivateRoute>
    ),
  },
  {
    path: '/agent/submissions',
    element: (
      <PrivateRoute>
        <Private>
          <AgentSubmissions />
        </Private>
      </PrivateRoute>
    ),
  },
];

export default NGORoutes;
