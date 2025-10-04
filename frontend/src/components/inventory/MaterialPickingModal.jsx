import React, { useState, useEffect } from 'react';
import { X, Package, Search, Plus, User, FileText, Clock } from 'lucide-react';
import { materialsAPI, materialUsageAPI } from '../../utils/services';

const MaterialPickingModal = ({ onClose, onSave }) => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [formData, setFormData] = useState({
    note: '',
    actionType: 'usage' // 'usage' for recording material pickup, 'request' for procurement request
  });

  useEffect(() => {
    loadMaterials();
  }, [searchTerm]);

  const loadMaterials = async () => {
    try {
      const response = await materialsAPI.getAll({ search: searchTerm });
      const materialsData = Array.isArray(response) ? response : (response?.results || []);
      // Only show materials that have stock available
      const availableMaterials = materialsData.filter(material => (material.current_stock || 0) > 0);
      setMaterials(availableMaterials);
    } catch (error) {
      console.error('Error loading materials:', error);
      setError('Failed to load materials. Please try again.');
    }
  };

  const handleAddMaterial = (material) => {
    const existing = selectedMaterials.find(m => m.id === material.id);
    if (existing) {
      setSelectedMaterials(prev => 
        prev.map(m => 
          m.id === material.id 
            ? { ...m, quantity: Math.min(m.quantity + 1, material.current_stock) }
            : m
        )
      );
    } else {
      setSelectedMaterials(prev => [...prev, {
        id: material.id,
        name: material.name,
        unit: material.unit || 'units',
        current_stock: material.current_stock || 0,
        quantity: 1,
        maxQuantity: material.current_stock || 0
      }]);
    }
  };

  const handleQuantityChange = (materialId, quantity) => {
    setSelectedMaterials(prev => 
      prev.map(m => 
        m.id === materialId 
          ? { ...m, quantity: Math.max(0, Math.min(quantity, m.maxQuantity)) }
          : m
      ).filter(m => m.quantity > 0)
    );
  };

  const handleRemoveMaterial = (materialId) => {
    setSelectedMaterials(prev => prev.filter(m => m.id !== materialId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedMaterials.length === 0) {
      setError('Please select at least one material');
      return;
    }

    // Validate quantities don't exceed available stock
    const invalidQuantities = selectedMaterials.filter(m => m.quantity > m.current_stock);
    if (invalidQuantities.length > 0) {
      setError(`Insufficient stock for: ${invalidQuantities.map(m => m.name).join(', ')}`);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (formData.actionType === 'usage') {
        // Record material usage (picking) - this will create usage records and reduce inventory
        for (const material of selectedMaterials) {
          await materialUsageAPI.recordUsage({
            material_id: material.id,
            quantity_taken: material.quantity,
            note: formData.note || `Material picked for work - ${material.quantity} ${material.unit} of ${material.name}`
          });
        }
      } else {
        // Create procurement request (notify admin) - this doesn't change inventory
        // For now, we'll just log this as the procurement request API might not exist yet
        console.log('Creating procurement request:', {
          materials: selectedMaterials,
          note: formData.note,
          timestamp: new Date().toISOString()
        });
        
        // You could implement a procurement request API endpoint here
        // await procurementRequestsAPI.create({ materials: selectedMaterials, note: formData.note });
        
        // For demonstration, we'll show a success message
        alert('Procurement request submitted successfully! Admin will be notified.');
      }

      onSave();
    } catch (error) {
      console.error('Error processing material action:', error);
      setError(error.response?.data?.detail || 'Failed to process request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredMaterials = materials.filter(material => 
    material.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTotalValue = () => {
    return selectedMaterials.reduce((sum, material) => sum + material.quantity, 0);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {formData.actionType === 'usage' ? 'Record Material Usage' : 'Request Materials'}
              </h2>
              <p className="text-sm text-gray-600">
                {formData.actionType === 'usage' 
                  ? 'Track materials taken from inventory for your work'
                  : 'Request materials from admin for procurement'
                }
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="bg-red-50 text-red-800 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Action Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Action Type
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, actionType: 'usage' }))}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.actionType === 'usage'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <User size={20} />
                    <span className="font-medium">Pick Materials</span>
                  </div>
                  <p className="text-sm">Record materials taken from inventory</p>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, actionType: 'request' }))}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.actionType === 'request'
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Package size={20} />
                    <span className="font-medium">Request Materials</span>
                  </div>
                  <p className="text-sm">Notify admin of material needs</p>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Available Materials */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Available Materials</h3>
                
                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search materials..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Materials List */}
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {filteredMaterials.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>No materials available</p>
                      {searchTerm && <p className="text-sm">Try adjusting your search</p>}
                    </div>
                  ) : (
                    filteredMaterials.map(material => {
                      const isLowStock = (material.current_stock || 0) <= (material.reorder_level || 0);
                      const isSelected = selectedMaterials.some(m => m.id === material.id);
                      const isOutOfStock = (material.current_stock || 0) === 0;
                      
                      return (
                        <div 
                          key={material.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            isSelected 
                              ? 'border-blue-500 bg-blue-50' 
                              : isOutOfStock
                              ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => !isOutOfStock && handleAddMaterial(material)}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{material.name}</p>
                              <p className="text-sm text-gray-600">
                                Stock: {material.current_stock || 0} {material.unit || 'units'}
                              </p>
                            </div>
                            <div className="text-right">
                              {isOutOfStock ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800 mb-1">
                                  Out of Stock
                                </span>
                              ) : isLowStock ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800 mb-1">
                                  Low Stock
                                </span>
                              ) : null}
                              {!isOutOfStock && <Plus size={16} className="text-blue-600" />}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Selected Materials */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Selected Materials</h3>
                  {selectedMaterials.length > 0 && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                      {selectedMaterials.length} item{selectedMaterials.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                
                {selectedMaterials.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No materials selected</p>
                    <p className="text-sm">Click on materials to add them</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedMaterials.map(material => (
                      <div key={material.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <p className="font-medium">{material.name}</p>
                          <button
                            type="button"
                            onClick={() => handleRemoveMaterial(material.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X size={16} />
                          </button>
                        </div>
                        <div className="flex items-center space-x-2">
                          <label className="text-sm text-gray-600">Quantity:</label>
                          <input
                            type="number"
                            value={material.quantity}
                            onChange={(e) => handleQuantityChange(material.id, parseFloat(e.target.value) || 0)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                            min="1"
                            max={material.maxQuantity}
                            step="0.01"
                          />
                          <span className="text-sm text-gray-600">{material.unit}</span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <p className="text-xs text-gray-500">
                            Available: {material.current_stock} {material.unit}
                          </p>
                          {material.quantity > material.current_stock && (
                            <span className="text-xs text-red-600">
                              Exceeds available stock!
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {/* Summary */}
                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium">Total Items:</span>
                        <span className="font-semibold">{getTotalValue()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Note */}
            <div>
              <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-2">
                {formData.actionType === 'usage' ? 'Usage Note (Optional)' : 'Request Reason'}
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 text-gray-400" size={16} />
                <textarea
                  id="note"
                  value={formData.note}
                  onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder={
                    formData.actionType === 'usage' 
                      ? 'Optional note about material usage (e.g., "For printing project", "Regular office supplies")...' 
                      : 'Explain why these materials are needed...'
                  }
                />
              </div>
            </div>

            {/* Info Box */}
            {formData.actionType === 'usage' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Clock className="text-blue-600 mt-1" size={20} />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900">Material Usage Tracking</h4>
                    <p className="text-sm text-blue-800 mt-1">
                      This will record that you have taken these materials from inventory and automatically 
                      reduce the stock quantities. An audit trail will be created showing who took what and when.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || selectedMaterials.length === 0}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                <span>
                  {loading 
                    ? 'Processing...' 
                    : formData.actionType === 'usage' 
                      ? 'Record Material Usage' 
                      : 'Submit Request'
                  }
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MaterialPickingModal;