import { useEffect, useState } from "react";
import { fetchCustomerSummary, fetchDailySummary } from "../utils/services"

export default function Summary() {
  const [customerSummary, setCustomerSummary] = useState([]);
  const [dailySummary, setDailySummary] = useState({});

  useEffect(() => {
    const loadData = async () => {
      try {
        setCustomerSummary(await fetchCustomerSummary());
        setDailySummary(await fetchDailySummary());
      } catch (err) {
        console.error("Failed to fetch summary:", err);
      }
    };
    loadData();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Customer Summary</h1>

      <table className="w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2 border">Customer</th>
            <th className="p-2 border">Total Works</th>
            <th className="p-2 border">Completed</th>
            <th className="p-2 border">Uncompleted</th>
            <th className="p-2 border">Paid</th>
            <th className="p-2 border">Owed</th>
          </tr>
        </thead>
        <tbody>
          {customerSummary.map(s => (
            <tr key={s.customer_id}>
              <td className="p-2 border">{s.customer_name}</td>
              <td className="p-2 border">{s.total_works}</td>
              <td className="p-2 border">{s.completed_works}</td>
              <td className="p-2 border">{s.uncompleted_works}</td>
              <td className="p-2 border">${s.total_paid}</td>
              <td className="p-2 border">${s.total_owed}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="text-xl font-semibold mt-6">Daily Summary</h2>
      <ul className="mt-2">
        <li>Total Works Done Today: {dailySummary.total_works_done}</li>
        <li>Incomplete Works: {dailySummary.incomplete_works}</li>
        <li>Revenue Today: ${dailySummary.revenue_today}</li>
      </ul>
    </div>
  );
}
