import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import { CONFIG } from '../../config-global';
import { DashboardLayout } from '../../layouts/dashboard';

import { LoadingScreen } from '../../components/loading-screen';

import { AuthGuard } from '../../auth/guard';
import { RoleBasedGuard } from '../../auth/guard/role-based-guard';
import { useAuthContext } from '../../auth/hooks';
import { canAccessFeature, isAdmin, WORKER_FEATURE } from '../../utils/roles';

// ----------------------------------------------------------------------

const OverviewPage = lazy(() => import('../../pages/dashboard/overview'));
const WorksPage = lazy(() => import('../../pages/dashboard/works'));
const WorksArchivePage = lazy(() => import('../../pages/dashboard/works-archive'));
const CreditWorksPage = lazy(() => import('../../pages/dashboard/credit-works'));
const PaymentsPage = lazy(() => import('../../pages/dashboard/payments'));
const ProfilePage = lazy(() => import('../../pages/dashboard/profile'));
const AdminInsightsPage = lazy(() => import('../../pages/dashboard/admin-insights'));
const SalesReportsPage = lazy(() => import('../../pages/dashboard/sales-reports'));
const JobCategoriesPage = lazy(() => import('../../pages/dashboard/job-categories'));
const WorkersPage = lazy(() => import('../../pages/dashboard/workers'));
const MaterialsPage = lazy(() => import('../../pages/dashboard/materials'));
const ProcurementPage = lazy(() => import('../../pages/dashboard/procurement'));
const JobMaterialsPage = lazy(() => import('../../pages/dashboard/job-materials'));
const MaterialUsagePage = lazy(() => import('../../pages/dashboard/material-usage'));
const StockMovementsPage = lazy(() => import('../../pages/dashboard/stock-movements'));
const PendingStockPage = lazy(() => import('../../pages/dashboard/pending-stock'));
const CustomerContactsPage = lazy(() => import('../../pages/dashboard/customer-contacts'));
const MarketingMessagesPage = lazy(() => import('../../pages/dashboard/marketing-messages'));

// ----------------------------------------------------------------------

function AdminGuard({ children }) {
  const { user } = useAuthContext();
  return (
    <RoleBasedGuard hasContent acceptRoles={['admin']} currentRole={user?.role}>
      {children}
    </RoleBasedGuard>
  );
}

function FeatureGuard({ feature, children }) {
  const { user } = useAuthContext();
  const allowed = isAdmin(user?.role) || canAccessFeature(user, feature);
  if (allowed) {
    return children;
  }
  return <RoleBasedGuard hasContent acceptRoles={[]} currentRole={user?.role} />;
}

function LayoutContent() {
  return (
    <DashboardLayout>
      <Suspense fallback={<LoadingScreen />}>
        <Outlet />
      </Suspense>
    </DashboardLayout>
  );
}

export const dashboardRoutes = [
  {
    path: 'dashboard',
    element: CONFIG.auth.skip ? <LayoutContent /> : <AuthGuard><LayoutContent /></AuthGuard>,
    children: [
      { element: <OverviewPage />, index: true },
      { path: 'profile', element: <ProfilePage /> },
      {
        path: 'works',
        element: <FeatureGuard feature={WORKER_FEATURE.WORKS}><WorksPage /></FeatureGuard>,
      },
      {
        path: 'works-archive',
        element: <FeatureGuard feature={WORKER_FEATURE.WORKS}><WorksArchivePage /></FeatureGuard>,
      },
      {
        path: 'credit-works',
        element: <FeatureGuard feature={WORKER_FEATURE.WORKS}><CreditWorksPage /></FeatureGuard>,
      },
      {
        path: 'payments',
        element: <FeatureGuard feature={WORKER_FEATURE.PAYMENTS}><PaymentsPage /></FeatureGuard>,
      },
      {
        path: 'sales-reports',
        element: <FeatureGuard feature={WORKER_FEATURE.SALES_REPORTS}><SalesReportsPage /></FeatureGuard>,
      },
      {
        path: 'materials',
        element: <FeatureGuard feature={WORKER_FEATURE.INVENTORY}><MaterialsPage /></FeatureGuard>,
      },
      {
        path: 'procurement',
        element: <FeatureGuard feature={WORKER_FEATURE.INVENTORY}><ProcurementPage /></FeatureGuard>,
      },
      {
        path: 'job-materials',
        element: <FeatureGuard feature={WORKER_FEATURE.INVENTORY}><JobMaterialsPage /></FeatureGuard>,
      },
      {
        path: 'material-usage',
        element: <FeatureGuard feature={WORKER_FEATURE.INVENTORY}><MaterialUsagePage /></FeatureGuard>,
      },
      {
        path: 'stock-movements',
        element: <FeatureGuard feature={WORKER_FEATURE.INVENTORY}><StockMovementsPage /></FeatureGuard>,
      },
      {
        path: 'pending-stock',
        element: <FeatureGuard feature={WORKER_FEATURE.INVENTORY}><PendingStockPage /></FeatureGuard>,
      },
      {
        path: 'customer-contacts',
        element: <FeatureGuard feature={WORKER_FEATURE.CUSTOMERS}><CustomerContactsPage /></FeatureGuard>,
      },
      { path: 'admin-insights', element: <AdminGuard><AdminInsightsPage /></AdminGuard> },
      { path: 'job-categories', element: <AdminGuard><JobCategoriesPage /></AdminGuard> },
      { path: 'workers', element: <AdminGuard><WorkersPage /></AdminGuard> },
      { path: 'marketing-messages', element: <AdminGuard><MarketingMessagesPage /></AdminGuard> },
    ],
  },
];
