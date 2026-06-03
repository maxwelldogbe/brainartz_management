// Mirrors backend: admin (is_admin), worker (is_worker), else generic user.

export const ROLE = {
  ADMIN: 'admin',
  WORKER: 'worker',
  USER: 'user',
};

export const WORKER_FEATURE = {
  WORKS: 'works',
  PAYMENTS: 'payments',
  SALES_REPORTS: 'sales_reports',
  INVENTORY: 'inventory',
  CUSTOMERS: 'customers',
};

export function isAdmin(role) {
  return role === ROLE.ADMIN;
}

export function isWorker(role) {
  return role === ROLE.WORKER;
}

/** Nav / UI: treat non-admins as "staff" (workers + other authenticated users). */
export function isStaffLike(role) {
  return role === ROLE.WORKER || role === ROLE.USER;
}

export function canAccessFeature(user, feature) {
  if (isAdmin(user?.role)) return true;
  const permissions = Array.isArray(user?.worker_permissions) ? user.worker_permissions : [];
  return permissions.includes(feature);
}
