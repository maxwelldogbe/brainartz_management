import React, { useState, useEffect } from 'react';
import { X, Plus, AlertCircle } from 'lucide-react';
import { materialsAPI, pendingStockAdjustmentsAPI } from '../../utils/services';

const StaffStockAdditionForm = ({ onClose, onSuccess }) => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    material: '',
    quantity: '',
    reason: ''
  });

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      setLoadingMaterials(true);
      const response = await materialsAPI.getAll();
      setMaterials(Array.isArray(response) ? response : response.results || []);
    } catch (err) {
      console.error('Error loading materials:', err);
      setError('Failed to load materials');
    } finally {
      setLoadingMaterials(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.material || !formData.quantity || !formData.reason) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.quantity <= 0) {
      setError('Quantity must be greater than zero');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await pendingStockAdjustmentsAPI.create({
        material: parseInt(formData.material),
        quantity: parseInt(formData.quantity),
        reason: formData.reason
      });
      
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Error submitting request:', err);
      setError(err.response?.data?.detail || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-gray-900/30 flex items-center justify-center z-50 p-4 transition-all duration-200">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full transform transition-all duration-200 scale-100">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Plus className="h-5 w-5 text-blue-600" />
            Request Stock Addition
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Material Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Material <span className="text-red-500">*</span>
            </label>
            {loadingMaterials ? (
              <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
            ) : (
              <select
                value={formData.material}
                onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select material</option>
                {materials.map((material) => (
                  <option key={material.id} value={material.id}>
                    {material.name} ({material.unit})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter quantity"
              min="1"
              required
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason for Addition <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Unrecorded purchase, Found inventory, etc."
              rows="3"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Explain why this stock needs to be added (will be reviewed by admin)
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || loadingMaterials}
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StaffStockAdditionForm;
