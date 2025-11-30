import { useEffect, useState } from "react";
import {
  fetchPayments,
  createPayment,
  updatePayment,
  deletePayment,
  fetchUnpaidWorks,
} from "../utils/services";
import { useAuth } from "../context/AuthContext";
import Modal from "../components/Modal";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Eye,
} from "lucide-react";

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [works, setWorks] = useState([]);
  const [editing, setEditing] = useState(null);
  const { user } = useAuth();
  const [form, setForm] = useState({
    amount: 0,
    work: "",
    method: "cash",
    tracking_number: "",
    note: "",
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingPayment, setViewingPayment] = useState(null);

  const loadPayments = async () => {
    try {
      setPayments(await fetchPayments());
    } catch (err) {
      console.error("Failed to fetch payments:", err);
    }
  };

  const loadWorks = async () => {
    try {
      // Fetch only unpaid or partially paid works
      const worksData = await fetchUnpaidWorks();
      console.log("Fetched works:", worksData);
      console.log("Works count:", worksData.length);
      if (worksData.length > 0) {
        console.log("First work sample:", worksData[0]);
      }
      setWorks(worksData);
    } catch (err) {
      console.error("Failed to fetch unpaid works:", err);
    }
  };

  useEffect(() => {
    loadPayments();
    loadWorks();
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleChangeEnhanced = (e) => {
    const { name, value } = e.target;
    if (name === "work") {
      const selected = works.find((w) => String(w.id) === String(value));
      if (selected && selected.price) {
        setForm({ ...form, work: value, amount: selected.price });
        return;
      }
    }
    setForm({ ...form, [name]: value });
  };

  const handleEdit = (payment) => {
    if (!user || !user.is_admin) return;
    setEditing(payment);
    setForm({
      amount: payment.amount,
      work: payment.work,
      method: payment.method || "cash",
      tracking_number: payment.tracking_number || "",
      note: payment.note || "",
    });
    setModalOpen(true);
  };

  const handleCancel = () => {
    setEditing(null);
    setForm({
      amount: 0,
      work: "",
      method: "cash",
      tracking_number: "",
      note: "",
    });
    setModalOpen(false);
  };

  const handleSave = async () => {
    try {
      if (editing) {
        if (!user || !user.is_admin)
          return alert("Only admins can modify payments");
        await updatePayment(editing.id, form);
      } else await createPayment(form);
      await loadPayments();
      await loadWorks(); // Reload works to update unpaid list
      handleCancel();
    } catch (err) {
      console.error("Failed to save payment:", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deletePayment(id);
      await loadPayments();
    } catch (err) {
      console.error("Failed to delete payment:", err);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Payments</h1>
        <button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl shadow-sm transition flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          <span className="hidden sm:inline">Add Payment</span>
        </button>
      </div>

      {/* Table (desktop) */}
      <div className="hidden md:block bg-white shadow-md rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-100 text-gray-700 text-sm">
            <tr>
              <th className="p-3">ID</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Work</th>
              <th className="p-3">Method</th>
              <th className="p-3">Processed By</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm">
            {payments.map((p, idx) => (
              <tr
                key={p.id}
                className={`${
                  idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                } hover:bg-gray-100 transition`}
              >
                <td className="p-3 font-medium text-gray-800">{p.id}</td>
                <td className="p-3 font-semibold text-green-600">${p.amount}</td>
                <td className="p-3">{p.work_title || p.work_description}</td>
                <td className="p-3">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    p.method === 'cash' ? 'bg-green-100 text-green-800' :
                    p.method === 'momo' ? 'bg-blue-100 text-blue-800' :
                    p.method === 'bank' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {p.method === 'momo' ? 'Mobile Money' : 
                     p.method === 'bank' ? 'Bank Transfer' : 
                     p.method.charAt(0).toUpperCase() + p.method.slice(1)}
                  </span>
                </td>
                <td className="p-3">{p.processed_by || "—"}</td>
                <td className="p-3 space-x-2">
                  <button
                    onClick={() => {
                      setViewingPayment(p);
                      setViewModalOpen(true);
                    }}
                    className="bg-white hover:bg-gray-100 p-2 rounded-lg shadow-sm transition"
                    style={{ border: '1px solid #2563eb' }}
                    title="View Details"
                  >
                    <Eye className="h-4 w-4 text-blue-600" />
                  </button>
                  {user && user.is_admin && (
                    <>
                      <button
                        onClick={() => handleEdit(p)}
                        className="bg-white hover:bg-gray-100 p-2 rounded-lg shadow-sm transition"
                        style={{ border: '1px solid #eab308' }}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4 text-yellow-500" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="bg-white hover:bg-gray-100 p-2 rounded-lg shadow-sm transition"
                        style={{ border: '1px solid #dc2626' }}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {payments.length === 0 && (
          <div className="p-6 text-center text-gray-500">No payments yet.</div>
        )}
      </div>

      {/* Mobile card view */}
      <div className="md:hidden space-y-4">
        {payments.length === 0 && (
          <div className="p-4 text-center text-gray-500 bg-white rounded-lg shadow-sm">
            No payments yet.
          </div>
        )}
        {payments.map((p) => (
          <div
            key={p.id}
            className="bg-white rounded-lg shadow-md p-4 space-y-2"
          >
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">ID: {p.id}</span>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                p.method === 'cash' ? 'bg-green-100 text-green-800' :
                p.method === 'momo' ? 'bg-blue-100 text-blue-800' :
                p.method === 'bank' ? 'bg-purple-100 text-purple-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {p.method === 'momo' ? 'MoMo' : 
                 p.method === 'bank' ? 'Bank' : 
                 p.method.charAt(0).toUpperCase() + p.method.slice(1)}
              </span>
            </div>
            <div className="text-lg font-semibold text-green-600">
              ${p.amount}
            </div>
            <div className="text-sm text-gray-700">
              Work: {p.work_title || p.work_description}
            </div>
            <div className="text-sm text-gray-700">
              Processed By: {p.processed_by || "—"}
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setViewingPayment(p);
                  setViewModalOpen(true);
                }}
                className="flex-1 bg-white hover:bg-gray-100 p-2 rounded-lg shadow-sm transition flex items-center justify-center gap-2"
                style={{ border: '1px solid #2563eb' }}
              >
                <Eye className="h-4 w-4 text-blue-600" />
                <span className="text-blue-600">View</span>
              </button>
              {user && user.is_admin && (
                <>
                  <button
                    onClick={() => handleEdit(p)}
                    className="bg-white hover:bg-gray-100 p-2 rounded-lg shadow-sm transition"
                    style={{ border: '1px solid #eab308' }}
                  >
                    <Pencil className="h-4 w-4 text-yellow-500" />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="bg-white hover:bg-gray-100 p-2 rounded-lg shadow-sm transition"
                    style={{ border: '1px solid #dc2626' }}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={handleCancel}
        title={editing ? "Edit Payment" : "Add Payment"}
      >
        <div className="space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount
            </label>
            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              placeholder="Enter amount"
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Work */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Work
            </label>
            <select
              name="work"
              value={form.work}
              onChange={handleChangeEnhanced}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              style={{ color: '#000000 !important', backgroundColor: 'white' }}
            >
              <option value="" style={{ color: '#000000', backgroundColor: 'white' }}>Select Work ({works.length} available)</option>
              {works.map((w) => (
                <option key={w.id} value={w.id} style={{ color: '#000000', backgroundColor: 'white', padding: '8px' }}>
                  {w.description || w.title || `Work #${w.id}`}
                </option>
              ))}
            </select>
          </div>

          {/* Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method
            </label>
            <select
              name="method"
              value={form.method}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="cash">Cash</option>
              <option value="mobile_money">Mobile Money</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>
          </div>

          {/* Tracking Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tracking Number (optional)
            </label>
            <input
              type="text"
              name="tracking_number"
              value={form.tracking_number}
              onChange={handleChange}
              placeholder="Enter tracking number"
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Note (optional)
            </label>
            <input
              type="text"
              name="note"
              value={form.note}
              onChange={handleChange}
              placeholder="Add a note"
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 gap-2 pt-2">
            <button
              onClick={handleCancel}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg transition flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <X className="h-5 w-5" />
              <span className="hidden sm:inline">Cancel</span>
            </button>
            <button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <Check className="h-5 w-5" />
              <span className="hidden sm:inline">
                {editing ? "Update" : "Submit"}
              </span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Payment Details Modal */}
      <Modal isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)}>
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800 border-b pb-2">
            Payment Details
          </h2>

          {viewingPayment && (
            <div className="space-y-4">
              {/* Payment ID and Amount */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Payment ID
                  </label>
                  <p className="text-lg font-semibold text-gray-800">
                    #{viewingPayment.id}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Amount
                  </label>
                  <p className="text-lg font-bold text-green-600">
                    ${viewingPayment.amount}
                  </p>
                </div>
              </div>

              {/* Work Information */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Work
                </label>
                <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">
                  {viewingPayment.work_title && (
                    <span className="font-medium block mb-1">
                      {viewingPayment.work_title}
                    </span>
                  )}
                  <span className="text-sm text-gray-600">
                    {viewingPayment.work_description}
                  </span>
                </p>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Payment Method
                </label>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  viewingPayment.method === 'cash' ? 'bg-green-100 text-green-800' :
                  viewingPayment.method === 'momo' ? 'bg-blue-100 text-blue-800' :
                  viewingPayment.method === 'bank' ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {viewingPayment.method === 'momo' ? 'Mobile Money' : 
                   viewingPayment.method === 'bank' ? 'Bank Transfer' : 
                   viewingPayment.method.charAt(0).toUpperCase() + viewingPayment.method.slice(1)}
                </span>
              </div>

              {/* Tracking Number */}
              {viewingPayment.tracking_number && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Tracking/Reference Number
                  </label>
                  <p className="text-gray-800 bg-gray-50 p-3 rounded-lg font-mono text-sm">
                    {viewingPayment.tracking_number}
                  </p>
                </div>
              )}

              {/* Payment Date and Time */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Paid At
                </label>
                <p className="text-gray-800">
                  {new Date(viewingPayment.paid_at).toLocaleString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              {/* Processed By */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Processed By
                </label>
                <p className="text-gray-800">
                  {viewingPayment.processed_by || "—"}
                </p>
              </div>

              {/* Note */}
              {viewingPayment.note && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Note
                  </label>
                  <p className="text-gray-800 bg-yellow-50 p-3 rounded-lg border-l-4 border-yellow-400 italic">
                    {viewingPayment.note}
                  </p>
                </div>
              )}

              {/* Close Button */}
              <div className="pt-4 border-t">
                <button
                  onClick={() => setViewModalOpen(false)}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
