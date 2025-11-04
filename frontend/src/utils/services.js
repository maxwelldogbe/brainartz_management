import axios from "../utils/axios";

/* ------------------ Customers ------------------ */
export const fetchCustomers = () => axios.get("/api/services/customers/").then(res => res.data);
export const createCustomer = (data) => axios.post("/api/services/customers/", data).then(res => res.data);
export const updateCustomer = (id, data) => axios.put(`/api/services/customers/${id}/`, data).then(res => res.data);
export const deleteCustomer = (id) => axios.delete(`/api/services/customers/${id}/`).then(res => res.data);

/* ------------------ Works (Enhanced) ------------------ */
export const fetchWorks = (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      params.append(key, value);
    }
  });
  return axios.get(`/api/services/works/?${params}`).then(res => res.data);
};
export const fetchUnpaidWorks = () => axios.get('/api/services/works/unpaid_works/').then(res => res.data);
export const fetchWorksForSelect = (includeFullyPaid = false) => axios.get(`/api/services/works/select_options/?include_fully_paid=${includeFullyPaid}`).then(res => res.data);
export const createWork = (data) => axios.post("/api/services/works/", data).then(res => res.data);
export const updateWork = (id, data) => axios.put(`/api/services/works/${id}/`, data).then(res => res.data);
export const deleteWork = (id) => axios.delete(`/api/services/works/${id}/`).then(res => res.data);
export const markWorkCompleted = (id) => axios.post(`/api/services/works/${id}/mark_completed/`).then(res => res.data);
export const reopenWork = (id) => axios.post(`/api/services/works/${id}/reopen_work/`).then(res => res.data);
export const assignWorker = (id, workerId) => axios.post(`/api/services/works/${id}/assign_worker/`, { worker_id: workerId }).then(res => res.data);

/* ------------------ Job Categories ------------------ */
export const jobCategoriesAPI = {
  getAll: () => axios.get('/api/services/job-categories/').then(res => res.data),
  getSelectOptions: () => axios.get('/api/services/job-categories/select_options/').then(res => res.data),
  create: (data) => axios.post('/api/services/job-categories/', data).then(res => res.data),
  update: (id, data) => axios.put(`/api/services/job-categories/${id}/`, data).then(res => res.data),
  toggleActive: (id) => axios.post(`/api/services/job-categories/${id}/toggle_active/`).then(res => res.data),
  delete: (id) => axios.delete(`/api/services/job-categories/${id}/`).then(res => res.data)
};

/* ------------------ Work Files ------------------ */
export const workFilesAPI = {
  getByWork: (workId) => axios.get(`/api/services/work-files/?work_id=${workId}`).then(res => res.data),
  upload: (workId, file, description = '') => {
    const formData = new FormData();
    formData.append('work_id', workId);
    formData.append('file', file);
    if (description) formData.append('description', description);
    return axios.post('/api/services/work-files/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data);
  },
  bulkUpload: (workId, files) => {
    const formData = new FormData();
    formData.append('work_id', workId);
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });
    return axios.post('/api/services/work-files/bulk_upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data);
  },
  delete: (fileId) => axios.delete(`/api/services/work-files/${fileId}/`).then(res => res.data)
};

/* ------------------ Analytics & Statistics ------------------ */
export const analyticsAPI = {
  getWorkStats: () => axios.get('/api/services/statistics/works/').then(res => res.data),
  getDailySummary: () => axios.get('/api/services/summary/daily/').then(res => res.data),
  getCustomerStats: () => axios.get('/api/services/statistics/customers/').then(res => res.data)
};

/* ------------------ Payments ------------------ */
export const fetchPayments = () => axios.get("/api/services/payments/").then(res => res.data);
export const createPayment = (data) => axios.post("/api/services/payments/", data).then(res => res.data);
export const updatePayment = (id, data) => axios.put(`/api/services/payments/${id}/`, data).then(res => res.data);
export const deletePayment = (id) => axios.delete(`/api/services/payments/${id}/`).then(res => res.data);

/* ------------------ Summaries ------------------ */
export const fetchDailySummary = () => axios.get("/api/services/summary/daily/").then(res => res.data);
export const fetchCustomerSummary = () => axios.get("/api/services/summary/customers/").then(res => res.data);

/* ------------------ Employee Invites & Management ------------------ */
export const sendInvite = (data) => axios.post('/api/authentication/invite/', data).then(res => res.data);
export const createEmployeeManually = (data) => axios.post('/api/authentication/create-employee/', data).then(res => res.data);
export const resendCredentials = (userId, resetPassword = false) => 
  axios.post(`/api/authentication/resend-credentials/${userId}/`, { reset_password: resetPassword }).then(res => res.data);
export const resetEmployeePassword = (userId) => resendCredentials(userId, true);

/* ------------------ Users / Workers (admin) ------------------ */
// Using Djoser's user endpoints for authentication-related user management
export const fetchWorkers = () => axios.get('/auth/users/').then(res => res.data);
export const deleteUser = (id) => axios.delete(`/auth/users/${id}/`).then(res => res.data);
export const toggleUserActive = (id, is_active) => axios.patch(`/auth/users/${id}/`, { is_active }).then(res => res.data);

// Additional business logic operations via your custom API
export const fetchUserProfiles = () => axios.get('/api/services/users/').then(res => res.data);
export const getUserActivity = (id) => axios.get(`/api/services/users/${id}/activity/`).then(res => res.data);
export const getEmployeeProfiles = () => axios.get('/api/services/employees/').then(res => res.data);
export const getWorkersList = () => axios.get('/api/services/workers/').then(res => res.data);

/* ------------------ Inventory/Materials Management ------------------ */
export const materialsAPI = {
  // Materials CRUD
  getAll: (params = {}) => axios.get('/api/services/materials/', { params }).then(res => res.data),
  getById: (id) => axios.get(`/api/services/materials/${id}/`).then(res => res.data),
  create: (data) => axios.post('/api/services/materials/', data).then(res => res.data),
  update: (id, data) => axios.put(`/api/services/materials/${id}/`, data).then(res => res.data),
  delete: (id) => axios.delete(`/api/services/materials/${id}/`).then(res => res.data),
  adjustStock: (id, data) => axios.post(`/api/services/materials/${id}/adjust_stock/`, data).then(res => res.data),
  getStatistics: () => axios.get('/api/services/materials/statistics/').then(res => res.data),
};

export const materialUsageAPI = {
  // Material Usage Tracking
  getAll: (params = {}) => axios.get('/api/services/material-usage/', { params }).then(res => res.data),
  recordUsage: (data) => axios.post('/api/services/material-usage/record_usage/', data).then(res => res.data),
  getByMaterial: (materialId) => axios.get(`/api/services/material-usage/?material_id=${materialId}`).then(res => res.data),
  getByUser: (userId) => axios.get(`/api/services/material-usage/?taken_by=${userId}`).then(res => res.data),
};

export const procurementsAPI = {
  // Procurements CRUD
  getAll: (params = {}) => axios.get('/api/services/procurements/', { params }).then(res => res.data),
  getById: (id) => axios.get(`/api/services/procurements/${id}/`).then(res => res.data),
  create: (data) => axios.post('/api/services/procurements/', data).then(res => res.data),
  update: (id, data) => axios.put(`/api/services/procurements/${id}/`, data).then(res => res.data),
  delete: (id) => axios.delete(`/api/services/procurements/${id}/`).then(res => res.data),
  markDelivered: (id, data) => axios.post(`/api/services/procurements/${id}/mark_delivered/`, data).then(res => res.data),
};

export const jobMaterialsAPI = {
  // Job Materials (Work Material Usage)
  getAll: (params = {}) => axios.get('/api/services/job-materials/', { params }).then(res => res.data),
  getByWork: (workId) => axios.get(`/api/services/works/${workId}/materials/`).then(res => res.data),
  create: (data) => axios.post('/api/services/job-materials/', data).then(res => res.data),
  recordUsage: (workId, data) => axios.post(`/api/services/works/${workId}/record_material_usage/`, data).then(res => res.data),
  update: (id, data) => axios.put(`/api/services/job-materials/${id}/`, data).then(res => res.data),
  delete: (id) => axios.delete(`/api/services/job-materials/${id}/`).then(res => res.data),
};

export const stockMovementsAPI = {
  // Stock Movements
  getAll: (params = {}) => axios.get('/api/services/stock-movements/', { params }).then(res => res.data),
  getById: (id) => axios.get(`/api/services/stock-movements/${id}/`).then(res => res.data),
};

/* ------------------ Sales Reports ------------------ */
export const salesReportsAPI = {
  // Main reports
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params.append(key, value);
      }
    });
    
    return axios.get(`/api/services/sales-reports/?${params}`).then(res => res.data);
  },

  getById: (id) => {
    return axios.get(`/api/services/sales-reports/${id}/`).then(res => res.data);
  },

  create: (data) => {
    return axios.post('/api/services/sales-reports/', data).then(res => res.data);
  },

  update: (id, data) => {
    return axios.put(`/api/services/sales-reports/${id}/`, data).then(res => res.data);
  },

  delete: (id) => {
    return axios.delete(`/api/services/sales-reports/${id}/`).then(res => res.data);
  },

  submit: (id) => {
    return axios.post(`/api/services/sales-reports/${id}/submit/`).then(res => res.data);
  },

  generateFromWorks: (id) => {
    return axios.post(`/api/services/sales-reports/${id}/generate_from_works/`).then(res => res.data);
  },

  getByDateRange: (startDate, endDate) => {
    return axios.get(`/api/services/sales-reports/by_date_range/?start_date=${startDate}&end_date=${endDate}`).then(res => res.data);
  },

  getSummary: () => {
    return axios.get('/api/services/summary/sales-reports/').then(res => res.data);
  },

  // Report Items (Category Breakdown)
  getItems: (reportId) => {
    return axios.get(`/api/services/sales-report-items/?report_id=${reportId}`).then(res => res.data);
  },

  createItem: (data) => {
    return axios.post('/api/services/sales-report-items/', data).then(res => res.data);
  },

  updateItem: (id, data) => {
    return axios.put(`/api/services/sales-report-items/${id}/`, data).then(res => res.data);
  },

  deleteItem: (id) => {
    return axios.delete(`/api/services/sales-report-items/${id}/`).then(res => res.data);
  },

  // Expenses
  getExpenses: (reportId) => {
    return axios.get(`/api/services/daily-expenses/?report_id=${reportId}`).then(res => res.data);
  },

  createExpense: (data) => {
    return axios.post('/api/services/daily-expenses/', data).then(res => res.data);
  },

  updateExpense: (id, data) => {
    return axios.put(`/api/services/daily-expenses/${id}/`, data).then(res => res.data);
  },

  deleteExpense: (id) => {
    return axios.delete(`/api/services/daily-expenses/${id}/`).then(res => res.data);
  },

  // Notes
  getNotes: (reportId) => {
    return axios.get(`/api/services/sales-report-notes/?report_id=${reportId}`).then(res => res.data);
  },

  createNote: (data) => {
    return axios.post('/api/services/sales-report-notes/', data).then(res => res.data);
  },

  deleteNote: (id) => {
    return axios.delete(`/api/services/sales-report-notes/${id}/`).then(res => res.data);
  }
};
