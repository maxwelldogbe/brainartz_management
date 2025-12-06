import React, { useState, useEffect } from 'react';
import { jobCategoriesAPI } from '../utils/services';
import Modal from './Modal';

export default function JobCategoryForm({ isOpen, onClose, onSave, editingCategory = null }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    is_active: true,
    send_completion_notification: false
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editingCategory) {
      setFormData({
        name: editingCategory.name || '',
        description: editingCategory.description || '',
        color: editingCategory.color || '#3B82F6',
        is_active: editingCategory.is_active !== false,
        send_completion_notification: editingCategory.send_completion_notification || false
      });
    } else {
      setFormData({
        name: '',
        description: '',
        color: '#3B82F6',
        is_active: true,
        send_completion_notification: false
      });
    }
    setErrors({});
  }, [editingCategory, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Category name must be at least 2 characters';
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
      const result = editingCategory 
        ? await jobCategoriesAPI.update(editingCategory.id, formData)
        : await jobCategoriesAPI.create(formData);
      
      onSave(result);
      onClose();
    } catch (error) {
      if (error.response?.data) {
        setErrors(error.response.data);
      } else {
        setErrors({ general: 'Failed to save category. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingCategory ? "Edit Job Category" : "Create Job Category"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm">
            {errors.general}
          </div>
        )}

        <div className="form-field">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.name ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="e.g., Web Development"
            required
            disabled={loading}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        <div className="form-field">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows="3"
            placeholder="Brief description of this category..."
            disabled={loading}
          />
        </div>

        <div className="form-field">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Color
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              name="color"
              value={formData.color}
              onChange={handleChange}
              className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
              disabled={loading}
            />
            <div 
              className="w-8 h-8 rounded border-2 border-gray-200"
              style={{ backgroundColor: formData.color }}
              title="Color preview"
            />
            <span className="text-sm text-gray-600">{formData.color}</span>
          </div>
        </div>

        <div className="form-field">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={loading}
            />
            <span className="text-sm font-medium text-gray-700">
              Active Category
            </span>
          </label>
          <p className="mt-1 text-xs text-gray-500">
            Inactive categories won't appear in dropdowns
          </p>
        </div>

        <div className="form-field">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="send_completion_notification"
              checked={formData.send_completion_notification}
              onChange={handleChange}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              disabled={loading}
            />
            <span className="text-sm font-medium text-gray-700">
              Send Completion Notification
            </span>
          </label>
          <p className="mt-1 text-xs text-gray-500">
            Send SMS notification to customer when work in this category is completed. <strong>Note:</strong> Customer name and phone number are required for notifications.
          </p>
        </div>

        <div className="form-actions flex justify-end gap-3 pt-4">
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
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </span>
            ) : (
              editingCategory ? 'Update Category' : 'Create Category'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}