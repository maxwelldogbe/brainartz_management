import { useState, useEffect } from 'react';
/* eslint-disable react-hooks/exhaustive-deps */
import { useParams, useNavigate, Link } from 'react-router-dom';
import { salesReportsAPI, jobCategoriesAPI } from '../utils/services';
import { formatCurrency, formatDateTime, EXPENSE_CATEGORIES } from '../types/salesReports';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

export default function SalesReportForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = Boolean(id && id !== 'undefined');

  const [report, setReport] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);

  // Form data
  const [date, setDate] = useState('');
  const [categoryForm, setCategoryForm] = useState({
    category: '',
    total_works: '',
    total_amount: '',
    payments_received: ''
  });
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    amount: '',
    category: 'other',
    receipt_number: ''
  });
  const [noteForm, setNoteForm] = useState({ note: '' });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const categoriesData = await jobCategoriesAPI.getSelectOptions();
      setCategories(categoriesData);

      if (isEdit && id && id !== 'undefined') {
        const reportData = await salesReportsAPI.getById(id);
        setReport(reportData);
        setDate(reportData.date);
      } else {
        // Initialize empty report for new creation
        const today = new Date().toISOString().split('T')[0];
        setDate(today);
        setReport({
          report_items: [],
          expenses: [],
          notes: []
        });
      }
      setError(null);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (submit = false) => {
    if (!date) {
      alert('Please select a date');
      return;
    }

    try {
      setSaving(true);
      let reportData;

      if (isEdit && id && id !== 'undefined') {
        reportData = await salesReportsAPI.update(id, { date });
        if (submit && !report.is_submitted) {
          await salesReportsAPI.submit(id);
          reportData.is_submitted = true;
        }
      } else {
        reportData = await salesReportsAPI.create({ date });
        if (submit) {
          await salesReportsAPI.submit(reportData.id);
          reportData.is_submitted = true;
        }
      }

      if (submit) {
        navigate('/portal/sales-reports');
      } else {
        if (!isEdit) {
          navigate(`/portal/sales-reports/${reportData.id}/edit`);
        } else {
          await loadData(); // Reload to get updated data
        }
      }
    } catch (err) {
      console.error('Error saving report:', err);
      if (err.response?.data?.date) {
        setError('A report for this date already exists');
      } else {
        setError('Failed to save report. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAutoGenerate = async () => {
    if (!report?.id) {
      alert('Please save the report first');
      return;
    }

    try {
      setSaving(true);
      await salesReportsAPI.generateFromWorks(report.id);
      await loadData(); // Reload to get updated data
    } catch (err) {
      console.error('Error auto-generating from works:', err);
      alert('Failed to auto-generate from works. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddCategoryItem = async () => {
    if (!categoryForm.category || !categoryForm.total_works || !categoryForm.total_amount) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const data = {
        report_id: report.id,
        ...categoryForm,
        total_works: parseInt(categoryForm.total_works),
        total_amount: parseFloat(categoryForm.total_amount),
        payments_received: parseFloat(categoryForm.payments_received || 0)
      };

      if (editingItem) {
        await salesReportsAPI.updateItem(editingItem.id, data);
      } else {
        await salesReportsAPI.createItem(data);
      }

      setShowCategoryModal(false);
      setCategoryForm({ category: '', total_works: '', total_amount: '', payments_received: '' });
      setEditingItem(null);
      await loadData();
    } catch (err) {
      console.error('Error saving category item:', err);
      alert('Failed to save category item. Please try again.');
    }
  };

  const handleAddExpense = async () => {
    if (!expenseForm.description || !expenseForm.amount) {
      alert('Please fill in description and amount');
      return;
    }

    try {
      const data = {
        report_id: report.id,
        ...expenseForm,
        amount: parseFloat(expenseForm.amount)
      };

      if (editingExpense) {
        await salesReportsAPI.updateExpense(editingExpense.id, data);
      } else {
        await salesReportsAPI.createExpense(data);
      }

      setShowExpenseModal(false);
      setExpenseForm({ description: '', amount: '', category: 'other', receipt_number: '' });
      setEditingExpense(null);
      await loadData();
    } catch (err) {
      console.error('Error saving expense:', err);
      alert('Failed to save expense. Please try again.');
    }
  };

  const handleAddNote = async () => {
    if (!noteForm.note.trim()) {
      alert('Please enter a note');
      return;
    }

    try {
      await salesReportsAPI.createNote({
        report_id: report.id,
        note: noteForm.note.trim()
      });

      setShowNoteModal(false);
      setNoteForm({ note: '' });
      await loadData();
    } catch (err) {
      console.error('Error saving note:', err);
      alert('Failed to save note. Please try again.');
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      await salesReportsAPI.deleteItem(itemId);
      await loadData();
    } catch (err) {
      console.error('Error deleting item:', err);
      alert('Failed to delete item. Please try again.');
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;

    try {
      await salesReportsAPI.deleteExpense(expenseId);
      await loadData();
    } catch (err) {
      console.error('Error deleting expense:', err);
      alert('Failed to delete expense. Please try again.');
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;

    try {
      await salesReportsAPI.deleteNote(noteId);
      await loadData();
    } catch (err) {
      console.error('Error deleting note:', err);
      alert('Failed to delete note. Please try again.');
    }
  };

  const openEditCategory = (item) => {
    setEditingItem(item);
    setCategoryForm({
      category: item.category.toString(),
      total_works: item.total_works.toString(),
      total_amount: item.total_amount,
      payments_received: item.payments_received
    });
    setShowCategoryModal(true);
  };

  const openEditExpense = (expense) => {
    setEditingExpense(expense);
    setExpenseForm({
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      receipt_number: expense.receipt_number || ''
    });
    setShowExpenseModal(true);
  };

  const canEdit = !report?.is_submitted || user?.is_admin;
  const canSubmit = report?.id && canEdit && !report?.is_submitted;

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? `Edit Sales Report - ${date}` : 'Create New Sales Report'}
          </h1>
          {report?.is_submitted && (
            <span className="inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Submitted {report.submitted_at && `on ${formatDateTime(report.submitted_at)}`}
            </span>
          )}
        </div>
        <Link
          to="/portal/sales-reports"
          className="text-gray-600 hover:text-gray-900 font-medium"
        >
          ← Back to Reports
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Report Header */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={!canEdit}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          {report && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Generated By
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-700">
                  {report.generated_by_name || 'Loading...'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                  {report.is_submitted ? (
                    <span className="text-green-600 font-medium">Submitted</span>
                  ) : (
                    <span className="text-yellow-600 font-medium">Draft</span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex space-x-4 mt-4">
          <button
            onClick={() => handleSave(false)}
            disabled={saving || !canEdit}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
          >
            {saving ? 'Saving...' : 'Save Draft'}
          </button>

          {report?.id && (
            <button
              onClick={handleAutoGenerate}
              disabled={saving || !canEdit}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
            >
              {saving ? 'Generating...' : ' Auto-Generate from Works'}
            </button>
          )}

          {canSubmit && (
            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors"
            >
              {saving ? 'Submitting...' : 'Submit Report'}
            </button>
          )}
        </div>
      </div>

      {report?.id && (
        <>
          {/* Category Breakdown Section */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Sales by Category</h3>
              {canEdit && (
                <button
                  onClick={() => setShowCategoryModal(true)}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                >
                   Add Category
                </button>
              )}
            </div>

            {report.report_items?.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {/* <span className="text-4xl block mb-2">📊</span> */}
                No category items added yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Works
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sales
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Received
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Outstanding
                      </th>
                      {canEdit && (
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {report.report_items?.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div
                              className="w-3 h-3 rounded-full mr-3"
                              style={{ backgroundColor: item.category_color }}
                            />
                            <span className="text-sm font-medium text-gray-900">
                              {item.category_name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.total_works}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(item.total_amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(item.payments_received)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600">
                          {formatCurrency(item.outstanding_amount)}
                        </td>
                        {canEdit && (
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => openEditCategory(item)}
                              className="text-blue-600 hover:text-blue-900 mr-4"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals */}
                <div className="border-t border-gray-200 bg-gray-50 px-6 py-3">
                  <div className="flex justify-between text-sm font-medium">
                    <span>
                      Total: {report.report_items?.reduce((sum, item) => sum + item.total_works, 0)} works
                    </span>
                    <div className="space-x-6">
                      <span>{formatCurrency(report.total_sales_amount)} sales</span>
                      <span>{formatCurrency(report.total_payments_received)} received</span>
                      <span className="text-orange-600">{formatCurrency(report.total_outstanding)} outstanding</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Expenses Section */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Daily Expenses</h3>
              {canEdit && (
                <button
                  onClick={() => setShowExpenseModal(true)}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                >
                  Add Expense
                </button>
              )}
            </div>

            {report.expenses?.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {/* <span className="text-4xl block mb-2">💸</span> */}
                No expenses recorded yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Receipt #
                      </th>
                      {canEdit && (
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {report.expenses?.map((expense) => (
                      <tr key={expense.id}>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {expense.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(expense.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {EXPENSE_CATEGORIES.find(c => c.value === expense.category)?.label || expense.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {expense.receipt_number || '-'}
                        </td>
                        {canEdit && (
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => openEditExpense(expense)}
                              className="text-blue-600 hover:text-blue-900 mr-4"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteExpense(expense.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="border-t border-gray-200 bg-gray-50 px-6 py-3">
                  <div className="flex justify-end text-sm font-medium">
                    Total Expenses: {formatCurrency(report.total_expenses)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notes Section */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Notes & Comments</h3>
              <button
                onClick={() => setShowNoteModal(true)}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
              >
                ➕ Add Note
              </button>
            </div>

            {report.notes?.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {/* <span className="text-4xl block mb-2">📝</span> */}
                No notes added yet
              </div>
            ) : (
              <div className="space-y-4">
                {report.notes?.map((note) => (
                  <div key={note.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="font-medium">{note.added_by_name}</span>
                        <span className="mx-2">•</span>
                        <span>{formatDateTime(note.created_at)}</span>
                      </div>
                      {(user?.id === note.added_by || user?.is_admin) && (
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-red-600 hover:text-red-900 text-sm"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <p className="text-gray-900 whitespace-pre-wrap">{note.note}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Sales:</span>
                    <span className="font-medium">{formatCurrency(report.total_sales_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payments Received:</span>
                    <span className="font-medium">{formatCurrency(report.total_payments_received)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Outstanding:</span>
                    <span className="font-medium text-orange-600">{formatCurrency(report.total_outstanding)}</span>
                  </div>
                </div>
              </div>
              <div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Expenses:</span>
                    <span className="font-medium text-red-600">{formatCurrency(report.total_expenses)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">Net Revenue:</span>
                    <span className="font-bold text-green-600">{formatCurrency(report.net_total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Category Modal */}
      <Modal
        isOpen={showCategoryModal}
        onClose={() => {
          setShowCategoryModal(false);
          setEditingItem(null);
          setCategoryForm({ category: '', total_works: '', total_amount: '', payments_received: '' });
        }}
        title={editingItem ? 'Edit Category Item' : 'Add Category Item'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              value={categoryForm.category}
              onChange={(e) => setCategoryForm(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Works *
              </label>
              <input
                type="number"
                min="0"
                value={categoryForm.total_works}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, total_works: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Amount *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={categoryForm.total_amount}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, total_amount: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payments Received
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={categoryForm.payments_received}
              onChange={(e) => setCategoryForm(prev => ({ ...prev, payments_received: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => {
                setShowCategoryModal(false);
                setEditingItem(null);
                setCategoryForm({ category: '', total_works: '', total_amount: '', payments_received: '' });
              }}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAddCategoryItem}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              {editingItem ? 'Update' : 'Add'} Item
            </button>
          </div>
        </div>
      </Modal>

      {/* Expense Modal */}
      <Modal
        isOpen={showExpenseModal}
        onClose={() => {
          setShowExpenseModal(false);
          setEditingExpense(null);
          setExpenseForm({ description: '', amount: '', category: 'other', receipt_number: '' });
        }}
        title={editingExpense ? 'Edit Expense' : 'Add Expense'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <input
              type="text"
              value={expenseForm.description}
              onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter expense description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={expenseForm.category}
                onChange={(e) => setExpenseForm(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {EXPENSE_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Receipt Number (Optional)
            </label>
            <input
              type="text"
              value={expenseForm.receipt_number}
              onChange={(e) => setExpenseForm(prev => ({ ...prev, receipt_number: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Receipt number"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => {
                setShowExpenseModal(false);
                setEditingExpense(null);
                setExpenseForm({ description: '', amount: '', category: 'other', receipt_number: '' });
              }}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAddExpense}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              {editingExpense ? 'Update' : 'Add'} Expense
            </button>
          </div>
        </div>
      </Modal>

      {/* Note Modal */}
      <Modal
        isOpen={showNoteModal}
        onClose={() => {
          setShowNoteModal(false);
          setNoteForm({ note: '' });
        }}
        title="Add Note"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Note
            </label>
            <textarea
              value={noteForm.note}
              onChange={(e) => setNoteForm(prev => ({ ...prev, note: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your note here..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => {
                setShowNoteModal(false);
                setNoteForm({ note: '' });
              }}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAddNote}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Add Note
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}