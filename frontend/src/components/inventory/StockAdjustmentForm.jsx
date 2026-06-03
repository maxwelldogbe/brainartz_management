import React, { useState } from 'react';
import './StockAdjustmentForm.css';

const StockAdjustmentForm = ({ materials = [], onSubmit, isLoading = false, error = null }) => {
  const [formData, setFormData] = useState({
    materialId: '',
    quantity: '',
    reason: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.materialId || !formData.quantity || !formData.reason) {
      return;
    }
    onSubmit({
      materialId: parseInt(formData.materialId),
      quantity: parseInt(formData.quantity),
      reason: formData.reason,
    });
    setFormData({ materialId: '', quantity: '', reason: '' });
  };

  return (
    <form className="stock-adjustment-form" onSubmit={handleSubmit}>
      <h3>Request Stock Addition</h3>

      {error && <div className="form-error">{error}</div>}

      <div className="form-group">
        <label htmlFor="materialId">Material *</label>
        <select
          id="materialId"
          name="materialId"
          value={formData.materialId}
          onChange={handleChange}
          required
        >
          <option value="">Select a material...</option>
          {materials.map(material => (
            <option key={material.id} value={material.id}>
              {material.name} ({material.current_stock} {material.unit})
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="quantity">Quantity *</label>
        <input
          id="quantity"
          type="number"
          name="quantity"
          value={formData.quantity}
          onChange={handleChange}
          placeholder="Enter quantity"
          min="1"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="reason">Reason *</label>
        <textarea
          id="reason"
          name="reason"
          value={formData.reason}
          onChange={handleChange}
          placeholder="Why are you adding this stock? (e.g., unrecorded purchase, found inventory)"
          rows="4"
          required
        />
      </div>

      <button
        type="submit"
        className="btn-primary"
        disabled={isLoading || !formData.materialId || !formData.quantity || !formData.reason}
      >
        {isLoading ? 'Submitting...' : 'Submit for Approval'}
      </button>
    </form>
  );
};

export default StockAdjustmentForm;
