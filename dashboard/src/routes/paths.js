// ----------------------------------------------------------------------

const ROOTS = {
  AUTH: '/auth',
  PORTAL: '/portal',
  DASHBOARD: '/dashboard',
};

// ----------------------------------------------------------------------

export const paths = {
  faqs: '/faqs',
  minimalStore: 'https://mui.com/store/items/minimal-dashboard/',
  // AUTH
  auth: {
    amplify: {
      signIn: `${ROOTS.AUTH}/amplify/sign-in`,
      verify: `${ROOTS.AUTH}/amplify/verify`,
      signUp: `${ROOTS.AUTH}/amplify/sign-up`,
      updatePassword: `${ROOTS.AUTH}/amplify/update-password`,
      resetPassword: `${ROOTS.AUTH}/amplify/reset-password`,
    },
    jwt: {
      signIn: `${ROOTS.AUTH}/jwt/sign-in`,
      signUp: `${ROOTS.AUTH}/jwt/sign-up`,
    },
    firebase: {
      signIn: `${ROOTS.AUTH}/firebase/sign-in`,
      verify: `${ROOTS.AUTH}/firebase/verify`,
      signUp: `${ROOTS.AUTH}/firebase/sign-up`,
      resetPassword: `${ROOTS.AUTH}/firebase/reset-password`,
    },
    auth0: {
      signIn: `${ROOTS.AUTH}/auth0/sign-in`,
    },
    supabase: {
      signIn: `${ROOTS.AUTH}/supabase/sign-in`,
      verify: `${ROOTS.AUTH}/supabase/verify`,
      signUp: `${ROOTS.AUTH}/supabase/sign-up`,
      updatePassword: `${ROOTS.AUTH}/supabase/update-password`,
      resetPassword: `${ROOTS.AUTH}/supabase/reset-password`,
    },
  },
  portal: {
    register: `${ROOTS.PORTAL}/register`,
  },
  // DASHBOARD
  dashboard: {
    root: ROOTS.DASHBOARD,
    profile: `${ROOTS.DASHBOARD}/profile`,
    works: `${ROOTS.DASHBOARD}/works`,
    worksArchive: `${ROOTS.DASHBOARD}/works-archive`,
    creditWorks: `${ROOTS.DASHBOARD}/credit-works`,
    payments: `${ROOTS.DASHBOARD}/payments`,
    adminInsights: `${ROOTS.DASHBOARD}/admin-insights`,
    salesReports: `${ROOTS.DASHBOARD}/sales-reports`,
    jobCategories: `${ROOTS.DASHBOARD}/job-categories`,
    workers: `${ROOTS.DASHBOARD}/workers`,
    materials: `${ROOTS.DASHBOARD}/materials`,
    procurement: `${ROOTS.DASHBOARD}/procurement`,
    jobMaterials: `${ROOTS.DASHBOARD}/job-materials`,
    materialUsage: `${ROOTS.DASHBOARD}/material-usage`,
    stockMovements: `${ROOTS.DASHBOARD}/stock-movements`,
    pendingStock: `${ROOTS.DASHBOARD}/pending-stock`,
    customerContacts: `${ROOTS.DASHBOARD}/customer-contacts`,
    marketingMessages: `${ROOTS.DASHBOARD}/marketing-messages`,
  },
};
