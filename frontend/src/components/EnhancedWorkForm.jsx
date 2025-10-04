import React, { useState, useEffect } from 'react';
import { createWork, updateWork, fetchCustomers, jobCategoriesAPI, fetchWorkers } from '../utils/services';
import Modal from './Modal';

export default function EnhancedWorkForm({ 
  isOpen, 
  onClose, 
  onSave, 
  editingWork = null, 
  customerId = null 
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: null,
    customer: customerId || null,
    note: '',
    worker: null
  });

  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const loadDropdownOptions = async () => {
      try {
        const [categoriesData, workersData, customersData] = await Promise.all([
          jobCategoriesAPI.getSelectOptions(),
          fetchWorkers(),
          !customerId ? fetchCustomers() : Promise.resolve([])
        ]);
        
        setCategories(categoriesData);
        setWorkers(workersData.filter(worker => worker.is_worker || worker.is_admin));
        if (!customerId) {
          setCustomers(customersData);
        }
      } catch (error) {
        console.error('Failed to load dropdown options:', error);
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
          customer: editingWork.customer || customerId || null,
          note: editingWork.note || '',
          worker: editingWork.worker || null
        });
      } else {
        setFormData({
          title: '',
          description: '',
          price: '',
          category: null,
          customer: customerId || null,
          note: '',
          worker: null
        });
      }
      setErrors({});
    }
  }, [editingWork, customerId, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? null : value
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

    if (!customerId && !formData.customer) {
      newErrors.customer = 'Customer selection is required';
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
        customer: formData.customer,
        note: formData.note.trim() || '',
        category: formData.category,
        worker: formData.worker
      };

      const result = editingWork 
        ? await updateWork(editingWork.id, apiData)
        : await createWork(apiData);
      
      showSuccess(`Work ${editingWork ? 'updated' : 'created'} successfully`);
      onSave(result);
      onClose();
    } catch (error) {
      console.error('Failed to save work:', error);
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
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Customer Selection */}
          {!customerId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer *
              </label>
              <select
                name="customer"
                value={formData.customer || ''}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.customer ? 'border-red-300' : 'border-gray-300'
                }`}
                required
                disabled={loading}
              >
                <option value="">Select Customer</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
              {errors.customer && (
                <p className="mt-1 text-sm text-red-600">{errors.customer}</p>
              )}
            </div>
          )}

          {/* Worker Assignment */}
          <div className={customerId ? 'md:col-span-2' : ''}>
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