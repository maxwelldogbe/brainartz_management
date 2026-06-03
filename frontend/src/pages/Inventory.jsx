import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useInventory from '../../hooks/inventory/useInventory';
import './Inventory.css';

const Inventory = () => {
  const navigate = useNavigate();
  const { materials, stats, loading, error, fetchMaterials, fetchStats, fetchPendingAdjustments } = useInventory();
  const [activeTab, setActiveTab] = useState('overview');
  const [isAdmin] = useState(localStorage.getItem('is_admin') === 'true');

  useEffect(() => {
    fetchMaterials();
    fetchStats();
    fetchPendingAdjustments();
  }, []);

  const lowStockCount = materials.filter(m => m.is_low_stock).length;
  const outOfStockCount = materials.filter(m => m.current_stock === 0).length;

  return (
    <div className="inventory-page">
      <div className="page-header">
        <h1>Inventory Management System</h1>
        <div className="header-actions">
          <button
            className="btn-primary"
            onClick={() => navigate('/inventory/materials')}
          >
            View Materials
          </button>
          <button
            className="btn-secondary"
            onClick={() => navigate('/inventory/pending-adjustments')}
          >
            {isAdmin ? 'Manage Approvals' : 'My Requests'}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab ${activeTab === 'alerts' ? 'active' : ''}`}
          onClick={() => setActiveTab('alerts')}
        >
          Alerts & Warnings
        </button>
        {isAdmin && (
          <button
            className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            Statistics
          </button>
        )}
      </div>

      {activeTab === 'overview' && (
        <div className="tab-content">
          <div className="dashboard-grid">
            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}>
                <span>📦</span>
              </div>
              <div className="stat-info">
                <h3>Total Materials</h3>
                <p className="stat-value">{materials.length}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>
                <span>⚠️</span>
              </div>
              <div className="stat-info">
                <h3>Low Stock</h3>
                <p className="stat-value">{lowStockCount}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>
                <span>❌</span>
              </div>
              <div className="stat-info">
                <h3>Out of Stock</h3>
                <p className="stat-value">{outOfStockCount}</p>
              </div>
            </div>

            {isAdmin && stats && (
              <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>
                  <span>📊</span>
                </div>
                <div className="stat-info">
                  <h3>Recent Movements</h3>
                  <p className="stat-value">{stats.recent_movements_count}</p>
                </div>
              </div>
            )}
          </div>

          <div className="quick-actions">
            <h2>Quick Actions</h2>
            <div className="action-buttons">
              <button
                className="action-btn"
                onClick={() => navigate('/inventory/materials')}
              >
                <span>➕</span> Add Stock
              </button>
              <button
                className="action-btn"
                onClick={() => navigate('/inventory/materials')}
              >
                <span>🆕</span> New Material
              </button>
              <button
                className="action-btn"
                onClick={() => navigate('/inventory/pending-adjustments')}
              >
                <span>✅</span> {isAdmin ? 'Review Requests' : 'View Requests'}
              </button>
              <button
                className="action-btn"
                onClick={fetchMaterials}
                disabled={loading}
              >
                <span>🔄</span> Refresh
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="tab-content">
          <h2>Stock Alerts</h2>
          <div className="alerts-container">
            {lowStockCount > 0 && (
              <div className="alert-section">
                <h3>Low Stock Materials ({lowStockCount})</h3>
                <div className="materials-list">
                  {materials.filter(m => m.is_low_stock).map(material => (
                    <div key={material.id} className="material-alert-item">
                      <div className="material-name">{material.name}</div>
                      <div className="material-status">
                        <span className="stock-info">
                          {material.current_stock} / {material.reorder_level * 2} {material.unit}
                        </span>
                        <button
                          className="btn-small"
                          onClick={() => navigate('/inventory/materials')}
                        >
                          Add Stock
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {outOfStockCount > 0 && (
              <div className="alert-section alert-critical">
                <h3>Out of Stock Materials ({outOfStockCount})</h3>
                <div className="materials-list">
                  {materials.filter(m => m.current_stock === 0).map(material => (
                    <div key={material.id} className="material-alert-item critical">
                      <div className="material-name">{material.name}</div>
                      <div className="material-status">
                        <span className="stock-info critical">Out of Stock</span>
                        <button
                          className="btn-small critical"
                          onClick={() => navigate('/inventory/materials')}
                        >
                          Order Now
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {lowStockCount === 0 && outOfStockCount === 0 && (
              <div className="no-alerts">
                <p>All materials are well-stocked!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'stats' && isAdmin && stats && (
        <div className="tab-content">
          <h2>Inventory Statistics</h2>
          <div className="stats-grid">
            <div className="stat-box">
              <h3>By Category</h3>
              <div className="category-breakdown">
                {stats.category_breakdown && stats.category_breakdown.map((cat, idx) => (
                  <div key={idx} className="category-item">
                    <span className="cat-name">{cat.category}</span>
                    <div className="cat-info">
                      <span>{cat.count} items</span>
                      <span className="total-stock">{cat.total_stock} units</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="stat-box">
              <h3>Stock Summary</h3>
              <div className="summary-items">
                <div className="summary-item">
                  <span>Total Materials:</span>
                  <strong>{stats.total_materials}</strong>
                </div>
                <div className="summary-item">
                  <span>Low Stock:</span>
                  <strong>{stats.low_stock_count}</strong>
                </div>
                <div className="summary-item">
                  <span>Out of Stock:</span>
                  <strong>{stats.out_of_stock_count}</strong>
                </div>
                <div className="summary-item">
                  <span>Recent Movements:</span>
                  <strong>{stats.recent_movements_count}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
