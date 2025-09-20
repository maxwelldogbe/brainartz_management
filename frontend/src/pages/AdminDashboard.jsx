import { useEffect, useState } from "react";
import axios from "../utils/axios";

export default function AdminDashboard() {
  const [data, setData] = useState(null);

  const load = async () => {
    try {
      const res = await axios.get("/api/services/admin-dashboard/");
      setData(res.data);
    } catch (err) {
      console.error("Failed to load admin dashboard", err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (!data) return <div>Loading admin dashboard...</div>;

  return (
    <div className="space-y-6">
      {/* Page title */}
      <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="p-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl shadow-lg">
          <h2 className="text-lg font-semibold">Total Customers</h2>
          <p className="text-3xl font-bold mt-2">{data.total_customers}</p>
        </div>
        <div className="p-6 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl shadow-lg">
          <h2 className="text-lg font-semibold">Total Works</h2>
          <p className="text-3xl font-bold mt-2">{data.total_works}</p>
        </div>
        <div className="p-6 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl shadow-lg">
          <h2 className="text-lg font-semibold">Total Payments</h2>
          <p className="text-3xl font-bold mt-2">${data.total_payments}</p>
        </div>
      </div>

      {/* Payments by employee */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">
          Payments by Employee
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="p-3">Employee</th>
                <th className="p-3">Count</th>
                <th className="p-3">Total</th>
              </tr>
            </thead>
            <tbody className="text-gray-600">
              {data.payments_by_employee.map((emp, idx) => (
                <tr
                  key={emp.id}
                  className={`${
                    idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                  } hover:bg-gray-100 transition`}
                >
                  <td className="p-3">{emp.email}</td>
                  <td className="p-3">{emp.payments_count}</td>
                  <td className="p-3 font-semibold">
                    ${emp.payments_total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.payments_by_employee.length === 0 && (
          <div className="text-center text-gray-500 py-4">
            No payment data available.
          </div>
        )}
      </div>
    </div>
  );
}
