import { lazy } from 'react';
import Public from '../Layout/Public';
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

const PublicRoutes: RouteConfig[] = [
  {
    path: '/',
    element: (
      <Public>
        <Landing />
      </Public>
    ),
  },
  {
    path: '/submit',
    element: (
      <Public>
        <Home />
      </Public>
    ),
  },
  {
    path: '/about',
    element: (
      <Public>
        <About />
      </Public>
    ),
  },
  {
    path: '/confirmation',
    element: (
      <Public>
        <Confirmation />
      </Public>
    ),
  },
  {
    path: '/donate',
    element: (
      <Public>
        <Donate />
      </Public>
    ),
  },
  {
    path: '/impact',
    element: (
      <Public>
        <Impact />
      </Public>
    ),
  },
  {
    path: '/offer-housing',
    element: (
      <Public>
        <OfferHousing />
      </Public>
    ),
  },
  {
    path: '/housing',
    element: (
      <Public>
        <Housing />
      </Public>
    ),
  },
  {
    path: '/terms',
    element: (
      <Public>
        <Terms />
      </Public>
    ),
  },
  {
    path: '/offer-help',
    element: (
      <Public>
        <OfferHelp />
      </Public>
    ),
  },
  {
    path: '/resources',
    element: (
      <Public>
        <Resources />
      </Public>
    ),
  },
  {
    path: '/emergency',
    element: (
      <Public>
        <Emergency />
      </Public>
    ),
  },
  {
    path: '/feedback',
    element: (
      <Public>
        <Feedback />
      </Public>
    ),
  },
];

export default PublicRoutes;
