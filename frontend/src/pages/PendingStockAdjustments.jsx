import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, User, Package, Calendar, AlertCircle } from 'lucide-react';
import { pendingStockAdjustmentsAPI } from '../utils/services';
import { useRoleAccess } from '../hooks/useRoleAccess';

const PendingStockAdjustments = () => {
  const { canAccessAdminFeatures } = useRoleAccess();
  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('pending'); // pending, approved, rejected, all
  const [actionLoading, setActionLoading] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadAdjustments();
  }, []);

  const loadAdjustments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await pendingStockAdjustmentsAPI.getAll();
      setAdjustments(Array.isArray(response) ? response : response.results || []);
    } catch (err) {
      console.error('Error loading adjustments:', err);
      setError('Failed to load stock adjustment requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Are you sure you want to approve this stock addition?')) {
      return;
    }

    try {
      setActionLoading(id);
      await pendingStockAdjustmentsAPI.approve(id);
      await loadAdjustments();
      alert('Stock adjustment approved successfully!');
    } catch (err) {
      console.error('Error approving adjustment:', err);
      alert(err.response?.data?.error || 'Failed to approve adjustment');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      setActionLoading(showRejectModal);
      await pendingStockAdjustmentsAPI.reject(showRejectModal, {
        rejection_reason: rejectionReason
      });
      await loadAdjustments();
      setShowRejectModal(null);
      setRejectionReason('');
      alert('Stock adjustment rejected');
    } catch (err) {
      console.error('Error rejecting adjustment:', err);
      alert(err.response?.data?.error || 'Failed to reject adjustment');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredAdjustments = adjustments.filter(adj => {
    if (filter === 'all') return true;
    return adj.status === filter;
  });

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    
    const icons = {
      pending: <Clock className="h-3 w-3" />,
      approved: <CheckCircle className="h-3 w-3" />,
      rejected: <XCircle className="h-3 w-3" />
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Package className="h-6 w-6 text-blue-600" />
          Stock Addition Requests
        </h1>
        <p className="text-gray-600 mt-1">
          {canAccessAdminFeatures 
            ? 'Review and approve staff stock addition requests' 
            : 'View your submitted stock addition requests'}
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-700 font-medium">Error</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        {['pending', 'approved', 'rejected', 'all'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span className="ml-2 text-xs">
              ({adjustments.filter(a => f === 'all' || a.status === f).length})
            </span>
          </button>
        ))}
      </div>

      {/* Adjustments List */}
      {filteredAdjustments.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600">No {filter !== 'all' ? filter : ''} requests found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAdjustments.map((adjustment) => (
            <div key={adjustment.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              {/* Header Row */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {adjustment.material_name}
                    </h3>
                    {getStatusBadge(adjustment.status)}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Package className="h-4 w-4" />
                      +{adjustment.quantity} {adjustment.material_unit}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {adjustment.submitted_by_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(adjustment.submitted_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Actions (only for pending and admin) */}
                {canAccessAdminFeatures && adjustment.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(adjustment.id)}
                      disabled={actionLoading === adjustment.id}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => setShowRejectModal(adjustment.id)}
                      disabled={actionLoading === adjustment.id}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </button>
                  </div>
                )}
              </div>

              {/* Reason */}
              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                <p className="text-sm font-medium text-gray-700 mb-1">Reason:</p>
                <p className="text-sm text-gray-600">{adjustment.reason}</p>
              </div>

              {/* Review Info */}
              {adjustment.status !== 'pending' && (
                <div className="flex items-center gap-4 text-xs text-gray-500 pt-3 border-t">
                  <span>Reviewed by: {adjustment.reviewed_by_name || 'N/A'}</span>
                  <span>
                    {adjustment.reviewed_at && 
                      `on ${new Date(adjustment.reviewed_at).toLocaleString()}`
                    }
                  </span>
                  {adjustment.rejection_reason && (
                    <span className="text-red-600">
                      Reason: {adjustment.rejection_reason}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-gray-900/30 flex items-center justify-center z-50 p-4 transition-all duration-200">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 transform transition-all duration-200 scale-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Request</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting this stock addition request:
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 mb-4"
              rows="3"
              placeholder="Enter rejection reason..."
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectionReason('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={actionLoading === showRejectModal}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={actionLoading === showRejectModal}
              >
                {actionLoading === showRejectModal ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingStockAdjustments;
