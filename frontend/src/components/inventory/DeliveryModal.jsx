import React, { useState } from 'react';
import { X, Package, Calendar, FileText } from 'lucide-react';

const DeliveryModal = ({ procurement, onClose, onConfirm }) => {
  const [deliveryData, setDeliveryData] = useState({
    actual_quantity: procurement?.quantity || 0,
    delivery_date: new Date().toISOString().split('T')[0],
    notes: '',
    invoice_number: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(deliveryData);
  };

  const handleInputChange = (field, value) => {
    setDeliveryData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-gray-900/30 flex items-center justify-center z-50 transition-all duration-200">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-2xl transform transition-all duration-200 scale-100">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Package size={20} />
            Mark as Delivered
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Procurement Details */}
        <div className="bg-gray-50 p-3 rounded mb-4">
          <div className="text-sm text-gray-600">Procurement</div>
          <div className="font-semibold">{procurement?.material_name}</div>
          <div className="text-sm text-gray-600">
            Ordered: {procurement?.quantity} {procurement?.unit}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Actual Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Actual Quantity Delivered *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={deliveryData.actual_quantity}
              onChange={(e) => handleInputChange('actual_quantity', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter delivered quantity"
            />
          </div>

          {/* Delivery Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar size={16} className="inline mr-1" />
              Delivery Date *
            </label>
            <input
              type="date"
              required
              value={deliveryData.delivery_date}
              onChange={(e) => handleInputChange('delivery_date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Invoice Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FileText size={16} className="inline mr-1" />
              Invoice Number
            </label>
            <input
              type="text"
              value={deliveryData.invoice_number}
              onChange={(e) => handleInputChange('invoice_number', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter invoice number (optional)"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Delivery Notes
            </label>
            <textarea
              rows={3}
              value={deliveryData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Any additional notes about the delivery..."
            />
          </div>

          {/* Quantity Warning */}
          {deliveryData.actual_quantity !== procurement?.quantity && (
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
              <div className="text-yellow-800 text-sm">
                <strong>Note:</strong> Delivered quantity ({deliveryData.actual_quantity}) differs from ordered quantity ({procurement?.quantity}).
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              Mark Delivered
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeliveryModal;