import React, { useState, useEffect } from 'react';
import { Save, X, Package, Banknote, Hash, Tag, FileText, Users } from 'lucide-react';
import { useInventory } from '../../hooks/inventory/useInventory';
import { validateInventoryForm } from '../../utils/inventoryValidation';

/**
 * MaterialForm Component
 * Form for creating and editing materials with validation
 */
const MaterialForm = ({ 
  material = null, 
  onSuccess = () => {}, 
  onCancel = () => {} 
}) => {
  const { 
    categories, 
    suppliers, 
    createMaterial, 
    updateMaterial, 
    saving, 
    error 
  } = useInventory();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    unit: '',
    unitCost: '',
    reorderLevel: '',
    currentStock: '',
    supplier: ''
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Initialize form data when material prop changes
  useEffect(() => {
    if (material) {
      setFormData({
        name: material.name || '',
        description: material.description || '',
        category: material.categoryId || material.category?.id || '',
        unit: material.unit || '',
        unitCost: material.unitCost?.toString() || '',
        reorderLevel: material.reorderLevel?.toString() || '',
        currentStock: material.currentStock?.toString() || '',
        supplier: material.supplierId || material.supplier?.id || ''
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

  // Handle field blur (mark as touched)
  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field);
  };

  // Validate individual field
  const validateField = (field) => {
    const validation = validateInventoryForm('material', { [field]: formData[field] });
    
    if (!validation.isValid && validation.errors[field]) {
      setErrors(prev => ({ ...prev, [field]: validation.errors[field] }));
    } else {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mark all fields as touched
    const allFields = Object.keys(formData);
    setTouched(allFields.reduce((acc, field) => ({ ...acc, [field]: true }), {}));

    // Validate entire form
    const validation = validateInventoryForm('material', formData);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    // Prepare submission data
    const submissionData = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      categoryId: formData.category || null,
      unit: formData.unit.toLowerCase().trim(),
      unitCost: parseFloat(formData.unitCost),
      reorderLevel: parseInt(formData.reorderLevel, 10),
      currentStock: parseInt(formData.currentStock, 10),
      supplierId: formData.supplier || null
    };

    try {
      let result;
      if (material) {
        result = await updateMaterial(material.id, submissionData);
      } else {
        result = await createMaterial(submissionData);
      }

      if (result.success) {
        onSuccess(result.data);
      }
    } catch (err) {
      console.error('Error in material form:', err);
    }
  };

  // Common input classes
  const inputClasses = (field) => `
    w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors
    ${errors[field] && touched[field] ? 'border-red-300 bg-red-50' : 'border-gray-300'}
  `;

  const isEditing = !!material;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Form Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Package className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {isEditing ? 'Edit Material' : 'Add New Material'}
          </h3>
          <p className="text-sm text-gray-600">
            {isEditing ? 'Update material information and settings' : 'Enter material details and inventory settings'}
          </p>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Basic Information */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900 flex items-center gap-2">
          <FileText size={16} />
          Basic Information
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Material Name */}
          <div className="md:col-span-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Material Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              onBlur={() => handleBlur('name')}
              className={inputClasses('name')}
              placeholder="Enter material name..."
              maxLength={100}
            />
            {errors.name && touched.name && (
              <p className="text-red-600 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                id="category"
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                onBlur={() => handleBlur('category')}
                className={`pl-10 ${inputClasses('category')}`}
              >
                <option value="">Select Category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            {errors.category && touched.category && (
              <p className="text-red-600 text-sm mt-1">{errors.category}</p>
            )}
          </div>

          {/* Unit */}
          <div>
            <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
              Unit of Measurement *
            </label>
            <input
              type="text"
              id="unit"
              value={formData.unit}
              onChange={(e) => handleChange('unit', e.target.value)}
              onBlur={() => handleBlur('unit')}
              className={inputClasses('unit')}
              placeholder="e.g., kg, pcs, meters"
              maxLength={20}
            />
            {errors.unit && touched.unit && (
              <p className="text-red-600 text-sm mt-1">{errors.unit}</p>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            onBlur={() => handleBlur('description')}
            className={inputClasses('description')}
            placeholder="Enter material description (optional)..."
            rows={3}
            maxLength={500}
          />
          <div className="text-xs text-gray-500 mt-1">
            {formData.description.length}/500 characters
          </div>
          {errors.description && touched.description && (
            <p className="text-red-600 text-sm mt-1">{errors.description}</p>
          )}
        </div>
      </div>

      {/* Pricing & Stock */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900 flex items-center gap-2">
          <Banknote size={16} />
          Pricing & Stock Information
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Unit Cost */}
          <div>
            <label htmlFor="unitCost" className="block text-sm font-medium text-gray-700 mb-1">
              Unit Cost ($) *
            </label>
            <div className="relative">
              <Banknote className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="number"
                id="unitCost"
                value={formData.unitCost}
                onChange={(e) => handleChange('unitCost', e.target.value)}
                onBlur={() => handleBlur('unitCost')}
                className={`pl-10 ${inputClasses('unitCost')}`}
                placeholder="0.00"
                min="0.01"
                step="0.01"
              />
            </div>
            {errors.unitCost && touched.unitCost && (
              <p className="text-red-600 text-sm mt-1">{errors.unitCost}</p>
            )}
          </div>

          {/* Reorder Level */}
          <div>
            <label htmlFor="reorderLevel" className="block text-sm font-medium text-gray-700 mb-1">
              Reorder Level *
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="number"
                id="reorderLevel"
                value={formData.reorderLevel}
                onChange={(e) => handleChange('reorderLevel', e.target.value)}
                onBlur={() => handleBlur('reorderLevel')}
                className={`pl-10 ${inputClasses('reorderLevel')}`}
                placeholder="Minimum stock level"
                min="1"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Alert when stock falls below this level
            </p>
            {errors.reorderLevel && touched.reorderLevel && (
              <p className="text-red-600 text-sm mt-1">{errors.reorderLevel}</p>
            )}
          </div>

          {/* Current Stock */}
          <div>
            <label htmlFor="currentStock" className="block text-sm font-medium text-gray-700 mb-1">
              Current Stock *
            </label>
            <div className="relative">
              <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="number"
                id="currentStock"
                value={formData.currentStock}
                onChange={(e) => handleChange('currentStock', e.target.value)}
                onBlur={() => handleBlur('currentStock')}
                className={`pl-10 ${inputClasses('currentStock')}`}
                placeholder="Current quantity in stock"
                min="0"
                readOnly={isEditing} // Stock should be adjusted via separate modal
              />
            </div>
            {isEditing && (
              <p className="text-xs text-gray-500 mt-1">
                Use the stock adjustment feature to modify stock levels
              </p>
            )}
            {errors.currentStock && touched.currentStock && (
              <p className="text-red-600 text-sm mt-1">{errors.currentStock}</p>
            )}
          </div>

          {/* Supplier */}
          <div>
            <label htmlFor="supplier" className="block text-sm font-medium text-gray-700 mb-1">
              Primary Supplier
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                id="supplier"
                value={formData.supplier}
                onChange={(e) => handleChange('supplier', e.target.value)}
                onBlur={() => handleBlur('supplier')}
                className={`pl-10 ${inputClasses('supplier')}`}
              >
                <option value="">No Primary Supplier</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>
            {errors.supplier && touched.supplier && (
              <p className="text-red-600 text-sm mt-1">{errors.supplier}</p>
            )}
          </div>
        </div>

        {/* Cost Calculation Preview */}
        {formData.unitCost && formData.currentStock && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-800">
                Total Inventory Value:
              </span>
              <span className="text-lg font-bold text-blue-900">
                ${(parseFloat(formData.unitCost) * parseInt(formData.currentStock || 0)).toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
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
              Saving...
            </>
          ) : (
            <>
              <Save size={16} />
              {isEditing ? 'Update Material' : 'Create Material'}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default MaterialForm;