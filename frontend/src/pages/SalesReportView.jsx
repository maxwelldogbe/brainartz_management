import { useState, useEffect } from 'react';
/* eslint-disable react-hooks/exhaustive-deps */
import { useParams, Link } from 'react-router-dom';
import { salesReportsAPI } from '../utils/services';
import { formatCurrency, formatDateTime, EXPENSE_CATEGORIES } from '../types/salesReports';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

export default function SalesReportView() {
  const { id } = useParams();
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteForm, setNoteForm] = useState({ note: '' });

  useEffect(() => {
    loadReport();
  }, [id]);

  const loadReport = async () => {
    if (!id || id === 'undefined') {
      setError('Invalid report ID');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const reportData = await salesReportsAPI.getById(id);
      setReport(reportData);
      setError(null);
    } catch (err) {
      setError('Failed to load report. Please try again.');
    } finally {
      setLoading(false);
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
      await loadReport();
    } catch (err) {
      alert('Failed to save note. Please try again.');
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;

    try {
      await salesReportsAPI.deleteNote(noteId);
      await loadReport();
    } catch (err) {
      alert('Failed to delete note. Please try again.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

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

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <Link
          to="/portal/sales-reports"
          className="text-blue-600 hover:text-blue-800"
        >
          ← Back to Reports
        </Link>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Report not found</h3>
        <Link
          to="/portal/sales-reports"
          className="text-blue-600 hover:text-blue-800"
        >
          ← Back to Reports
        </Link>
      </div>
    );
  }

  const statusBadge = report.is_submitted ? (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
      Submitted
    </span>
  ) : (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
      Draft
    </span>
  );

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <div className="flex justify-between items-start print:block">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 print:text-black">
            Sales Report - {new Date(report.date).toLocaleDateString()}
          </h1>
          <div className="flex items-center space-x-4 mt-2">
            {statusBadge}
            {report.submitted_at && (
              <span className="text-sm text-gray-500">
                Submitted on {formatDateTime(report.submitted_at)}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0 print:hidden">
          <button
            onClick={handlePrint}
            className="w-full sm:w-auto px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-center"
          >
            Print
          </button>
          {report.can_edit && (
            <Link
              to={`/portal/sales-reports/${id}/edit`}
              className="w-full sm:w-auto px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-center"
            >
             Edit
            </Link>
          )}
          <Link
            to="/portal/sales-reports"
            className="w-full sm:w-auto px-3 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg transition-colors text-center"
          >
            ← Back
          </Link>
        </div>
      </div>

      {/* Report Info */}
      <div className="bg-white p-6 rounded-lg shadow border print:shadow-none print:border-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <div className="text-lg font-semibold text-gray-900">
              {new Date(report.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Generated By
            </label>
            <div className="text-lg font-semibold text-gray-900">
              {report.generated_by_name}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <div className="text-lg">
              {statusBadge}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:grid-cols-4 print:gap-2">
        <div className="bg-white p-4 rounded-lg shadow border print:shadow-none print:border print:border-gray-300 min-w-0">
          <div className="text-sm text-gray-600">Total Sales</div>
          <div className="text-xl font-bold text-gray-900">{formatCurrency(report.total_sales_amount)}</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border print:shadow-none print:border print:border-gray-300 min-w-0">
          <div className="text-sm text-gray-600">Payments Received</div>
          <div className="text-xl font-bold text-green-600">{formatCurrency(report.total_payments_received)}</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border print:shadow-none print:border print:border-gray-300 min-w-0">
          <div className="text-sm text-gray-600">Outstanding</div>
          <div className="text-xl font-bold text-orange-600">{formatCurrency(report.total_outstanding)}</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border print:shadow-none print:border print:border-gray-300 min-w-0">
          <div className="text-sm text-gray-600">Net Revenue</div>
          <div className="text-xl font-bold text-blue-600">{formatCurrency(report.net_total)}</div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white p-6 rounded-lg shadow border print:shadow-none print:border-0">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales by Category</h3>

        {report.report_items?.length === 0 ? (
          <div className="text-center py-8 text-gray-500 print:py-4">
            No category items recorded
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 print:bg-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:px-2 print:py-1">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:px-2 print:py-1">
                    Works
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:px-2 print:py-1">
                    Sales
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:px-2 print:py-1">
                    Received
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:px-2 print:py-1">
                    Outstanding
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {report.report_items?.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap print:px-2 print:py-1">
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-3 print:w-2 print:h-2 print:mr-1"
                          style={{ backgroundColor: item.category_color }}
                        />
                        <span className="text-sm font-medium text-gray-900 print:text-xs">
                          {item.category_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 print:px-2 print:py-1 print:text-xs">
                      {item.total_works}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 print:px-2 print:py-1 print:text-xs">
                      {formatCurrency(item.total_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 print:px-2 print:py-1 print:text-xs">
                      {formatCurrency(item.payments_received)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 print:px-2 print:py-1 print:text-xs">
                      {formatCurrency(item.outstanding_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t border-gray-200 bg-gray-50 px-6 py-3 print:bg-white print:px-2 print:py-1">
              <div className="flex justify-between text-sm font-medium print:text-xs">
                <span>
                  Total: {report.report_items?.reduce((sum, item) => sum + item.total_works, 0)} works
                </span>
                <div className="space-x-6 print:space-x-4">
                  <span>{formatCurrency(report.total_sales_amount)} sales</span>
                  <span>{formatCurrency(report.total_payments_received)} received</span>
                  <span className="text-orange-600">{formatCurrency(report.total_outstanding)} outstanding</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Expenses */}
      <div className="bg-white p-6 rounded-lg shadow border print:shadow-none print:border-0">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Expenses</h3>

        {report.expenses?.length === 0 ? (
          <div className="text-center py-8 text-gray-500 print:py-4">
            {/* <span className="text-4xl block mb-2 print:text-2xl">💸</span> */}
            No expenses recorded
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 print:bg-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:px-2 print:py-1">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:px-2 print:py-1">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:px-2 print:py-1">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:px-2 print:py-1">
                    Receipt #
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {report.expenses?.map((expense) => (
                  <tr key={expense.id}>
                    <td className="px-6 py-4 text-sm text-gray-900 print:px-2 print:py-1 print:text-xs">
                      {expense.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 print:px-2 print:py-1 print:text-xs">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 print:px-2 print:py-1 print:text-xs">
                      {EXPENSE_CATEGORIES.find(c => c.value === expense.category)?.label || expense.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 print:px-2 print:py-1 print:text-xs">
                      {expense.receipt_number || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t border-gray-200 bg-gray-50 px-6 py-3 print:bg-white print:px-2 print:py-1">
              <div className="flex justify-end text-sm font-medium print:text-xs">
                Total Expenses: {formatCurrency(report.total_expenses)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="bg-white p-6 rounded-lg shadow border print:shadow-none print:border-0 print:break-inside-avoid">
        <div className="flex justify-between items-center mb-4 print:block">
          <h3 className="text-lg font-semibold text-gray-900">Notes & Comments</h3>
          <button
            onClick={() => setShowNoteModal(true)}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors print:hidden"
          >
            ➕ Add Note
          </button>
        </div>

        {report.notes?.length === 0 ? (
          <div className="text-center py-8 text-gray-500 print:py-4">
            No notes added
          </div>
        ) : (
          <div className="space-y-4 print:space-y-2">
            {report.notes?.map((note) => (
              <div key={note.id} className="border border-gray-200 rounded-lg p-4 print:border-gray-300 print:p-2">
                <div className="flex justify-between items-start mb-2 print:block">
                  <div className="flex items-center text-sm text-gray-600 print:text-xs print:mb-1">
                    <span className="font-medium">{note.added_by_name}</span>
                    <span className="mx-2">•</span>
                    <span>{formatDateTime(note.created_at)}</span>
                  </div>
                  {(user?.id === note.added_by || user?.is_admin) && (
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="text-red-600 hover:text-red-900 text-sm print:hidden"
                    >
                      Delete
                    </button>
                  )}
                </div>
                <p className="text-gray-900 whitespace-pre-wrap print:text-xs">{note.note}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Final Summary */}
      <div className="bg-white p-6 rounded-lg shadow border print:shadow-none print:border-0">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4">
          <div className="space-y-2 print:space-y-1">
            <div className="flex justify-between print:text-sm">
              <span>Total Sales:</span>
              <span className="font-medium">{formatCurrency(report.total_sales_amount)}</span>
            </div>
            <div className="flex justify-between print:text-sm">
              <span>Payments Received:</span>
              <span className="font-medium">{formatCurrency(report.total_payments_received)}</span>
            </div>
            <div className="flex justify-between print:text-sm">
              <span>Outstanding:</span>
              <span className="font-medium text-orange-600">{formatCurrency(report.total_outstanding)}</span>
            </div>
          </div>
          <div className="space-y-2 print:space-y-1">
            <div className="flex justify-between print:text-sm">
              <span>Total Expenses:</span>
              <span className="font-medium text-red-600">{formatCurrency(report.total_expenses)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 print:text-sm print:pt-1">
              <span className="font-semibold">Net Revenue:</span>
              <span className="font-bold text-green-600">{formatCurrency(report.net_total)}</span>
            </div>
          </div>
        </div>
      </div>

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

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            margin: 1in;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
          .print\\:text-xs {
            font-size: 0.75rem !important;
          }
          .print\\:text-sm {
            font-size: 0.875rem !important;
          }
          .print\\:text-2xl {
            font-size: 1.5rem !important;
          }
          .print\\:text-black {
            color: #000 !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:border-0 {
            border: none !important;
          }
          .print\\:border {
            border: 1px solid #d1d5db !important;
          }
          .print\\:border-gray-300 {
            border-color: #d1d5db !important;
          }
          .print\\:bg-white {
            background-color: white !important;
          }
          .print\\:space-y-4 > * + * {
            margin-top: 1rem !important;
          }
          .print\\:space-y-2 > * + * {
            margin-top: 0.5rem !important;
          }
          .print\\:space-y-1 > * + * {
            margin-top: 0.25rem !important;
          }
          .print\\:space-x-4 > * + * {
            margin-left: 1rem !important;
          }
          .print\\:gap-2 {
            gap: 0.5rem !important;
          }
          .print\\:gap-4 {
            gap: 1rem !important;
          }
          .print\\:grid-cols-2 {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
          .print\\:grid-cols-3 {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          }
          .print\\:grid-cols-4 {
            grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
          }
          .print\\:px-2 {
            padding-left: 0.5rem !important;
            padding-right: 0.5rem !important;
          }
          .print\\:py-1 {
            padding-top: 0.25rem !important;
            padding-bottom: 0.25rem !important;
          }
          .print\\:py-4 {
            padding-top: 1rem !important;
            padding-bottom: 1rem !important;
          }
          .print\\:p-2 {
            padding: 0.5rem !important;
          }
          .print\\:pt-1 {
            padding-top: 0.25rem !important;
          }
          .print\\:mb-1 {
            margin-bottom: 0.25rem !important;
          }
          .print\\:mr-1 {
            margin-right: 0.25rem !important;
          }
          .print\\:w-2 {
            width: 0.5rem !important;
          }
          .print\\:h-2 {
            height: 0.5rem !important;
          }
          .print\\:break-inside-avoid {
            break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
}