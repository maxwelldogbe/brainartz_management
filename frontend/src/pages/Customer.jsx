import { useEffect, useState } from "react";
import {
  fetchCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "../utils/services";
import Modal from "../components/Modal";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [modalOpen, setModalOpen] = useState(false);

  const loadCustomers = async () => {
    try {
      const data = await fetchCustomers();
      setCustomers(data);
    } catch (err) {
      console.error('Error loading customers:', err);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleEdit = (customer) => {
    setEditing(customer);
    setForm({
      name: customer.name,
      email: customer.email,
      phone: customer.phone || "",
    });
    setModalOpen(true);
  };

  const handleCancel = () => {
    setEditing(null);
    setForm({ name: "", email: "", phone: "" });
    setModalOpen(false);
  };

  const handleSave = async () => {
    try {
      if (editing) await updateCustomer(editing.id, form);
      else await createCustomer(form);
      await loadCustomers();
      handleCancel();
    } catch (err) {
      console.error('Error submitting customer:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteCustomer(id);
      await loadCustomers();
    } catch (err) {
      console.error('Error deleting customer:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Customers</h1>
        <button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-md transition"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Customer</span>
        </button>
      </div>

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={handleCancel}
        title={editing ? "Edit Customer" : "Add Customer"}
      >
        <div className="space-y-3">
          <input
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={handleChange}
            className="border rounded-lg p-2 w-full"
          />
          <input
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="border rounded-lg p-2 w-full"
          />
          <input
            name="phone"
            placeholder="Phone"
            value={form.phone}
            onChange={handleChange}
            className="border rounded-lg p-2 w-full"
          />

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow"
            >
              {editing ? "Update" : "Submit"}
            </button>
            <button
              onClick={handleCancel}
              className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg shadow"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Table */}
      <div className="bg-white shadow-md rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-full text-left border-collapse">
            <thead className="bg-gray-100 text-gray-700 text-sm">
              <tr>
                <th className="p-4">ID</th>
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-sm">
              {customers.map((c, idx) => (
                <tr
                  key={c.id}
                  className={`${
                    idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                  } hover:bg-gray-100 transition`}
                >
                  <td className="p-4 font-medium text-gray-800">{c.id}</td>
                  <td className="p-4">{c.name}</td>
                  <td className="p-4">{c.email}</td>
                  <td className="p-4">{c.phone}</td>
                  <td className="p-4 space-x-2">
                    <button
                      onClick={() => handleEdit(c)}
                      className="bg-yellow-400 hover:bg-yellow-500 text-white p-2 rounded-lg shadow-sm transition"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg shadow-sm transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {customers.length === 0 && (
          <div className="p-6 text-center text-gray-500">No customers yet.</div>
        )}
      </div>
    </div>
  );
}
