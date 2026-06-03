import React, { useState, useEffect } from 'react';
import useInventory from '../../hooks/inventory/useInventory';
import MaterialCard from '../../components/inventory/MaterialCard';
import StockAdjustmentForm from '../../components/inventory/StockAdjustmentForm';
import MaterialForm from '../../components/inventory/MaterialForm';
import './Materials.css';

const Materials = () => {
  const { materials, loading, error, fetchMaterials, submitStockAdjustment, submitMaterialAddition } = useInventory();
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showStockForm, setShowStockForm] = useState(false);
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [isAdmin] = useState(localStorage.getItem('is_admin') === 'true');
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);

  useEffect(() => {
    fetchMaterials();
  }, []);

  const handleAddStock = (material) => {
    setSelectedMaterial(material);
    setShowStockForm(true);
    setSubmitError(null);
  };

  const handleSubmitStockAdjustment = async (data) => {
    try {
      setSubmitError(null);
      await submitStockAdjustment(data.materialId, data.quantity, data.reason);
      setSubmitSuccess('Stock adjustment request submitted for approval!');
      setShowStockForm(false);
      setTimeout(() => setSubmitSuccess(null), 5000);
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit request');
    }
  };

  const handleSubmitMaterial = async (data) => {
    try {
      setSubmitError(null);
      await submitMaterialAddition(data.name, data.category, data.unit, data.quantity, data.reorderLevel, data.reason);
      setSubmitSuccess('Material addition request submitted for approval!');
      setShowMaterialForm(false);
      setTimeout(() => setSubmitSuccess(null), 5000);
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit request');
    }
  };

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (filter === 'low_stock') {
      return matchesSearch && material.is_low_stock;
    }
    return matchesSearch;
  });

  return (
    <div className="materials-page">
      <div className="page-header">
        <h1>Materials Inventory</h1>
        <div className="header-stats">
          <div className="stat">
            <span className="stat-value">{materials.length}</span>
            <span className="stat-label">Total Materials</span>
          </div>
          <div className="stat">
            <span className="stat-value">{materials.filter(m => m.is_low_stock).length}</span>
            <span className="stat-label">Low Stock</span>
          </div>
        </div>
      </div>

      {submitSuccess && <div className="alert alert-success">{submitSuccess}</div>}
      {submitError && <div className="alert alert-error">{submitError}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="page-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search materials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Materials
          </button>
          <button
            className={`filter-btn ${filter === 'low_stock' ? 'active' : ''}`}
            onClick={() => setFilter('low_stock')}
          >
            Low Stock
          </button>
        </div>

        <div className="action-buttons">
          <button className="btn-primary" onClick={() => setShowMaterialForm(true)}>
            + New Material
          </button>
          <button className="btn-secondary" onClick={() => setShowStockForm(true)}>
            + Add Stock
          </button>
        </div>
      </div>

      {(showStockForm || showMaterialForm) && (
        <div className="form-section">
          {showStockForm && !selectedMaterial && (
            <div className="form-container">
              <StockAdjustmentForm
                materials={materials}
                onSubmit={handleSubmitStockAdjustment}
                error={submitError}
              />
              <button
                className="btn-close"
                onClick={() => setShowStockForm(false)}
              >
                Close
              </button>
            </div>
          )}

          {showStockForm && selectedMaterial && (
            <div className="form-container">
              <div className="form-wrapper">
                <h3>Request Stock Addition for {selectedMaterial.name}</h3>
                <div className="selected-material-info">
                  <p>Current Stock: <strong>{selectedMaterial.current_stock} {selectedMaterial.unit}</strong></p>
                  <p>Reorder Level: <strong>{selectedMaterial.reorder_level} {selectedMaterial.unit}</strong></p>
                </div>
                <StockAdjustmentForm
                  materials={[selectedMaterial]}
                  onSubmit={handleSubmitStockAdjustment}
                  error={submitError}
                />
                <button
                  className="btn-close"
                  onClick={() => {
                    setShowStockForm(false);
                    setSelectedMaterial(null);
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {showMaterialForm && (
            <div className="form-container">
              <MaterialForm
                onSubmit={handleSubmitMaterial}
                error={submitError}
                isAdmin={isAdmin}
              />
              <button
                className="btn-close"
                onClick={() => setShowMaterialForm(false)}
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}

      <div className="materials-grid">
        {loading ? (
          <div className="loading">Loading materials...</div>
        ) : filteredMaterials.length === 0 ? (
          <div className="empty-state">
            <p>No materials found</p>
          </div>
        ) : (
          filteredMaterials.map(material => (
            <MaterialCard
              key={material.id}
              material={material}
              onAddStock={handleAddStock}
              isLowStock={material.is_low_stock}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Materials;
