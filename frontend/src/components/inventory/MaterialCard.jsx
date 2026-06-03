import React from 'react';
import './MaterialCard.css';

const MaterialCard = ({ material, onAddStock, onDelete, isLowStock = false }) => {
  const stockPercentage = material.reorder_level > 0
    ? (material.current_stock / (material.reorder_level * 2)) * 100
    : 0;

  return (
    <div className={`material-card ${isLowStock ? 'low-stock' : ''}`}>
      <div className="material-card-header">
        <h3>{material.name}</h3>
        <span className={`category-badge category-${material.category}`}>
          {material.category}
        </span>
      </div>

      <div className="material-card-body">
        <div className="stock-info">
          <div className="stock-level">
            <span className="label">Current Stock:</span>
            <span className="value">{material.current_stock} {material.unit}</span>
          </div>
          <div className="reorder-level">
            <span className="label">Reorder Level:</span>
            <span className="value">{material.reorder_level} {material.unit}</span>
          </div>
        </div>

        <div className="stock-bar">
          <div
            className={`stock-progress ${isLowStock ? 'warning' : 'normal'}`}
            style={{ width: `${Math.min(stockPercentage, 100)}%` }}
          />
        </div>

        {isLowStock && (
          <div className="low-stock-alert">
            Stock is below reorder level
          </div>
        )}

        {material.pending_adjustments && material.pending_adjustments.length > 0 && (
          <div className="pending-badge">
            {material.pending_adjustments.length} pending approval(s)
          </div>
        )}
      </div>

      <div className="material-card-footer">
        <button
          className="btn-secondary btn-sm"
          onClick={() => onAddStock && onAddStock(material)}
        >
          Add Stock
        </button>
        {onDelete && (
          <button
            className="btn-danger btn-sm"
            onClick={() => onDelete(material.id)}
          >
            Archive
          </button>
        )}
      </div>
    </div>
  );
};

export default MaterialCard;
