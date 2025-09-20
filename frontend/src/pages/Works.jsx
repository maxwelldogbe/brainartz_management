import { useEffect, useState } from "react";
import {
  fetchWorks,
  createWork,
  updateWork,
  deleteWork,
  fetchCustomers,
} from "../utils/services";
import Modal from "../components/Modal";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function Works() {
  const [works, setWorks] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    description: "",
    customer: "",
    completed: false,
    price: 0,
  });
  const [modalOpen, setModalOpen] = useState(false);

  const loadWorks = async () => {
    try {
      const data = await fetchWorks();
      setWorks(data);
    } catch (err) {
      console.error("Failed to fetch works:", err);
    }
  };

  const loadCustomers = async () => {
    try {
      const data = await fetchCustomers();
      setCustomers(data);
    } catch (err) {
      console.error("Failed to fetch customers:", err);
    }
  };

  useEffect(() => {
    loadWorks();
    loadCustomers();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleEdit = (work) => {
    setEditing(work);
    setForm({
      description: work.description,
      customer: work.customer,
      completed: work.completed,
      price: work.price,
    });
    setModalOpen(true);
  };

  const handleCancel = () => {
    setEditing(null);
    setForm({ description: "", customer: "", completed: false, price: 0 });
    setModalOpen(false);
  };

  const handleSave = async () => {
    try {
      if (editing) await updateWork(editing.id, form);
      else await createWork(form);
      await loadWorks();
      handleCancel();
    } catch (err) {
      console.error("Failed to save work:", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteWork(id);
      await loadWorks();
    } catch (err) {
      console.error("Failed to delete work:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Works</h1>
        <button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-md transition"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Work</span>
        </button>
      </div>

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={handleCancel}
        title={editing ? "Edit Work" : "Add Work"}
      >
        <div className="space-y-3">
          <input
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Description"
            className="border rounded-lg p-2 w-full"
          />

          <select
            name="customer"
            value={form.customer}
            onChange={handleChange}
            className="border rounded-lg p-2 w-full"
          >
            <option value="">Select Customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <input
            type="number"
            name="price"
            value={form.price}
            onChange={handleChange}
            placeholder="Price"
            className="border rounded-lg p-2 w-full"
          />

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="completed"
              checked={form.completed}
              onChange={handleChange}
              className="h-4 w-4"
            />
            Completed
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow"
            >
              Submit
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
                <th className="p-4">Description</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Completed</th>
                <th className="p-4">Price</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-sm">
              {works.map((w, idx) => (
                <tr
                  key={w.id}
                  className={`${
                    idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                  } hover:bg-gray-100 transition`}
                >
                  <td className="p-4 font-medium text-gray-800">{w.id}</td>
                  <td className="p-4">{w.description}</td>
                  <td className="p-4">{w.customer_name}</td>
                  <td className="p-4">{w.completed ? "✅" : "❌"}</td>
                  <td className="p-4">${w.price}</td>
                  <td className="p-4 space-x-2">
                    <button
                      onClick={() => handleEdit(w)}
                      className="bg-yellow-400 hover:bg-yellow-500 text-white p-2 rounded-lg shadow-sm transition"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(w.id)}
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
        {works.length === 0 && (
          <div className="p-6 text-center text-gray-500">No works yet.</div>
        )}
      </div>
    </div>
  );
}
