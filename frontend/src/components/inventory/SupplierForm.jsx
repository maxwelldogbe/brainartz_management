import React, { useState } from 'react';
import { Save, X, Users, Mail, Phone, MapPin } from 'lucide-react';

/**
 * SupplierForm Component
 * Modal form for adding new suppliers
 */
const SupplierForm = ({ onSuccess, onCancel, saving = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    email: '',
    phone: '',
    address: ''
  });

  const [errors, setErrors] = useState({});

  // Handle input changes
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Supplier name is required';
    }

    if (!formData.contact.trim()) {
      newErrors.contact = 'Contact person is required';
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.phone && !/^[\d\s\+\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Create supplier object
    const supplierData = {
      id: Date.now(), // Temporary ID for frontend usage
      name: formData.name.trim(),
      contact: formData.contact.trim(),
      email: formData.email.trim() || null,
      phone: formData.phone.trim() || null,
      address: formData.address.trim() || null
    };

    onSuccess(supplierData);
  };

  // Input classes
  const inputClasses = (field) => `
    w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors
    ${errors[field] ? 'border-red-300 bg-red-50' : 'border-gray-300'}
  `;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6">
          {/* Header */}
          <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Add New Supplier</h3>
              <p className="text-sm text-gray-600">Enter supplier information</p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4 mt-6">
            {/* Supplier Name */}
            <div>
              <label htmlFor="supplierName" className="block text-sm font-medium text-gray-700 mb-1">
                Supplier Name *
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  id="supplierName"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className={`pl-10 ${inputClasses('name')}`}
                  placeholder="Enter supplier company name"
                  maxLength={100}
                />
              </div>
              {errors.name && (
                <p className="text-red-600 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            {/* Contact Person */}
            <div>
              <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700 mb-1">
                Contact Person *
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  id="contactPerson"
                  value={formData.contact}
                  onChange={(e) => handleChange('contact', e.target.value)}
                  className={`pl-10 ${inputClasses('contact')}`}
                  placeholder="Enter contact person name"
                  maxLength={100}
                />
              </div>
              {errors.contact && (
                <p className="text-red-600 text-sm mt-1">{errors.contact}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-gray-500">(Optional)</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={`pl-10 ${inputClasses('email')}`}
                  placeholder="supplier@example.com"
                  maxLength={100}
                />
              </div>
              {errors.email && (
                <p className="text-red-600 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone <span className="text-gray-500">(Optional)</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className={`pl-10 ${inputClasses('phone')}`}
                  placeholder="+1 234 567 8900"
                  maxLength={20}
                />
              </div>
              {errors.phone && (
                <p className="text-red-600 text-sm mt-1">{errors.phone}</p>
              )}
            </div>

            {/* Address */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Address <span className="text-gray-500">(Optional)</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                <textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className={`pl-10 pt-3 ${inputClasses('address')}`}
                  placeholder="Enter supplier address"
                  rows={3}
                  maxLength={200}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {formData.address.length}/200 characters
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={saving}
            >
              <X size={16} />
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Add Supplier
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupplierForm;