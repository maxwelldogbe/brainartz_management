import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen flex bg-gray-50 relative">
      {/* Sidebar */}
      <aside
        className={`fixed md:static top-0 left-0 h-full md:h-auto w-64 bg-gray-900 text-white flex flex-col justify-between shadow-lg transform transition-transform duration-300 z-40
        ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div>
          <div className="p-6 text-2xl font-bold tracking-wide border-b border-gray-700">
            Brainartz Management
          </div>

          <nav className="mt-6 flex flex-col space-y-2 px-4 text-sm font-medium">
            {user && user.is_admin ? (
              <NavLink
                to="/admin-dashboard"
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
            ) : (
              <NavLink
                to="/"
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
            )}

            <NavLink
              to="/customers"
              className={({ isActive }) =>
                `block px-3 py-2 rounded ${
                  isActive
                    ? "bg-gray-800 text-blue-400"
                    : "hover:bg-gray-800 hover:text-blue-300"
                }`
              }
              onClick={() => setIsOpen(false)}
            >
              Customers
            </NavLink>
            <NavLink
              to="/works"
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
              to="/payments"
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
              to="/summary"
              className={({ isActive }) =>
                `block px-3 py-2 rounded ${
                  isActive
                    ? "bg-gray-800 text-blue-400"
                    : "hover:bg-gray-800 hover:text-blue-300"
                }`
              }
              onClick={() => setIsOpen(false)}
            >
              Summary
            </NavLink>

            {user && user.is_admin && (
              <>
                <NavLink
                  to="/workers"
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded ${
                      isActive
                        ? "bg-gray-800 text-blue-400"
                        : "hover:bg-gray-800 hover:text-blue-300"
                    }`
                  }
                  onClick={() => setIsOpen(false)}
                >
                  Employees
                </NavLink>
                <NavLink
                  to="/invite"
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded ${
                      isActive
                        ? "bg-gray-800 text-blue-400"
                        : "hover:bg-gray-800 hover:text-blue-300"
                    }`
                  }
                  onClick={() => setIsOpen(false)}
                >
                  Send Invite
                </NavLink>
              </>
            )}
          </nav>
        </div>

        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 px-3 py-2 rounded text-sm font-semibold"
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
        >
          ☰
        </button>
      )}

      {/* Main content */}
      <main className="flex-grow p-6">
        <Outlet />
      </main>
    </div>
  );
}
