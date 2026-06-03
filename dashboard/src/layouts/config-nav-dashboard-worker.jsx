import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/config-global';
import { WORKER_FEATURE } from 'src/utils/roles';

import { SvgColor } from 'src/components/svg-color';

const icon = (name) => <SvgColor src={`${CONFIG.assetsDir}/assets/icons/navbar/${name}.svg`} />;

const ICONS = {
  user: icon('ic-user'),
  order: icon('ic-order'),
  invoice: icon('ic-invoice'),
  dashboard: icon('ic-dashboard'),
  analytics: icon('ic-analytics'),
  product: icon('ic-product'),
  ecommerce: icon('ic-ecommerce'),
  banking: icon('ic-banking'),
  mail: icon('ic-mail'),
};

const workerNavData = [
  {
    subheader: 'Workspace',
    items: [
      { title: 'Overview', path: paths.dashboard.root, icon: ICONS.dashboard },
      { title: 'Works', path: paths.dashboard.works, icon: ICONS.order, permissions: [WORKER_FEATURE.WORKS] },
      { title: 'Credit works', path: paths.dashboard.creditWorks, icon: ICONS.banking, permissions: [WORKER_FEATURE.WORKS] },
      { title: 'Payments', path: paths.dashboard.payments, icon: ICONS.invoice, permissions: [WORKER_FEATURE.PAYMENTS] },
      { title: 'Profile', path: paths.dashboard.profile, icon: ICONS.user },
    ],
  },
  {
    subheader: 'Sales',
    items: [{ title: 'Sales reports', path: paths.dashboard.salesReports, icon: ICONS.analytics, permissions: [WORKER_FEATURE.SALES_REPORTS] }],
  },
  {
    subheader: 'Inventory',
    items: [
      { title: 'Materials', path: paths.dashboard.materials, icon: ICONS.product, permissions: [WORKER_FEATURE.INVENTORY] },
      { title: 'Procurement', path: paths.dashboard.procurement, icon: ICONS.ecommerce, permissions: [WORKER_FEATURE.INVENTORY] },
      { title: 'Job materials', path: paths.dashboard.jobMaterials, icon: ICONS.order, permissions: [WORKER_FEATURE.INVENTORY] },
      { title: 'Material pickup', path: paths.dashboard.materialUsage, icon: ICONS.banking, permissions: [WORKER_FEATURE.INVENTORY] },
      { title: 'Stock movements', path: paths.dashboard.stockMovements, icon: ICONS.analytics, permissions: [WORKER_FEATURE.INVENTORY] },
      { title: 'Stock adjustment requests', path: paths.dashboard.pendingStock, icon: ICONS.invoice, permissions: [WORKER_FEATURE.INVENTORY] },
    ],
  },
  {
    subheader: 'Customers',
    items: [{ title: 'Contacts', path: paths.dashboard.customerContacts, icon: ICONS.mail, permissions: [WORKER_FEATURE.CUSTOMERS] }],
  },
];

export { workerNavData };
export default workerNavData;
