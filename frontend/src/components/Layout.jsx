import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { RoleBasedContent } from "./RoleGuard";
import { useRoleAccess } from "../hooks/useRoleAccess";
import NotificationBell from "./notifications/NotificationBell";
import NotificationPermissionPrompt from "./notifications/NotificationPermissionPrompt";

export default function Layout() {
  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useAuth();
  const { canAccessWorkerFeatures, canAccessAdminFeatures, getUserRoleString } = useRoleAccess();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/portal/login");
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notification Permission Prompt */}
      <NotificationPermissionPrompt />
      
      {/* Sidebar - Always fixed */}
      <aside
        className={`fixed top-0 left-0 h-screen w-72 bg-gray-900 text-white flex flex-col justify-between shadow-lg transform transition-transform duration-300 z-40 overflow-y-auto
        ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div>
          <div className="p-6 text-2xl font-bold tracking-wide">
            Brainartz Management
          </div>

          {/* User Info */}
          <div className="px-6 py-4">
            <div className="text-sm text-gray-300">Welcome back,</div>
            <div className="font-semibold">{user?.first_name} {user?.last_name}</div>
            <div className="text-xs text-gray-400">{getUserRoleString()}</div>
          </div>

          <nav className="mt-6 flex flex-col space-y-2 px-4 text-sm font-medium">
            {/* Dashboard - Available to all authenticated users */}
            <NavLink
              to="/portal/dashboard"
              className={({ isActive }) =>
                `block px-3 py-2 rounded ${
                  isActive
                    ? "bg-gray-800 text-blue-400"
                    : "hover:bg-gray-800 hover:text-blue-300"
                }`
              }
              onClick={() => setIsOpen(false)}
            >
              Dashboard
            </NavLink>

            {/* Notifications - Available to all authenticated users */}
            <NavLink
              to="/portal/notifications"
              className={({ isActive }) =>
                `block px-3 py-2 rounded ${
                  isActive
                    ? "bg-gray-800 text-blue-400"
                    : "hover:bg-gray-800 hover:text-blue-300"
                }`
              }
              onClick={() => setIsOpen(false)}
            >
              Notifications
            </NavLink>

            {/* Admin-Only: Admin Dashboard */}
            <RoleBasedContent requireAdmin={true}>
              <NavLink
                to="/portal/admin-dashboard"
                className={({ isActive }) =>
                  `block px-3 py-2 rounded ${
                    isActive
                      ? "bg-gray-800 text-blue-400"
                      : "hover:bg-gray-800 hover:text-blue-300"
                  }`
                }
                onClick={() => setIsOpen(false)}
              >
                Admin Dashboard
              </NavLink>
            </RoleBasedContent>

            {/* Worker+ Features */}
            <RoleBasedContent requireWorker={true}>
              <div className="pt-4 pb-2 mt-4">
                <span className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Business Operations
                </span>
              </div>
              
              
              <NavLink
                to="/portal/works"
                className={({ isActive }) =>
                  `block px-3 py-2 rounded ${
                    isActive
                      ? "bg-gray-800 text-blue-400"
                      : "hover:bg-gray-800 hover:text-blue-300"
                  }`
                }
                onClick={() => setIsOpen(false)}
              >
                Works
              </NavLink>
              
              <NavLink
                to="/portal/payments"
                className={({ isActive }) =>
                  `block px-3 py-2 rounded ${
                    isActive
                      ? "bg-gray-800 text-blue-400"
                      : "hover:bg-gray-800 hover:text-blue-300"
                  }`
                }
                onClick={() => setIsOpen(false)}
              >
                Payments
              </NavLink>
              
              <NavLink
                to="/portal/work-analytics"
                className={({ isActive }) =>
                  `block px-3 py-2 rounded ${
                    isActive
                      ? "bg-gray-800 text-blue-400"
                      : "hover:bg-gray-800 hover:text-blue-300"
                  }`
                }
                onClick={() => setIsOpen(false)}
              >
               Analytics
              </NavLink>
              
              <NavLink
                to="/portal/sales-reports"
                className={({ isActive }) =>
                  `block px-3 py-2 rounded ${
                    isActive
                      ? "bg-gray-800 text-blue-400"
                      : "hover:bg-gray-800 hover:text-blue-300"
                  }`
                }
                onClick={() => setIsOpen(false)}
              >
                Sales Reports
              </NavLink>

              <div className="pt-4 pb-2 mt-4">
                <span className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Inventory Management
                </span>
              </div>
              
              <NavLink
                to="/portal/inventory"
                className={({ isActive }) =>
                  `block px-3 py-2 rounded ${
                    isActive
                      ? "bg-gray-800 text-blue-400"
                      : "hover:bg-gray-800 hover:text-blue-300"
                  }`
                }
                onClick={() => setIsOpen(false)}
              >
                Inventory
              </NavLink>
              
              <NavLink
                to="/portal/inventory/materials"
                className={({ isActive }) =>
                  `block px-3 py-2 rounded ${
                    isActive
                      ? "bg-gray-800 text-blue-400"
                      : "hover:bg-gray-800 hover:text-blue-300"
                  }`
                }
                onClick={() => setIsOpen(false)}
              >
                Materials
              </NavLink>
              
              <NavLink
                to="/portal/inventory/procurements"
                className={({ isActive }) =>
                  `block px-3 py-2 rounded ${
                    isActive
                      ? "bg-gray-800 text-blue-400"
                      : "hover:bg-gray-800 hover:text-blue-300"
                  }`
                }
                onClick={() => setIsOpen(false)}
              >
                Procurements
              </NavLink>
              
              <NavLink
                to="/portal/inventory/stock-movements"
                className={({ isActive }) =>
                  `block px-3 py-2 rounded ${
                    isActive
                      ? "bg-gray-800 text-blue-400"
                      : "hover:bg-gray-800 hover:text-blue-300"
                  }`
                }
                onClick={() => setIsOpen(false)}
              >
                Stock Movements
              </NavLink>
              
              <NavLink
                to="/portal/inventory/reports"
                className={({ isActive }) =>
                  `block px-3 py-2 rounded ${
                    isActive
                      ? "bg-gray-800 text-blue-400"
                      : "hover:bg-gray-800 hover:text-blue-300"
                  }`
                }
                onClick={() => setIsOpen(false)}
              >
                Inventory Reports
              </NavLink>

              <div className="pt-4 pb-2 mt-4">
                <span className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Customer Management
                </span>
              </div>
              
              <NavLink
                to="/portal/customer-contacts"
                className={({ isActive }) =>
                  `flex items-center space-x-2 px-3 py-2 rounded ${
                    isActive
                      ? "bg-gray-800 text-blue-400"
                      : "hover:bg-gray-800 hover:text-blue-300"
                  }`
                }
                onClick={() => setIsOpen(false)}
              >
                <span>Customer Contacts</span>
              </NavLink>
            </RoleBasedContent>

            {/* Admin-Only: Employee Management */}
            <RoleBasedContent requireAdmin={true}>
              <div className="pt-4 pb-2 mt-4">
                <span className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Employee Management
                </span>
              </div>
              
              <NavLink
                to="/portal/workers"
                className={({ isActive }) =>
                  `flex items-center space-x-2 px-3 py-2 rounded ${
                    isActive
                      ? "bg-gray-800 text-blue-400"
                      : "hover:bg-gray-800 hover:text-blue-300"
                  }`
                }
                onClick={() => setIsOpen(false)}
              >
                <span>All Employees</span>
              </NavLink>
              
              <NavLink
                to="/portal/invite"
                className={({ isActive }) =>
                  `flex items-center space-x-2 px-3 py-2 rounded ${
                    isActive
                      ? "bg-gray-800 text-blue-400"
                      : "hover:bg-gray-800 hover:text-blue-300"
                  }`
                }
                onClick={() => setIsOpen(false)}
              >
                <span>Add Employee</span>
              </NavLink>

              <NavLink
                to="/portal/job-categories"
                className={({ isActive }) =>
                  `flex items-center space-x-2 px-3 py-2 rounded ${
                    isActive
                      ? "bg-gray-800 text-blue-400"
                      : "hover:bg-gray-800 hover:text-blue-300"
                  }`
                }
                onClick={() => setIsOpen(false)}
              >
                <span>Job Categories</span>
              </NavLink>
              
              <div className="pt-4 pb-2 mt-4">
                <span className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Marketing (Admin Only)
                </span>
              </div>
              
                <NavLink
                to="/portal/marketing-messages"
                className={({ isActive }) =>
                  `flex items-center space-x-2 px-3 py-2 rounded ${
                    isActive
                      ? "bg-gray-800 text-blue-400"
                      : "hover:bg-gray-800 hover:text-blue-300"
                  }`
                }
                onClick={() => setIsOpen(false)}
              >
                <span>Message Templates</span>
              </NavLink>
            </RoleBasedContent>

            {/* Show access level info for debugging */}
            {import.meta.env.DEV && (
              <div className="mt-4 px-3 py-2 bg-gray-800 rounded text-xs">
                <div className="text-gray-400">Access Level:</div>
                <div>Admin: {canAccessAdminFeatures ? 'Yes' : 'No'}</div>
                <div>Worker: {canAccessWorkerFeatures ? 'Yes' : 'No'}</div>
                <div className="text-gray-400 mt-1">Roles:</div>
                <div>is_admin: {user?.is_admin ? 'Yes' : 'No'}</div>
                <div>is_worker: {user?.is_worker ? 'Yes' : 'No'}</div>
                <div>is_superuser: {user?.is_superuser ? 'Yes' : 'No'}</div>
              </div>
            )}
          </nav>
        </div>

        <div className="p-4">
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 px-3 py-2 rounded text-sm font-semibold transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Overlay (mobile only when sidebar open) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Hamburger button (mobile only) */}
      {!isOpen && (
        <button
          className="md:hidden fixed top-4 left-4 z-50 bg-gray-900 text-white p-2 rounded-lg shadow-lg"
          onClick={() => setIsOpen(true)}
          aria-label="Open menu"
        >
          Menu
        </button>
      )}

      {/* Main content area - scrollable */}
      <div className="md:ml-72 min-h-screen min-w-0">
        {/* Top bar with notifications */}
        <div className="sticky top-0 z-20 bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex-1"></div>
            <div className="flex items-center gap-4">
              <NotificationBell />
            </div>
          </div>
        </div>
        
        <main className="overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
