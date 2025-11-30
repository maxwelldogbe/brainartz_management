import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { salesReportsAPI } from '../utils/services';
import { formatCurrency, formatDate } from '../types/salesReports';

export default function SalesReportsSummary() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    try {
      setLoading(true);
      const summaryData = await salesReportsAPI.getSummary();
      setSummary(summaryData);
      setError(null);
    } catch (err) {
      console.error('Error loading sales reports summary:', err);
      setError('Failed to load sales reports summary');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow border min-w-0">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow border min-w-0">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Sales Reports</h3>
        <div className="text-red-600 text-sm">{error}</div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="bg-white p-6 rounded-lg shadow border min-w-0">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Sales Reports</h3>
        <div className="text-center py-8">
          <span className="text-4xl block mb-2">📊</span>
          <p className="text-gray-600 mb-4">No sales reports yet</p>
          <Link
            to="/portal/sales-reports/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
          >
            Create First Report
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow border min-w-0">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">📊 Sales Reports</h3>
        <Link
          to="/portal/sales-reports"
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          View All →
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{summary.total_reports || 0}</div>
          <div className="text-xs text-gray-500">Total Reports</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.total_revenue)}</div>
          <div className="text-xs text-gray-500">This Month</div>
        </div>
      </div>

      {/* Status Breakdown */}
      {summary.total_reports > 0 && (
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Submitted: {summary.submitted_reports || 0}</span>
            <span>Drafts: {summary.draft_reports || 0}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full"
              style={{
                width: `${((summary.submitted_reports || 0) / summary.total_reports) * 100}%`
              }}
            />
          </div>
        </div>
      )}

      {/* Recent Reports */}
      {summary.recent_reports && summary.recent_reports.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Recent Reports</h4>
          <div className="space-y-2">
            {summary.recent_reports.slice(0, 3).map((report) => (
              <Link
                key={report.id}
                to={`/portal/sales-reports/${report.id}`}
                className="flex justify-between items-center p-2 hover:bg-gray-50 rounded transition-colors"
              >
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {formatDate(report.date)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {report.is_submitted ? '✅ Submitted' : '📝 Draft'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(report.total_sales_amount)}
                  </div>
                  <div className="text-xs text-green-600">
                    {formatCurrency(report.net_total)} net
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Outstanding Amount Alert */}
      {parseFloat(summary.total_outstanding || 0) > 0 && (
        <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center">
            <span className="text-orange-600 mr-2">⚠️</span>
            <div>
              <div className="text-sm font-medium text-orange-800">Outstanding Payments</div>
              <div className="text-xs text-orange-600">
                {formatCurrency(summary.total_outstanding)} pending collection
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-4 flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
        <Link
          to="/portal/sales-reports/new"
          className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm text-center transition-colors"
        >
          + New Report
        </Link>
        <Link
          to="/portal/sales-reports"
          className="w-full sm:flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded text-sm text-center transition-colors"
        >
          View All
        </Link>
      </div>
    </div>
  );
}