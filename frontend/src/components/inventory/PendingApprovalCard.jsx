import React, { useState } from 'react';
import './PendingApprovalCard.css';

const PendingApprovalCard = ({ adjustment, onApprove, onReject, isAdmin = false, isLoading = false }) => {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleReject = () => {
    if (rejectionReason.trim()) {
      onReject(adjustment.id, rejectionReason);
      setRejectionReason('');
      setShowRejectForm(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'status-pending';
      case 'approved':
        return 'status-approved';
      case 'rejected':
        return 'status-rejected';
      default:
        return 'status-pending';
    }
  };

  const materialName = adjustment.material_name_display || adjustment.material_name || 'Unknown Material';
  const materialUnit = adjustment.material_unit_display || adjustment.material_unit || adjustment.unit || 'units';

  return (
    <div className={`pending-approval-card ${getStatusColor(adjustment.status)}`}>
      <div className="card-header">
        <div className="card-title">
          <h4>{materialName}</h4>
          <span className={`status-badge ${adjustment.status}`}>
            {adjustment.status.charAt(0).toUpperCase() + adjustment.status.slice(1)}
          </span>
        </div>
        <span className="adjustment-type">
          {adjustment.adjustment_type === 'new_material' ? 'New Material' : 'Stock Addition'}
        </span>
      </div>

      <div className="card-body">
        <div className="request-details">
          <div className="detail-row">
            <span className="label">Quantity:</span>
            <span className="value">{adjustment.quantity} {materialUnit}</span>
          </div>

          {adjustment.adjustment_type === 'new_material' && (
            <>
              <div className="detail-row">
                <span className="label">Category:</span>
                <span className="value">{adjustment.material_category}</span>
              </div>
              <div className="detail-row">
                <span className="label">Reorder Level:</span>
                <span className="value">{adjustment.reorder_level} {materialUnit}</span>
              </div>
            </>
          )}

          <div className="detail-row">
            <span className="label">Reason:</span>
            <span className="value reason-text">{adjustment.reason}</span>
          </div>

          <div className="detail-row">
            <span className="label">Submitted by:</span>
            <span className="value">{adjustment.submitted_by_name}</span>
          </div>

          <div className="detail-row">
            <span className="label">Submitted at:</span>
            <span className="value">
              {new Date(adjustment.submitted_at).toLocaleString()}
            </span>
          </div>

          {adjustment.status !== 'pending' && (
            <>
              <div className="detail-row">
                <span className="label">Reviewed by:</span>
                <span className="value">{adjustment.reviewed_by_name || 'N/A'}</span>
              </div>
              {adjustment.reviewed_at && (
                <div className="detail-row">
                  <span className="label">Reviewed at:</span>
                  <span className="value">
                    {new Date(adjustment.reviewed_at).toLocaleString()}
                  </span>
                </div>
              )}
              {adjustment.rejection_reason && (
                <div className="rejection-box">
                  <strong>Rejection Reason:</strong>
                  <p>{adjustment.rejection_reason}</p>
                </div>
              )}
            </>
          )}
        </div>

        {isAdmin && adjustment.status === 'pending' && (
          <div className="action-section">
            {!showRejectForm ? (
              <div className="action-buttons">
                <button
                  className="btn-approve"
                  onClick={() => onApprove(adjustment.id)}
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : 'Approve'}
                </button>
                <button
                  className="btn-reject-outline"
                  onClick={() => setShowRejectForm(true)}
                  disabled={isLoading}
                >
                  Reject
                </button>
              </div>
            ) : (
              <div className="reject-form">
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter rejection reason..."
                  rows="3"
                />
                <div className="reject-buttons">
                  <button
                    className="btn-reject"
                    onClick={handleReject}
                    disabled={isLoading || !rejectionReason.trim()}
                  >
                    {isLoading ? 'Processing...' : 'Confirm Rejection'}
                  </button>
                  <button
                    className="btn-cancel"
                    onClick={() => {
                      setShowRejectForm(false);
                      setRejectionReason('');
                    }}
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingApprovalCard;
