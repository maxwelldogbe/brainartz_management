import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/config-global';

import { SvgColor } from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name) => <SvgColor src={`${CONFIG.assetsDir}/assets/icons/navbar/${name}.svg`} />;

const ICONS = {
  user: icon('ic-user'),
  order: icon('ic-order'),
  invoice: icon('ic-invoice'),
  analytics: icon('ic-analytics'),
  dashboard: icon('ic-dashboard'),
  banking: icon('ic-banking'),
  product: icon('ic-product'),
  ecommerce: icon('ic-ecommerce'),
  mail: icon('ic-mail'),
  tour: icon('ic-tour'),
};

// ----------------------------------------------------------------------

const navData = [
  {
    subheader: 'General',
    items: [
      { title: 'Overview', path: paths.dashboard.root, icon: ICONS.dashboard },
      { title: 'Profile', path: paths.dashboard.profile, icon: ICONS.user },
      { title: 'Works', path: paths.dashboard.works, icon: ICONS.order },
      { title: 'Works archive', path: paths.dashboard.worksArchive, icon: ICONS.analytics },
      { title: 'Credit works', path: paths.dashboard.creditWorks, icon: ICONS.banking },
      { title: 'Payments', path: paths.dashboard.payments, icon: ICONS.invoice },
    ],
  },
  {
    subheader: 'Sales & reporting',
    items: [
      { title: 'Sales reports', path: paths.dashboard.salesReports, icon: ICONS.analytics },
    ],
  },
  {
    subheader: 'Inventory',
    items: [
      { title: 'Materials', path: paths.dashboard.materials, icon: ICONS.product },
      { title: 'Procurement', path: paths.dashboard.procurement, icon: ICONS.ecommerce },
      { title: 'Job materials', path: paths.dashboard.jobMaterials, icon: ICONS.order },
      { title: 'Material pickup', path: paths.dashboard.materialUsage, icon: ICONS.banking },
      { title: 'Stock movements', path: paths.dashboard.stockMovements, icon: ICONS.analytics },
      { title: 'Stock adjustment requests', path: paths.dashboard.pendingStock, icon: ICONS.invoice },
    ],
  },
  {
    subheader: 'Customers',
    items: [{ title: 'Contacts', path: paths.dashboard.customerContacts, icon: ICONS.mail }],
  },
  {
    subheader: 'Administration',
    items: [
      { title: 'Admin insights', path: paths.dashboard.adminInsights, icon: ICONS.analytics },
      { title: 'Job categories', path: paths.dashboard.jobCategories, icon: ICONS.tour },
      { title: 'Workers', path: paths.dashboard.workers, icon: ICONS.user },
      { title: 'Marketing templates', path: paths.dashboard.marketingMessages, icon: ICONS.mail },
    ],
  },
];

export { navData };
export default navData;
