import axios from "../utils/axios";

/* ------------------ Customers ------------------ */
export const fetchCustomers = () => axios.get("/api/services/customers/").then(res => res.data);
export const createCustomer = (data) => axios.post("/api/services/customers/", data).then(res => res.data);
export const updateCustomer = (id, data) => axios.put(`/api/services/customers/${id}/`, data).then(res => res.data);
export const deleteCustomer = (id) => axios.delete(`/api/services/customers/${id}/`).then(res => res.data);

/* ------------------ Works ------------------ */
export const fetchWorks = () => axios.get("/api/services/works/").then(res => res.data);
export const createWork = (data) => axios.post("/api/services/works/", data).then(res => res.data);
export const updateWork = (id, data) => axios.put(`/api/services/works/${id}/`, data).then(res => res.data);
export const deleteWork = (id) => axios.delete(`/api/services/works/${id}/`).then(res => res.data);

/* ------------------ Payments ------------------ */
export const fetchPayments = () => axios.get("/api/services/payments/").then(res => res.data);
export const createPayment = (data) => axios.post("/api/services/payments/", data).then(res => res.data);
export const updatePayment = (id, data) => axios.put(`/api/services/payments/${id}/`, data).then(res => res.data);
export const deletePayment = (id) => axios.delete(`/api/services/payments/${id}/`).then(res => res.data);

/* ------------------ Summaries ------------------ */
export const fetchDailySummary = () => axios.get("/api/services/summary/daily/").then(res => res.data);
export const fetchCustomerSummary = () => axios.get("/api/services/summary/customers/").then(res => res.data);

/* ------------------ Invites ------------------ */
export const sendInvite = (data) => axios.post('/api/auth/invite/', data).then(res => res.data);

/* ------------------ Users / Workers (admin) ------------------ */
export const fetchWorkers = () => axios.get('/api/auth/users/').then(res => res.data);
export const deleteUser = (id) => axios.delete(`/api/auth/users/${id}/`).then(res => res.data);
export const toggleUserActive = (id, is_active) => axios.patch(`/api/auth/users/${id}/`, { is_active }).then(res => res.data);
