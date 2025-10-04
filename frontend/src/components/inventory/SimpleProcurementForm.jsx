import React, { useState, useEffect } from 'react';
import { 
  Save, 
  X, 
  ShoppingCart, 
  Plus, 
  Trash2, 
  Users, 
  Calendar,
  AlertTriangle,
  Package,
  DollarSign,
  Hash,
  FileText
} from 'lucide-react';
import SupplierForm from './SupplierForm';
import { materialsAPI, procurementsAPI } from '../../utils/services';

/**
 * SimpleProcurementForm Component  
 * Simplified procurement form that doesn't depend on useInventory hook
 */
const SimpleProcurementForm = ({ 
  procurement = null, 
  onClose = () => {}, 
  onSave = () => {} 
}) => {
  // Form state
  const [formData, setFormData] = useState({
    supplier_name: '',
    supplier_contact: '',
    supplier_email: '',
    supplier_phone: '',
    expected_delivery: '',
    urgency: 'medium',
    notes: '',
    quantity_ordered: 1,
    unit_cost: 0,
    material: ''
  });

  const [materials, setMaterials] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSupplierForm, setShowSupplierForm] = useState(false);

  // Load materials
  useEffect(() => {
    loadMaterials();
  }, []);

  // Initialize form data if editing
  useEffect(() => {
    if (procurement) {
      setFormData({
        supplier_name: procurement.supplier_name || '',
        supplier_contact: procurement.supplier_contact || '',
        supplier_email: procurement.supplier_email || '',
        supplier_phone: procurement.supplier_phone || '',
        expected_delivery: procurement.expected_delivery?.split('T')[0] || '',
        urgency: procurement.urgency || 'medium',
        notes: procurement.notes || '',
        quantity_ordered: procurement.quantity_ordered || 1,
        unit_cost: procurement.unit_cost || 0,
        material: procurement.material?.id || procurement.material || ''
      });
    }
  }, [procurement]);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      const response = await materialsAPI.getAll();
      const materialsData = Array.isArray(response) ? response : (response?.results || response?.data || []);
      setMaterials(materialsData);
    } catch (error) {
      console.error('Error loading materials:', error);
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Handle supplier creation
  const handleSupplierCreated = (newSupplier) => {
    setFormData(prev => ({
      ...prev,
      supplier_name: newSupplier.name,
      supplier_contact: newSupplier.contact,
      supplier_email: newSupplier.email || '',
      supplier_phone: newSupplier.phone || ''
    }));
    setShowSupplierForm(false);
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.supplier_name.trim()) {
      newErrors.supplier_name = 'Supplier name is required';
    }

    if (!formData.supplier_contact.trim()) {
      newErrors.supplier_contact = 'Supplier contact is required';
    }

    if (!formData.material) {
      newErrors.material = 'Material is required';
    }

    if (!formData.quantity_ordered || formData.quantity_ordered <= 0) {
      newErrors.quantity_ordered = 'Quantity must be greater than 0';
    }

    if (!formData.unit_cost || formData.unit_cost < 0) {
      newErrors.unit_cost = 'Unit cost must be 0 or greater';
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
      const submissionData = {
        ...formData,
        total_cost: formData.quantity_ordered * formData.unit_cost
      };

      let response;
      if (procurement) {
        response = await procurementsAPI.update(procurement.id, submissionData);
      } else {
        response = await procurementsAPI.create(submissionData);
      }

      onSave(response);
    } catch (error) {
      console.error('Error saving procurement:', error);
      setErrors({ submit: 'Failed to save procurement. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  // Input classes
  const inputClasses = (field) => `
    w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors
    ${errors[field] ? 'border-red-300 bg-red-50' : 'border-gray-300'}
  `;

  const isEditing = !!procurement;
  const totalCost = formData.quantity_ordered * formData.unit_cost;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6">
          {/* Form Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {isEditing ? 'Edit Procurement Order' : 'Create Procurement Order'}
                </h3>
                <p className="text-sm text-gray-600">
                  {isEditing ? 'Update procurement details' : 'Order materials from suppliers'}
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
          <div className="space-y-6 mt-6">
            {/* Supplier Information */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">Supplier Information</h4>
                <button
                  type="button"
                  onClick={() => setShowSupplierForm(true)}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus size={14} />
                  New Supplier
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier Name *
                  </label>
                  <input
                    type="text"
                    value={formData.supplier_name}
                    onChange={(e) => handleChange('supplier_name', e.target.value)}
                    className={inputClasses('supplier_name')}
                    placeholder="Enter supplier name"
                  />
                  {errors.supplier_name && (
                    <p className="text-red-600 text-sm mt-1">{errors.supplier_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Person *
                  </label>
                  <input
                    type="text"
                    value={formData.supplier_contact}
                    onChange={(e) => handleChange('supplier_contact', e.target.value)}
                    className={inputClasses('supplier_contact')}
                    placeholder="Enter contact name"
                  />
                  {errors.supplier_contact && (
                    <p className="text-red-600 text-sm mt-1">{errors.supplier_contact}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={formData.supplier_email}
                    onChange={(e) => handleChange('supplier_email', e.target.value)}
                    className={inputClasses('supplier_email')}
                    placeholder="supplier@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    value={formData.supplier_phone}
                    onChange={(e) => handleChange('supplier_phone', e.target.value)}
                    className={inputClasses('supplier_phone')}
                    placeholder="+1 234 567 8900"
                  />
                </div>
              </div>
            </div>

            {/* Order Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Order Information</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Material *
                  </label>
                  <select
                    value={formData.material}
                    onChange={(e) => handleChange('material', e.target.value)}
                    className={inputClasses('material')}
                    disabled={loading}
                  >
                    <option value="">Select Material</option>
                    {materials.map(material => (
                      <option key={material.id} value={material.id}>
                        {material.name} ({material.category || 'Other'})
                      </option>
                    ))}
                  </select>
                  {errors.material && (
                    <p className="text-red-600 text-sm mt-1">{errors.material}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expected Delivery
                  </label>
                  <input
                    type="date"
                    value={formData.expected_delivery}
                    onChange={(e) => handleChange('expected_delivery', e.target.value)}
                    className={inputClasses('expected_delivery')}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    value={formData.quantity_ordered}
                    onChange={(e) => handleChange('quantity_ordered', parseInt(e.target.value, 10) || 0)}
                    className={inputClasses('quantity_ordered')}
                    min="1"
                    placeholder="0"
                  />
                  {errors.quantity_ordered && (
                    <p className="text-red-600 text-sm mt-1">{errors.quantity_ordered}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit Cost *
                  </label>
                  <input
                    type="number"
                    value={formData.unit_cost}
                    onChange={(e) => handleChange('unit_cost', parseFloat(e.target.value) || 0)}
                    className={inputClasses('unit_cost')}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                  {errors.unit_cost && (
                    <p className="text-red-600 text-sm mt-1">{errors.unit_cost}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.urgency}
                    onChange={(e) => handleChange('urgency', e.target.value)}
                    className={inputClasses('urgency')}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Cost
                  </label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                    <span className="text-lg font-semibold text-green-600">
                      ₵{totalCost.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                className={inputClasses('notes')}
                placeholder="Additional notes about this procurement..."
                rows={3}
                maxLength={500}
              />
              <div className="text-xs text-gray-500 mt-1">
                {formData.notes.length}/500 characters
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
                  {isEditing ? 'Update' : 'Create'} Procurement
                </>
              )}
            </button>
          </div>
        </form>

        {/* Supplier Form Modal */}
        {showSupplierForm && (
          <SupplierForm
            onSuccess={handleSupplierCreated}
            onCancel={() => setShowSupplierForm(false)}
            saving={false}
          />
        )}
      </div>
    </div>
  );
};

export default SimpleProcurementForm;