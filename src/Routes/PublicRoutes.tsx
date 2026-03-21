import { lazy } from 'react';
import Public from '../Layout/Public';
import LazyBoundary from '../Components/LazyBoundary';
import type { RouteConfig } from '../types';

function LandingSkeleton() {
  return (
    <div>
      <div className="min-h-[90vh] flex flex-col items-center justify-center bg-gray-900 gap-7 px-6">
        <div className="h-20 md:h-28 w-36 bg-gray-700 animate-pulse rounded-lg" />
        <div className="space-y-3 w-full max-w-lg">
          <div className="h-10 bg-gray-700 animate-pulse rounded-lg w-full" />
          <div className="h-10 bg-gray-700 animate-pulse rounded-lg w-4/5 mx-auto" />
        </div>
        <div className="space-y-2 w-full max-w-sm">
          <div className="h-4 bg-gray-700 animate-pulse rounded w-full" />
          <div className="h-4 bg-gray-700 animate-pulse rounded w-3/4 mx-auto" />
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="h-12 w-40 bg-gray-700 animate-pulse rounded-full" />
          <div className="h-12 w-40 bg-gray-700 animate-pulse rounded-full" />
        </div>
      </div>
      <div className="bg-[#0d8c83] py-12 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="h-8 w-16 bg-teal-600 animate-pulse rounded" />
              <div className="h-3 w-20 bg-teal-600 animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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
const Hotlines = lazy(() => import('../Screens/Public/Hotlines'));

const PublicRoutes: RouteConfig[] = [
  {
    path: '/',
    element: (
      <Public>
        <LazyBoundary fallback={<LandingSkeleton />}>
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
  {
    path: '/hotlines',
    element: (
      <Public>
        <LazyBoundary>
          <Hotlines />
        </LazyBoundary>
      </Public>
    ),
  },
];

export default PublicRoutes;
