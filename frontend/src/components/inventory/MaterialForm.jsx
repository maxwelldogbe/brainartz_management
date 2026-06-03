import React, { useState } from 'react';
import './MaterialForm.css';

const CATEGORIES = [
  { value: 'paper', label: 'Paper' },
  { value: 'ink', label: 'Ink' },
  { value: 'binding', label: 'Binding Supplies' },
  { value: 'other', label: 'Other' },
];

const MaterialForm = ({ onSubmit, isLoading = false, error = null, isAdmin = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: 'other',
    unit: '',
    quantity: '',
    reorderLevel: '',
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
    const required = ['name', 'category', 'unit', 'quantity'];
    if (isAdmin) {
      if (required.some(field => !formData[field])) return;
    } else {
      if (!required.every(field => formData[field]) || !formData.reason) return;
    }

    onSubmit({
      name: formData.name,
      category: formData.category,
      unit: formData.unit,
      quantity: parseInt(formData.quantity),
      reorderLevel: parseInt(formData.reorderLevel) || 10,
      reason: formData.reason,
    });

    setFormData({
      name: '',
      category: 'other',
      unit: '',
      quantity: '',
      reorderLevel: '',
      reason: '',
    });
  };

  const isValid = formData.name && formData.category && formData.unit && formData.quantity &&
    (isAdmin || formData.reason);

  return (
    <form className="material-form" onSubmit={handleSubmit}>
      <h3>{isAdmin ? 'Create New Material' : 'Request New Material'}</h3>

      {error && <div className="form-error">{error}</div>}

      <div className="form-group">
        <label htmlFor="name">Material Name *</label>
        <input
          id="name"
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., A4 White Paper, Black Ink Cartridge"
          required
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="category">Category *</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
          >
            {CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="unit">Unit of Measure *</label>
          <input
            id="unit"
            type="text"
            name="unit"
            value={formData.unit}
            onChange={handleChange}
            placeholder="e.g., reams, liters, boxes"
            required
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="quantity">Initial Quantity *</label>
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
          <label htmlFor="reorderLevel">Reorder Level</label>
          <input
            id="reorderLevel"
            type="number"
            name="reorderLevel"
            value={formData.reorderLevel}
            onChange={handleChange}
            placeholder="Default: 10"
            min="1"
          />
        </div>
      </div>

      {!isAdmin && (
        <div className="form-group">
          <label htmlFor="reason">Reason for Addition *</label>
          <textarea
            id="reason"
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            placeholder="Why is this material needed? (e.g., new printing service, customer request)"
            rows="3"
            required
          />
        </div>
      )}

      <button
        type="submit"
        className="btn-primary"
        disabled={isLoading || !isValid}
      >
        {isLoading ? 'Submitting...' : (isAdmin ? 'Create Material' : 'Request Material')}
      </button>
    </form>
  );
};

export default MaterialForm;
