import { useLocation } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/Components/ui/breadcrumb';

const ROUTE_LABELS: Record<string, string> = {
  '/manage': 'Home',
  '/manage/dispatch': 'Dispatch Center',
  '/manage/centers': 'Centers',
  '/manage/housing': 'Housing Review',
  '/manage/impact': 'Impact Dashboard',
  '/manage/operations-map': 'Operations Map',
  '/admin/map': 'Operations Map',
  '/manage/submissions': 'Submissions',
  '/manage/ngo': 'NGO / Initiative',
  '/manage/agents': 'Agents',
  '/manage/feedback': 'Feedback',
  '/manage/emergency': 'Emergency',
  '/manage/offers': 'Aid Offers',
};

export default function AdminBreadcrumb() {
  const location = useLocation();
  const label = ROUTE_LABELS[location.pathname] ?? 'Dashboard';
  const isHome = location.pathname === '/manage';

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/manage">Dashboard</BreadcrumbLink>
        </BreadcrumbItem>
        {!isHome && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{label}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
