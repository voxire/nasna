import { lazy } from 'react';
import Public from '../Layout/Public';
import LazyBoundary from '../Components/LazyBoundary';
import type { RouteConfig } from '../types';

const Landing = lazy(() => import('../Screens/Public/Landing'));
const Home = lazy(() => import('../Screens/Public/Home'));
const About = lazy(() => import('../Screens/Public/About'));
const Confirmation = lazy(() => import('../Screens/Public/Confirmation'));
const Donate = lazy(() => import('../Screens/Public/Donate'));
const Impact = lazy(() => import('../Screens/Public/Impact'));
const OfferHousing = lazy(() => import('../Screens/Public/OfferHousing'));
const Housing = lazy(() => import('../Screens/Public/Housing'));
const Terms = lazy(() => import('../Screens/Public/Terms'));
const OfferHelp = lazy(() => import('../Screens/Public/OfferHelp'));
const Resources = lazy(() => import('../Screens/Public/Resources'));
const Feedback = lazy(() => import('../Screens/Public/Feedback'));
const Emergency = lazy(() => import('../Screens/Public/Emergency'));
const CentersMap = lazy(() => import('../Screens/Public/CentersMap'));

const PublicRoutes: RouteConfig[] = [
  {
    path: '/',
    element: (
      <Public>
        <LazyBoundary>
          <Landing />
        </LazyBoundary>
      </Public>
    ),
  },
  {
    path: '/submit',
    element: (
      <Public>
        <LazyBoundary>
          <Home />
        </LazyBoundary>
      </Public>
    ),
  },
  {
    path: '/about',
    element: (
      <Public>
        <LazyBoundary>
          <About />
        </LazyBoundary>
      </Public>
    ),
  },
  {
    path: '/confirmation',
    element: (
      <Public>
        <LazyBoundary>
          <Confirmation />
        </LazyBoundary>
      </Public>
    ),
  },
  {
    path: '/donate',
    element: (
      <Public>
        <LazyBoundary>
          <Donate />
        </LazyBoundary>
      </Public>
    ),
  },
  {
    path: '/impact',
    element: (
      <Public>
        <LazyBoundary>
          <Impact />
        </LazyBoundary>
      </Public>
    ),
  },
  {
    path: '/offer-housing',
    element: (
      <Public>
        <LazyBoundary>
          <OfferHousing />
        </LazyBoundary>
      </Public>
    ),
  },
  {
    path: '/housing',
    element: (
      <Public>
        <LazyBoundary>
          <Housing />
        </LazyBoundary>
      </Public>
    ),
  },
  {
    path: '/terms',
    element: (
      <Public>
        <LazyBoundary>
          <Terms />
        </LazyBoundary>
      </Public>
    ),
  },
  {
    path: '/offer-help',
    element: (
      <Public>
        <LazyBoundary>
          <OfferHelp />
        </LazyBoundary>
      </Public>
    ),
  },
  {
    path: '/resources',
    element: (
      <Public>
        <LazyBoundary>
          <Resources />
        </LazyBoundary>
      </Public>
    ),
  },
  {
    path: '/emergency',
    element: (
      <Public>
        <LazyBoundary>
          <Emergency />
        </LazyBoundary>
      </Public>
    ),
  },
  {
    path: '/feedback',
    element: (
      <Public>
        <LazyBoundary>
          <Feedback />
        </LazyBoundary>
      </Public>
    ),
  },
  {
    path: '/centers-map',
    element: (
      <Public>
        <LazyBoundary>
          <CentersMap />
        </LazyBoundary>
      </Public>
    ),
  },
];

export default PublicRoutes;
