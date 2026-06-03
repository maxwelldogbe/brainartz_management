import axios from 'axios';

import { CONFIG } from 'src/config-global';

// ----------------------------------------------------------------------

const axiosInstance = axios.create({ baseURL: CONFIG.serverUrl });

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject((error.response && error.response.data) || 'Something went wrong!')
);

export default axiosInstance;

// ----------------------------------------------------------------------

export const fetcher = async (args) => {
  try {
    const [url, config] = Array.isArray(args) ? args : [args];

    const res = await axiosInstance.get(url, { ...config });

    return res.data;
  } catch (error) {
    console.error('Failed to fetch:', error);
    throw error;
  }
};

// ----------------------------------------------------------------------

export const endpoints = {
  chat: '/api/chat',
  kanban: '/api/kanban',
  calendar: '/api/calendar',
  auth: {
    me: '/auth/users/me/',
    signIn: '/auth/jwt/create/',
    refresh: '/auth/jwt/refresh/',
    signUp: '/auth/users/',
    profile: '/api/authentication/profile/',
    changePassword: '/api/authentication/change-password/',
    inviteRegister: '/api/authentication/register/',
    inviteEmployee: '/api/authentication/invite/',
    createEmployee: '/api/authentication/create-employee/',
  },
  services: {
    works: '/api/services/works/',
    worksUnpaid: '/api/services/works/unpaid_works/',
    worksCredits: '/api/services/works/credit_works/',
    worksMarkCompleted: (id) => `/api/services/works/${id}/mark_completed/`,
    worksReopen: (id) => `/api/services/works/${id}/reopen_work/`,
    workClearCredit: (id) => `/api/services/works/${id}/clear_credit/`,
    worksMaterials: (id) => `/api/services/works/${id}/materials/`,
    worksRecordJobMaterial: (id) => `/api/services/works/${id}/record_material_usage/`,
    payments: '/api/services/payments/',
    categories: '/api/services/job-categories/',
    category: (id) => `/api/services/job-categories/${id}/`,
    categoryToggleActive: (id) => `/api/services/job-categories/${id}/toggle_active/`,
    categoriesSelect: '/api/services/job-categories/select_options/',
    adminDashboard: '/api/services/admin-dashboard/',
    dailySummary: '/api/services/summary/daily/',
    workStatistics: '/api/services/statistics/works/',
    salesReportSummary: '/api/services/summary/sales-reports/',
    salesReports: '/api/services/sales-reports/',
    salesReport: (id) => `/api/services/sales-reports/${id}/`,
    salesReportSubmit: (id) => `/api/services/sales-reports/${id}/submit/`,
    salesReportApprove: (id) => `/api/services/sales-reports/${id}/approve/`,
    salesReportGenerateFromWorks: (id) => `/api/services/sales-reports/${id}/generate_from_works/`,
    salesReportItems: '/api/services/sales-report-items/',
    salesReportNotes: '/api/services/sales-report-notes/',
    dailyExpenses: '/api/services/daily-expenses/',
    materials: '/api/services/materials/',
    material: (id) => `/api/services/materials/${id}/`,
    materialAdjustStock: (id) => `/api/services/materials/${id}/adjust_stock/`,
    materialStatistics: '/api/services/materials/statistics/',
    pendingStockAdjustments: '/api/services/pending-stock-adjustments/',
    pendingStockApprove: (id) => `/api/services/pending-stock-adjustments/${id}/approve/`,
    pendingStockReject: (id) => `/api/services/pending-stock-adjustments/${id}/reject/`,
    procurements: '/api/services/procurements/',
    procurementMarkDelivered: (id) => `/api/services/procurements/${id}/mark_delivered/`,
    jobMaterials: '/api/services/job-materials/',
    stockMovements: '/api/services/stock-movements/',
    materialUsage: '/api/services/material-usage/',
    materialUsageRecord: '/api/services/material-usage/record_usage/',
    customerContacts: '/api/services/customer-contacts/',
    marketingMessages: '/api/services/marketing-messages/',
    marketingMessageToggle: (id) => `/api/services/marketing-messages/${id}/toggle_active/`,
    notifications: '/api/services/notifications/',
    notificationsUnreadCount: '/api/services/notifications/unread_count/',
    notificationsMarkAllRead: '/api/services/notifications/mark_all_read/',
    notificationMarkRead: (id) => `/api/services/notifications/${id}/mark_read/`,
    notification: (id) => `/api/services/notifications/${id}/`,
    workers: '/api/services/workers/',
    worker: (id) => `/api/services/workers/${id}/`,
    workerRoleOptions: '/api/services/workers/role_options/',
  },
  mail: {
    list: '/api/mail/list',
    details: '/api/mail/details',
    labels: '/api/mail/labels',
  },
  post: {
    list: '/api/post/list',
    details: '/api/post/details',
    latest: '/api/post/latest',
    search: '/api/post/search',
  },
  product: {
    list: '/api/product/list',
    details: '/api/product/details',
    search: '/api/product/search',
  },
};
