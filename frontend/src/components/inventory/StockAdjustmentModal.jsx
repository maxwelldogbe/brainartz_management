import React, { useState } from 'react';
import { X, TrendingUp, TrendingDown, Package, AlertTriangle, FileText } from 'lucide-react';
import { materialsAPI } from '../../utils/services';

/**
 * StockAdjustmentModal Component
 * Modal for manual stock adjustments
 */
const StockAdjustmentModal = ({ material, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    adjustmentType: 'increase',
    quantity: '',
    note: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Calculate new stock level
  const calculateNewStock = () => {
    const quantity = parseFloat(formData.quantity) || 0;
    if (!quantity) return material.currentStock;
    
    return formData.adjustmentType === 'increase' 
      ? material.currentStock + quantity
      : Math.max(0, material.currentStock - quantity);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const quantity = parseFloat(formData.quantity);
    if (!quantity || quantity <= 0) {
      setErrors({ quantity: 'Please enter a valid quantity' });
      return;
    }

    if (formData.adjustmentType === 'decrease' && quantity > material.currentStock) {
      setErrors({ quantity: 'Cannot reduce stock below zero' });
      return;
    }

    try {
      setLoading(true);
      
      // Calculate adjustment quantity (positive for increase, negative for decrease)
      const adjustmentQuantity = formData.adjustmentType === 'increase' 
        ? quantity 
        : -quantity;

      await materialsAPI.adjustStock(material.id, {
        adjustment_quantity: adjustmentQuantity,
        note: formData.note.trim() || `${formData.adjustmentType === 'increase' ? 'Added' : 'Removed'} ${quantity} ${material.unit || 'units'}`
      });

      onSave();
    } catch (error) {
      console.error('Stock adjustment error:', error);
      setErrors({ submit: error.response?.data?.detail || 'Failed to adjust stock. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const newStock = calculateNewStock();
  const isValidQuantity = formData.quantity && parseFloat(formData.quantity) > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Stock Adjustment</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Material Info Header */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{material.name}</h3>
                <p className="text-sm text-gray-600">Current Stock: {material.currentStock} {material.unit}</p>
              </div>
            </div>
            
            {/* Stock Level Warning */}
            {material.currentStock <= material.reorderLevel && (
              <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
                <AlertTriangle size={16} />
                <span className="text-sm">
                  Stock is at or below reorder level ({material.reorderLevel})
                </span>
              </div>
            )}
          </div>

          {/* Error Display */}
          {errors.submit && (
            <div className="bg-red-50 text-red-800 px-4 py-3 rounded-lg mb-4">
              {errors.submit}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Adjustment Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Adjustment Type *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, adjustmentType: 'increase' }))}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.adjustmentType === 'increase'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <TrendingUp size={20} />
                    <span className="font-medium">Increase</span>
                  </div>
                  <p className="text-sm text-gray-600">Add stock to inventory</p>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, adjustmentType: 'decrease' }))}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.adjustmentType === 'decrease'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <TrendingDown size={20} />
                    <span className="font-medium">Decrease</span>
                  </div>
                  <p className="text-sm text-gray-600">Remove stock from inventory</p>
                </button>
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                Adjustment Quantity *
              </label>
              <input
                type="number"
                id="quantity"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.quantity ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Enter quantity to adjust"
                min="0"
                step="0.01"
              />
              {errors.quantity && (
                <p className="text-red-600 text-sm mt-1">{errors.quantity}</p>
              )}
            </div>

            {/* Stock Preview */}
            {isValidQuantity && (
              <div className={`p-4 rounded-lg border ${
                formData.adjustmentType === 'increase' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">New Stock Level:</span>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">
                        {newStock.toLocaleString()} {material.unit}
                      </span>
                      {formData.adjustmentType === 'increase' ? (
                        <TrendingUp className="w-5 h-5 text-green-600" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formData.adjustmentType === 'increase' ? '+' : '-'}{parseFloat(formData.quantity)} from {material.currentStock}
                    </div>
                  </div>
                </div>
                
                {/* New stock level warning */}
                {newStock <= material.reorderLevel && (
                  <div className="flex items-center gap-2 mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-yellow-800">
                    <AlertTriangle size={14} />
                    <span className="text-xs">
                      New stock level will be at or below reorder level
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Note */}
            <div>
              <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Adjustment
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                <textarea
                  id="note"
                  value={formData.note}
                  onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                  className="pl-10 pt-3 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Explain the reason for this stock adjustment..."
                  rows={3}
                  maxLength={500}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {formData.note.length}/500 characters
              </div>
            </div>

            {/* Quick Reasons */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Reasons
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  'Inventory count correction',
                  'Damaged materials removed',
                  'Supplier delivery received',
                  'Material returned to supplier',
                  'Loss/theft adjustment',
                  'Quality control rejection'
                ].map((reason, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, note: reason }))}
                    className="text-left p-2 text-xs bg-gray-50 hover:bg-gray-100 rounded border transition-colors"
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={loading}
              >
                <X size={16} />
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={loading || !isValidQuantity}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Adjusting...
                  </>
                ) : (
                  <>
                    {formData.adjustmentType === 'increase' ? (
                      <TrendingUp size={16} />
                    ) : (
                      <TrendingDown size={16} />
                    )}
                    Apply Adjustment
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StockAdjustmentModal;