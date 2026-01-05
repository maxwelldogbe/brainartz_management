import React, { useState, useEffect } from 'react';
import { Save, X, Package, Banknote, Hash, Tag } from 'lucide-react';
import { materialsAPI } from '../../utils/services';

/**
 * SimpleMaterialForm Component
 * Simplified material form that doesn't depend on useInventory hook
 */
const SimpleMaterialForm = ({ 
  material = null, 
  onClose = () => {}, 
  onSave = () => {} 
}) => {
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'other',
    unit: '',
    current_stock: 0,
    reorder_level: 10,
    unit_cost: 0,
    description: ''
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Material categories
  const categories = [
    { value: 'paper', label: 'Paper' },
    { value: 'ink', label: 'Ink' },
    { value: 'binding', label: 'Binding Supplies' },
    { value: 'other', label: 'Other' }
  ];

  // Common units
  const units = [
    'pieces', 'sheets', 'reams', 'boxes', 'packs', 'liters', 
    'kilograms', 'meters', 'rolls', 'cartridges', 'units'
  ];

  // Initialize form data if editing
  useEffect(() => {
    if (material) {
      setFormData({
        name: material.name || '',
        category: material.category || 'other',
        unit: material.unit || '',
        current_stock: material.current_stock || 0,
        reorder_level: material.reorder_level || 10,
        unit_cost: material.unit_cost || 0,
        description: material.description || ''
      });
    }
  }, [material]);

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
      newErrors.name = 'Material name is required';
    }

    if (!formData.unit.trim()) {
      newErrors.unit = 'Unit of measurement is required';
    }

    if (formData.current_stock < 0) {
      newErrors.current_stock = 'Current stock cannot be negative';
    }

    if (formData.reorder_level < 0) {
      newErrors.reorder_level = 'Reorder level cannot be negative';
    }

    if (formData.unit_cost < 0) {
      newErrors.unit_cost = 'Unit cost cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      let response;
      if (material) {
        response = await materialsAPI.update(material.id, formData);
      } else {
        response = await materialsAPI.create(formData);
      }

      onSave(response);
    } catch (error) {
      console.error('Error saving material:', error);
      setErrors({ submit: 'Failed to save material. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  // Input classes
  const inputClasses = (field) => `
    w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors
    ${errors[field] ? 'border-red-300 bg-red-50' : 'border-gray-300'}
  `;

  const isEditing = !!material;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-gray-900/30 flex items-center justify-center p-4 z-50 transition-all duration-200">
      <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto transform transition-all duration-200 scale-100">
        <form onSubmit={handleSubmit} className="p-6">
          {/* Form Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {isEditing ? 'Edit Material' : 'Add New Material'}
                </h3>
                <p className="text-sm text-gray-600">
                  {isEditing ? 'Update material information' : 'Add a new material to inventory'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>

          {/* Error Banner */}
          {errors.submit && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              {errors.submit}
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-4 mt-6">
            {/* Material Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Material Name *
              </label>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className={`pl-10 ${inputClasses('name')}`}
                  placeholder="Enter material name"
                  maxLength={100}
                />
              </div>
              {errors.name && (
                <p className="text-red-600 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            {/* Category and Unit */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    value={formData.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                    className={`pl-10 ${inputClasses('category')}`}
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit *
                </label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => handleChange('unit', e.target.value)}
                  className={inputClasses('unit')}
                  placeholder="e.g., pieces, sheets"
                  maxLength={20}
                  list="units-list"
                />
                <datalist id="units-list">
                  {units.map(unit => (
                    <option key={unit} value={unit} />
                  ))}
                </datalist>
                {errors.unit && (
                  <p className="text-red-600 text-sm mt-1">{errors.unit}</p>
                )}
              </div>
            </div>

            {/* Stock Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Stock
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="number"
                    value={formData.current_stock}
                    onChange={(e) => handleChange('current_stock', parseInt(e.target.value, 10) || 0)}
                    className={`pl-10 ${inputClasses('current_stock')}`}
                    min="0"
                    placeholder="0"
                  />
                </div>
                {errors.current_stock && (
                  <p className="text-red-600 text-sm mt-1">{errors.current_stock}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reorder Level
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="number"
                    value={formData.reorder_level}
                    onChange={(e) => handleChange('reorder_level', parseInt(e.target.value, 10) || 0)}
                    className={`pl-10 ${inputClasses('reorder_level')}`}
                    min="0"
                    placeholder="10"
                  />
                </div>
                {errors.reorder_level && (
                  <p className="text-red-600 text-sm mt-1">{errors.reorder_level}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Alert when stock falls below this level
                </p>
              </div>
            </div>

            {/* Unit Cost */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit Cost
              </label>
              <div className="relative">
                <Banknote className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="number"
                  value={formData.unit_cost}
                  onChange={(e) => handleChange('unit_cost', parseFloat(e.target.value) || 0)}
                  className={`pl-10 ${inputClasses('unit_cost')}`}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
              {errors.unit_cost && (
                <p className="text-red-600 text-sm mt-1">{errors.unit_cost}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className={inputClasses('description')}
                placeholder="Additional details about this material"
                rows={3}
                maxLength={300}
              />
              <div className="text-xs text-gray-500 mt-1">
                {formData.description.length}/300 characters
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
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
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  {isEditing ? 'Update' : 'Add'} Material
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SimpleMaterialForm;