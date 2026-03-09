import { lazy } from 'react';
import PrivateRoute from '../Components/PrivateRoute';
import Private from '../Layout/Private';
import LazyBoundary from '../Components/LazyBoundary';
import type { RouteConfig } from '../types';

const Submissions = lazy(() => import('../Screens/Private/Submissions'));
const MyCases = lazy(() => import('../Screens/Private/MyCases'));
const CaseDetail = lazy(() => import('../Screens/Private/CaseDetail'));
const ProfileCoverage = lazy(() => import('../Screens/Private/ProfileCoverage'));
const CreateSubmission = lazy(() => import('../Screens/Private/CreateSubmission'));
const AgentSubmissions = lazy(() => import('../Screens/Private/AgentSubmissions'));
const AgentSubmissionDetail = lazy(() => import('../Screens/Private/AgentSubmissionDetail'));

const NGORoutes: RouteConfig[] = [
  {
    path: '/ngo/submissions',
    element: (
      <PrivateRoute allowedRoles={['member']} requireValidated>
        <Private>
          <LazyBoundary>
            <Submissions />
          </LazyBoundary>
        </Private>
      </PrivateRoute>
    ),
  },
  {
    path: '/ngo/my-cases',
    element: (
      <PrivateRoute allowedRoles={['member']} requireValidated>
        <Private>
          <LazyBoundary>
            <MyCases />
          </LazyBoundary>
        </Private>
      </PrivateRoute>
    ),
  },
  {
    path: '/ngo/cases/:caseId',
    element: (
      <PrivateRoute allowedRoles={['member']} requireValidated>
        <Private>
          <LazyBoundary>
            <CaseDetail />
          </LazyBoundary>
        </Private>
      </PrivateRoute>
    ),
  },
  {
    path: '/ngo/profile-coverage',
    element: (
      <PrivateRoute allowedRoles={['member']} requireValidated>
        <Private>
          <LazyBoundary>
            <ProfileCoverage />
          </LazyBoundary>
        </Private>
      </PrivateRoute>
    ),
  },
  {
    path: '/agent/create',
    element: (
      <PrivateRoute allowedRoles={['agent']} requireValidated>
        <Private>
          <LazyBoundary>
            <CreateSubmission />
          </LazyBoundary>
        </Private>
      </PrivateRoute>
    ),
  },
  {
    path: '/agent/submissions',
    element: (
      <PrivateRoute allowedRoles={['agent']} requireValidated>
        <Private>
          <LazyBoundary>
            <AgentSubmissions />
          </LazyBoundary>
        </Private>
      </PrivateRoute>
    ),
  },
  {
    path: '/agent/submissions/:id',
    element: (
      <PrivateRoute allowedRoles={['agent']} requireValidated>
        <Private>
          <LazyBoundary>
            <AgentSubmissionDetail />
          </LazyBoundary>
        </Private>
      </PrivateRoute>
    ),
  },
];

export default NGORoutes;
