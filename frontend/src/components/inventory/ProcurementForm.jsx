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
  Banknote,
  Hash,
  FileText
} from 'lucide-react';
import SupplierForm from './SupplierForm';
import { useInventory } from '../../hooks/inventory/useInventory';
import { validateInventoryForm } from '../../utils/inventoryValidation';

/**
 * ProcurementForm Component  
 * Form for creating procurement orders with material selection and validation
 */
const ProcurementForm = ({ 
  procurement = null, 
  onSuccess = () => {}, 
  onCancel = () => {} 
}) => {
  const { 
    materials,
    suppliers, 
    createProcurement, 
    updateProcurement, 
    saving, 
    error,
    fetchMaterials
  } = useInventory();

  // Form state
  const [formData, setFormData] = useState({
    supplier: '',
    supplierName: '',
    supplierContact: '',
    supplierEmail: '',
    supplierPhone: '',
    expectedDelivery: '',
    urgency: 'medium',
    notes: '',
    materials: []
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [materialSearch, setMaterialSearch] = useState('');
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [localSuppliers, setLocalSuppliers] = useState([]);

  // Initialize suppliers (combine from API and local)
  useEffect(() => {
    setLocalSuppliers([...suppliers]);
  }, [suppliers]);

  // Initialize form data
  useEffect(() => {
    if (procurement) {
      setFormData({
        supplier: procurement.supplierId || procurement.supplier?.id || '',
        supplierName: procurement.supplier_name || '',
        supplierContact: procurement.supplier_contact || '',
        supplierEmail: procurement.supplier_email || '',
        supplierPhone: procurement.supplier_phone || '',
        expectedDelivery: procurement.expectedDelivery?.split('T')[0] || '',
        urgency: procurement.urgency || 'medium',
        notes: procurement.notes || '',
        materials: procurement.materials?.map(m => ({
          materialId: m.materialId || m.id,
          name: m.name,
          unit: m.unit,
          quantity: m.quantity,
          unitCost: m.unitCost || m.estimatedCost || 0,
          totalCost: (m.quantity || 0) * (m.unitCost || m.estimatedCost || 0)
        })) || []
      });
    }
  }, [procurement]);

  // Load materials on component mount
  useEffect(() => {
    if (materials.length === 0) {
      fetchMaterials({ limit: 100 });
    }
  }, [materials.length, fetchMaterials]);

  // Handle supplier creation
  const handleSupplierCreated = (newSupplier) => {
    // Add to local suppliers list
    setLocalSuppliers(prev => [...prev, newSupplier]);
    
    // Set as selected supplier and populate fields
    setFormData(prev => ({
      ...prev,
      supplier: newSupplier.id,
      supplierName: newSupplier.name,
      supplierContact: newSupplier.contact,
      supplierEmail: newSupplier.email || '',
      supplierPhone: newSupplier.phone || ''
    }));
    
    // Close modal
    setShowSupplierForm(false);
  };

  // Handle supplier selection change
  const handleSupplierChange = (supplierId) => {
    const selectedSupplier = localSuppliers.find(s => s.id.toString() === supplierId);
    
    setFormData(prev => ({
      ...prev,
      supplier: supplierId,
      supplierName: selectedSupplier?.name || '',
      supplierContact: selectedSupplier?.contact || '',
      supplierEmail: selectedSupplier?.email || '',
      supplierPhone: selectedSupplier?.phone || ''
    }));
    
    // Clear error when user makes selection
    if (errors.supplier) {
      setErrors(prev => ({ ...prev, supplier: null }));
    }
  };

  // Handle field blur
  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field);
  };

  // Validate individual field
  const validateField = (field) => {
    const validation = validateInventoryForm('procurement', { [field]: formData[field] });
    
    if (!validation.isValid && validation.errors[field]) {
      setErrors(prev => ({ ...prev, [field]: validation.errors[field] }));
    } else {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Add material to procurement
  const addMaterial = (material) => {
    const existingIndex = formData.materials.findIndex(m => m.materialId === material.id);
    
    if (existingIndex >= 0) {
      // Update quantity if material already exists
      updateMaterialQuantity(existingIndex, formData.materials[existingIndex].quantity + 1);
    } else {
      // Add new material
      const newMaterial = {
        materialId: material.id,
        name: material.name,
        unit: material.unit,
        quantity: 1,
        unitCost: material.unitCost || 0,
        totalCost: material.unitCost || 0
      };
      
      setFormData(prev => ({
        ...prev,
        materials: [...prev.materials, newMaterial]
      }));
    }
    
    setMaterialSearch('');
  };

  // Remove material from procurement
  const removeMaterial = (index) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index)
    }));
  };

  // Update material quantity
  const updateMaterialQuantity = (index, quantity) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.map((material, i) => 
        i === index 
          ? { 
              ...material, 
              quantity: Math.max(0, quantity),
              totalCost: Math.max(0, quantity) * material.unitCost
            }
          : material
      )
    }));
  };

  // Update material unit cost
  const updateMaterialCost = (index, unitCost) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.map((material, i) => 
        i === index 
          ? { 
              ...material, 
              unitCost: Math.max(0, unitCost),
              totalCost: material.quantity * Math.max(0, unitCost)
            }
          : material
      )
    }));
  };

  // Calculate total procurement cost
  const totalCost = formData.materials.reduce((sum, material) => sum + material.totalCost, 0);

  // Filter materials for search
  const filteredMaterials = materials.filter(material =>
    !materialSearch || 
    material.name.toLowerCase().includes(materialSearch.toLowerCase()) ||
    material.category?.name.toLowerCase().includes(materialSearch.toLowerCase())
  ).slice(0, 10);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mark all fields as touched
    const allFields = ['supplier', 'expectedDelivery', 'urgency', 'materials'];
    setTouched(allFields.reduce((acc, field) => ({ ...acc, [field]: true }), {}));

    // Validate entire form
    const validation = validateInventoryForm('procurement', formData);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    // Additional validation for materials
    if (formData.materials.length === 0) {
      setErrors(prev => ({ ...prev, materials: 'At least one material is required' }));
      return;
    }

    // Prepare submission data
    const submissionData = {
      supplierId: formData.supplier,
      supplier_name: formData.supplierName,
      supplier_contact: formData.supplierContact,
      supplier_email: formData.supplierEmail,
      supplier_phone: formData.supplierPhone,
      expectedDelivery: formData.expectedDelivery,
      urgency: formData.urgency,
      notes: formData.notes.trim(),
      materials: formData.materials.map(material => ({
        materialId: material.materialId,
        quantity: material.quantity,
        unitCost: material.unitCost
      })),
      totalCost
    };

    try {
      let result;
      if (procurement) {
        result = await updateProcurement(procurement.id, submissionData);
      } else {
        result = await createProcurement(submissionData);
      }

      if (result.success) {
        onSuccess(result.data);
      }
    } catch (err) {
    }
  };

  // Input classes
  const inputClasses = (field) => `
    w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors
    ${errors[field] && touched[field] ? 'border-red-300 bg-red-50' : 'border-gray-300'}
  `;

  const isEditing = !!procurement;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {/* Form Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
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

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Supplier */}
        <div>
          <label htmlFor="supplier" className="block text-sm font-medium text-gray-700 mb-1">
            Supplier *
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                id="supplier"
                value={formData.supplier}
                onChange={(e) => handleSupplierChange(e.target.value)}
                onBlur={() => handleBlur('supplier')}
                className={`pl-10 ${inputClasses('supplier')}`}
              >
                <option value="">Select Supplier</option>
                {localSuppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => setShowSupplierForm(true)}
              className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              title="Add New Supplier"
            >
              <Plus size={16} />
              Add
            </button>
          </div>
          {errors.supplier && touched.supplier && (
            <p className="text-red-600 text-sm mt-1">{errors.supplier}</p>
          )}
          
          {/* Show supplier details if selected */}
          {formData.supplier && formData.supplierName && (
            <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm">
              <div className="font-medium text-gray-900">{formData.supplierName}</div>
              {formData.supplierContact && (
                <div className="text-gray-600">Contact: {formData.supplierContact}</div>
              )}
              {formData.supplierEmail && (
                <div className="text-gray-600">Email: {formData.supplierEmail}</div>
              )}
              {formData.supplierPhone && (
                <div className="text-gray-600">Phone: {formData.supplierPhone}</div>
              )}
            </div>
          )}
        </div>

        {/* Expected Delivery */}
        <div>
          <label htmlFor="expectedDelivery" className="block text-sm font-medium text-gray-700 mb-1">
            Expected Delivery Date *
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="date"
              id="expectedDelivery"
              value={formData.expectedDelivery}
              onChange={(e) => setFormData(prev => ({ ...prev, expectedDelivery: e.target.value }))}
              onBlur={() => handleBlur('expectedDelivery')}
              className={`pl-10 ${inputClasses('expectedDelivery')}`}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          {errors.expectedDelivery && touched.expectedDelivery && (
            <p className="text-red-600 text-sm mt-1">{errors.expectedDelivery}</p>
          )}
        </div>

        {/* Urgency */}
        <div>
          <label htmlFor="urgency" className="block text-sm font-medium text-gray-700 mb-1">
            Urgency Level *
          </label>
          <div className="relative">
            <AlertTriangle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              id="urgency"
              value={formData.urgency}
              onChange={(e) => setFormData(prev => ({ ...prev, urgency: e.target.value }))}
              onBlur={() => handleBlur('urgency')}
              className={`pl-10 ${inputClasses('urgency')}`}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          {errors.urgency && touched.urgency && (
            <p className="text-red-600 text-sm mt-1">{errors.urgency}</p>
          )}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Notes <span className="text-gray-500">(Optional)</span>
        </label>
        <div className="relative">
          <FileText className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            onBlur={() => handleBlur('notes')}
            className={`pl-10 pt-3 ${inputClasses('notes')}`}
            placeholder="Additional notes about this procurement..."
            rows={3}
            maxLength={1000}
          />
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {formData.notes.length}/1000 characters
        </div>
      </div>

      {/* Materials Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <Package size={16} />
            Materials to Procure
          </h4>
          <span className="text-sm text-gray-600">
            {formData.materials.length} items selected
          </span>
        </div>

        {/* Material Search */}
        <div className="relative">
          <input
            type="text"
            value={materialSearch}
            onChange={(e) => setMaterialSearch(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Search materials to add..."
          />
          
          {/* Search Results Dropdown */}
          {materialSearch && filteredMaterials.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredMaterials.map(material => (
                <button
                  key={material.id}
                  type="button"
                  onClick={() => addMaterial(material)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium text-gray-900">{material.name}</div>
                    <div className="text-sm text-gray-500">
                      {material.category?.name} • Current Stock: {material.currentStock} {material.unit}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    ${material.unitCost?.toFixed(2)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected Materials */}
        {formData.materials.length > 0 ? (
          <div className="space-y-3">
            {formData.materials.map((material, index) => (
              <div key={material.materialId} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{material.name}</div>
                    <div className="text-sm text-gray-500">Unit: {material.unit}</div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* Quantity */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Quantity</label>
                      <div className="relative">
                        <Hash className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                        <input
                          type="number"
                          value={material.quantity}
                          onChange={(e) => updateMaterialQuantity(index, parseInt(e.target.value, 10) || 0)}
                          className="pl-6 pr-2 py-1 w-20 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          min="1"
                        />
                      </div>
                    </div>
                    
                    {/* Unit Cost */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Unit Cost</label>
                      <div className="relative">
                        <Banknote className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                        <input
                          type="number"
                          value={material.unitCost}
                          onChange={(e) => updateMaterialCost(index, parseFloat(e.target.value) || 0)}
                          className="pl-6 pr-2 py-1 w-24 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                    
                    {/* Total Cost */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Total</label>
                      <div className="text-sm font-medium text-green-700">
                        ${material.totalCost.toFixed(2)}
                      </div>
                    </div>
                    
                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={() => removeMaterial(index)}
                      className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                      title="Remove material"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Total Cost Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-blue-800">Total Procurement Cost:</span>
                <span className="text-xl font-bold text-blue-900">${totalCost.toFixed(2)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">No materials selected</h3>
            <p className="text-sm text-gray-500">Search and add materials to this procurement order</p>
          </div>
        )}

        {errors.materials && touched.materials && (
          <p className="text-red-600 text-sm">{errors.materials}</p>
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
          disabled={saving || formData.materials.length === 0}
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
              {isEditing ? 'Update Procurement' : 'Create Procurement'}
            </>
          )}
        </button>
      </div>

      {/* Supplier Form Modal */}
      {showSupplierForm && (
        <SupplierForm
          onSuccess={handleSupplierCreated}
          onCancel={() => setShowSupplierForm(false)}
          saving={false}
        />
      )}
    </form>
  );
};

export default ProcurementForm;