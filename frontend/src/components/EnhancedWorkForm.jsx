import React, { useState, useEffect } from 'react';
import { createWork, updateWork, jobCategoriesAPI, fetchWorkers } from '../utils/services';
import Modal from './Modal';

export default function EnhancedWorkForm({ 
  isOpen, 
  onClose, 
  onSave, 
  editingWork = null 
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: null,
    customer_name: '',
    customer_phone: '',
    note: '',
    worker: null,
    mark_as_paid: false,
    payment_method: '',
    payment_tracking_number: '',
    payment_note: ''
  });

  const [categories, setCategories] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const loadDropdownOptions = async () => {
      try {
        const [categoriesData, workersData] = await Promise.all([
          jobCategoriesAPI.getSelectOptions(),
          fetchWorkers()
        ]);
        
        setCategories(categoriesData);
        setWorkers(workersData.filter(worker => worker.is_worker || worker.is_admin));
      } catch {
        showError('Failed to load form options');
      }
    };

    if (isOpen) {
      loadDropdownOptions();
      
      if (editingWork) {
        setFormData({
          title: editingWork.title || '',
          description: editingWork.description || '',
          price: editingWork.price || '',
          category: editingWork.category || null,
          customer_name: editingWork.customer_name || '',
          customer_phone: editingWork.customer_phone || '',
          note: editingWork.note || '',
          worker: editingWork.worker || null,
          mark_as_paid: false,
          payment_method: '',
          payment_tracking_number: '',
          payment_note: ''
        });
      } else {
        setFormData({
          title: '',
          description: '',
          price: '',
          category: null,
          customer_name: '',
          customer_phone: '',
          note: '',
          worker: null,
          mark_as_paid: false,
          payment_method: '',
          payment_tracking_number: '',
          payment_note: ''
        });
      }
      setErrors({});
    }
  }, [editingWork, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (value === '' ? null : value)
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Work title is required';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'Work title must be at least 3 characters';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Work description is required';
    }
    
    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Valid price is required';
    }

    // Validate customer phone only if provided
    if (formData.customer_phone.trim() && formData.customer_phone.trim().length < 10) {
      newErrors.customer_phone = 'Please enter a valid phone number (minimum 10 digits)';
    }

    // Validate payment fields if mark_as_paid is true
    if (formData.mark_as_paid && !formData.payment_method) {
      newErrors.payment_method = 'Payment method is required when marking as paid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      // Prepare data for API
      const apiData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        customer_name: formData.customer_name.trim(),
        customer_phone: formData.customer_phone.trim(),
        note: formData.note.trim() || '',
        category: formData.category,
        worker: formData.worker
      };

      // Add payment fields only when creating new work (not editing)
      if (!editingWork) {
        apiData.mark_as_paid = formData.mark_as_paid;
        if (formData.mark_as_paid) {
          apiData.payment_method = formData.payment_method;
          apiData.payment_tracking_number = formData.payment_tracking_number.trim();
          apiData.payment_note = formData.payment_note.trim();
        }
      }

      const result = editingWork 
        ? await updateWork(editingWork.id, apiData)
        : await createWork(apiData);
      
      showSuccess(`Work ${editingWork ? 'updated' : 'created'} successfully${formData.mark_as_paid && !editingWork ? ' and marked as paid' : ''}`);
      onSave(result);
      onClose();
    } catch (error) {
      if (error.response?.data) {
        setErrors(error.response.data);
      } else {
        showError('Failed to save work. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for notifications
  const showSuccess = (message) => {
    alert('✅ ' + message);
  };

  const showError = (message) => {
    alert('❌ ' + message);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={editingWork ? "Edit Work" : "Create Work"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm">
            {errors.general}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Work Title */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Work Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.title ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="e.g., Build E-commerce Website"
              required
              disabled={loading}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Job Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Job Category
            </label>
            <select
              name="category"
              value={formData.category || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            >
              <option value="">Select Category (Optional)</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} {cat.send_completion_notification ? '📲' : ''}
                </option>
              ))}
            </select>
            {formData.category && categories.find(c => c.id === parseInt(formData.category))?.send_completion_notification && (
              <p className="mt-1 text-xs text-blue-600 flex items-center gap-1">
                📲 This category sends completion notifications to customers
              </p>
            )}
          </div>

          {/* Customer Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Name
            </label>
            <input
              type="text"
              name="customer_name"
              value={formData.customer_name}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.customer_name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="e.g., John Doe (optional)"
              disabled={loading}
            />
            {errors.customer_name && (
              <p className="mt-1 text-sm text-red-600">{errors.customer_name}</p>
            )}
          </div>

          {/* Customer Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Phone
            </label>
            <input
              type="tel"
              name="customer_phone"
              value={formData.customer_phone}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.customer_phone ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="e.g., +233241234567 (optional)"
              disabled={loading}
            />
            {errors.customer_phone && (
              <p className="mt-1 text-sm text-red-600">{errors.customer_phone}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Optional - only needed for completion notifications
            </p>
          </div>

          {/* Worker Assignment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assign Worker
            </label>
            <select
              name="worker"
              value={formData.worker || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            >
              <option value="">Unassigned</option>
              {workers.map(worker => (
                <option key={worker.id} value={worker.id}>
                  {worker.first_name && worker.last_name 
                    ? `${worker.first_name} ${worker.last_name}` 
                    : worker.username}
                  {worker.is_admin && ' (Admin)'}
                </option>
              ))}
            </select>
          </div>

          {/* Price */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.price ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0.00"
                required
                disabled={loading}
              />
            </div>
            {errors.price && (
              <p className="mt-1 text-sm text-red-600">{errors.price}</p>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.description ? 'border-red-300' : 'border-gray-300'
            }`}
            rows="4"
            placeholder="Detailed description of the work..."
            required
            disabled={loading}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Internal Notes
          </label>
          <textarea
            name="note"
            value={formData.note}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows="2"
            placeholder="Internal notes (not visible to customer)..."
            disabled={loading}
          />
        </div>

        {/* Payment Section (only show when creating new work) */}
        {!editingWork && (
          <div className="border-t pt-4 space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="mark_as_paid"
                  name="mark_as_paid"
                  checked={formData.mark_as_paid}
                  onChange={handleChange}
                  className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  disabled={loading}
                />
                <div className="flex-1">
                  <label htmlFor="mark_as_paid" className="block text-sm font-medium text-green-900 cursor-pointer">
                    💰 Mark as Paid (Customer paid immediately)
                  </label>
                  <p className="mt-1 text-xs text-green-700">
                    Check this box if the customer has already paid for this work. This will automatically create a payment record for the full work price.
                  </p>
                </div>
              </div>

              {/* Payment Details (shown when mark_as_paid is checked) */}
              {formData.mark_as_paid && (
                <div className="mt-4 space-y-3 pl-7">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Payment Method */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Method *
                      </label>
                      <select
                        name="payment_method"
                        value={formData.payment_method}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                          errors.payment_method ? 'border-red-300' : 'border-gray-300'
                        }`}
                        required={formData.mark_as_paid}
                        disabled={loading}
                      >
                        <option value="">Select Payment Method</option>
                        <option value="cash">Cash</option>
                        <option value="mobile_money">Mobile Money</option>
                        <option value="card">Card</option>
                        <option value="bank_transfer">Bank Transfer</option>
                      </select>
                      {errors.payment_method && (
                        <p className="mt-1 text-sm text-red-600">{errors.payment_method}</p>
                      )}
                    </div>

                    {/* Tracking Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Transaction/Reference Number
                      </label>
                      <input
                        type="text"
                        name="payment_tracking_number"
                        value={formData.payment_tracking_number}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="e.g., TXN123456 (optional)"
                        disabled={loading}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Optional - for mobile money or bank transfer reference
                      </p>
                    </div>
                  </div>

                  {/* Payment Note */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Note
                    </label>
                    <textarea
                      name="payment_note"
                      value={formData.payment_note}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      rows="2"
                      placeholder="Optional note about this payment..."
                      disabled={loading}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="form-actions flex justify-end gap-3 pt-4 border-t">
          <button 
            type="button" 
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {editingWork ? 'Updating...' : 'Creating...'}
              </span>
            ) : (
              editingWork ? 'Update Work' : 'Create Work'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}