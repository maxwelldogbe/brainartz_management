import React, { useState, useEffect } from 'react';
import useInventory from '../../hooks/inventory/useInventory';
import PendingApprovalCard from '../../components/inventory/PendingApprovalCard';
import './PendingStockAdjustments.css';

const PendingStockAdjustments = () => {
  const { pendingAdjustments, loading, error, fetchPendingAdjustments, approveAdjustment, rejectAdjustment } = useInventory();
  const [filter, setFilter] = useState('all');
  const [isAdmin] = useState(localStorage.getItem('is_admin') === 'true');
  const [actionLoading, setActionLoading] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  useEffect(() => {
    fetchPendingAdjustments();
    const interval = setInterval(fetchPendingAdjustments, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (id) => {
    try {
      setActionLoading(id);
      setActionError(null);
      await approveAdjustment(id);
      setActionSuccess('Request approved successfully!');
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err) {
      setActionError(err.message || 'Failed to approve request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id, reason) => {
    try {
      setActionLoading(id);
      setActionError(null);
      await rejectAdjustment(id, reason);
      setActionSuccess('Request rejected successfully!');
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err) {
      setActionError(err.message || 'Failed to reject request');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredAdjustments = pendingAdjustments.filter(adjustment => {
    if (filter === 'pending') return adjustment.status === 'pending';
    if (filter === 'approved') return adjustment.status === 'approved';
    if (filter === 'rejected') return adjustment.status === 'rejected';
    return true;
  });

  const pendingCount = pendingAdjustments.filter(a => a.status === 'pending').length;
  const approvedCount = pendingAdjustments.filter(a => a.status === 'approved').length;
  const rejectedCount = pendingAdjustments.filter(a => a.status === 'rejected').length;

  return (
    <div className="pending-adjustments-page">
      <div className="page-header">
        <h1>{isAdmin ? 'Stock Adjustment Approvals' : 'My Stock Requests'}</h1>
        <div className="header-stats">
          <div className="stat">
            <span className="stat-value">{pendingCount}</span>
            <span className="stat-label">Pending</span>
          </div>
          <div className="stat">
            <span className="stat-value">{approvedCount}</span>
            <span className="stat-label">Approved</span>
          </div>
          <div className="stat">
            <span className="stat-value">{rejectedCount}</span>
            <span className="stat-label">Rejected</span>
          </div>
        </div>
      </div>

      {actionSuccess && <div className="alert alert-success">{actionSuccess}</div>}
      {actionError && <div className="alert alert-error">{actionError}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="page-controls">
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Requests
          </button>
          <button
            className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending
          </button>
          <button
            className={`filter-btn ${filter === 'approved' ? 'active' : ''}`}
            onClick={() => setFilter('approved')}
          >
            Approved
          </button>
          <button
            className={`filter-btn ${filter === 'rejected' ? 'active' : ''}`}
            onClick={() => setFilter('rejected')}
          >
            Rejected
          </button>
        </div>

        {isAdmin && (
          <button className="btn-refresh" onClick={fetchPendingAdjustments}>
            Refresh
          </button>
        )}
      </div>

      <div className="adjustments-list">
        {loading ? (
          <div className="loading">Loading requests...</div>
        ) : filteredAdjustments.length === 0 ? (
          <div className="empty-state">
            <p>No {filter !== 'all' ? filter : ''} requests</p>
          </div>
        ) : (
          filteredAdjustments.map(adjustment => (
            <PendingApprovalCard
              key={adjustment.id}
              adjustment={adjustment}
              onApprove={handleApprove}
              onReject={handleReject}
              isAdmin={isAdmin}
              isLoading={actionLoading === adjustment.id}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default PendingStockAdjustments;
