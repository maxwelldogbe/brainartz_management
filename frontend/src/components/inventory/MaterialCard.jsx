import React from 'react';
import { 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  TrendingDown, 
  Edit, 
  Trash2, 
  Settings,
  MoreVertical,
  Banknote,
  Tag
} from 'lucide-react';

/**
 * MaterialCard Component
 * Individual material display card with stock indicators and actions
 */
const MaterialCard = ({ 
  material, 
  onEdit, 
  onDelete, 
  onAdjustStock,
  className = '' 
}) => {
  // Calculate stock level status
  const getStockLevel = () => {
    if (material.currentStock === 0) return 'out';
    if (material.currentStock <= material.reorderLevel) return 'low';
    if (material.currentStock <= material.reorderLevel * 2) return 'medium';
    return 'high';
  };

  // Get stock level colors and icons
  const getStockDisplay = () => {
    const level = getStockLevel();
    
    switch (level) {
      case 'out':
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          icon: TrendingDown,
          label: 'Out of Stock',
          badgeColor: 'bg-red-100 text-red-800'
        };
      case 'low':
        return {
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          icon: AlertTriangle,
          label: 'Low Stock',
          badgeColor: 'bg-yellow-100 text-yellow-800'
        };
      case 'medium':
        return {
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          icon: Package,
          label: 'Medium Stock',
          badgeColor: 'bg-blue-100 text-blue-800'
        };
      default:
        return {
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          icon: CheckCircle,
          label: 'In Stock',
          badgeColor: 'bg-green-100 text-green-800'
        };
    }
  };

  const stockDisplay = getStockDisplay();
  const StockIcon = stockDisplay.icon;
  const stockLevel = getStockLevel();
  const totalValue = material.currentStock * material.unitCost;

  return (
    <div className={`bg-white rounded-lg shadow-sm border hover:shadow-md transition-all duration-200 ${className}`}>
      {/* Header with status indicator */}
      <div className={`p-4 rounded-t-lg ${stockDisplay.bgColor} ${stockDisplay.borderColor} border-b`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-white`}>
              <Package className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 line-clamp-2">{material.name}</h3>
              <p className="text-sm text-gray-600">{material.unit}</p>
            </div>
          </div>
          
          {/* Status Badge */}
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${stockDisplay.badgeColor}`}>
            <StockIcon size={12} />
            {stockLevel === 'out' ? 'Out' : stockLevel === 'low' ? 'Low' : 'Good'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Category */}
        {material.category && (
          <div className="flex items-center gap-2 mb-3">
            <Tag size={14} className="text-gray-400" />
            <span className="text-sm text-gray-600">{material.category.name}</span>
          </div>
        )}

        {/* Description */}
        {material.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {material.description}
          </p>
        )}

        {/* Stock Information */}
        <div className="space-y-3 mb-4">
          {/* Current Stock */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Current Stock:</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">
                {material.currentStock.toLocaleString()}
              </span>
              <span className="text-xs text-gray-500">{material.unit}</span>
            </div>
          </div>

          {/* Reorder Level */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Reorder Level:</span>
            <span className="text-sm text-gray-900">{material.reorderLevel}</span>
          </div>

          {/* Unit Cost */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Unit Cost:</span>
            <div className="flex items-center gap-1">
              <Banknote size={14} className="text-gray-400" />
              <span className="font-medium text-gray-900">
                {material.unitCost.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Total Value */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <span className="text-sm font-medium text-gray-700">Total Value:</span>
            <div className="flex items-center gap-1">
              <Banknote size={14} className="text-green-600" />
              <span className="font-semibold text-green-700">
                {totalValue.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Stock Level Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600">Stock Level</span>
            <span className="text-xs text-gray-500">
              {((material.currentStock / (material.reorderLevel * 3)) * 100).toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                stockLevel === 'out' 
                  ? 'bg-red-500' 
                  : stockLevel === 'low'
                  ? 'bg-yellow-500'
                  : stockLevel === 'medium'
                  ? 'bg-blue-500'
                  : 'bg-green-500'
              }`}
              style={{ 
                width: `${Math.min(100, (material.currentStock / (material.reorderLevel * 3)) * 100)}%` 
              }}
            />
          </div>
        </div>

        {/* Supplier Info */}
        {material.supplier && (
          <div className="mb-4 p-2 bg-gray-50 rounded">
            <div className="text-xs text-gray-600">Primary Supplier:</div>
            <div className="text-sm font-medium text-gray-900">{material.supplier.name}</div>
          </div>
        )}

        {/* Alerts */}
        {stockLevel === 'out' && (
          <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <TrendingDown size={14} />
              <span className="text-xs font-medium">Out of stock - requires immediate attention</span>
            </div>
          </div>
        )}

        {stockLevel === 'low' && (
          <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle size={14} />
              <span className="text-xs font-medium">Low stock - consider reordering</span>
            </div>
          </div>
        )}
      </div>

      {/* Actions Footer */}
      <div className="px-4 py-3 bg-gray-50 rounded-b-lg border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="flex items-center gap-1 px-2 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
              title="Edit Material"
            >
              <Edit size={14} />
              <span className="hidden sm:inline">Edit</span>
            </button>
            
            <button
              onClick={onAdjustStock}
              className="flex items-center gap-1 px-2 py-1 text-sm text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors"
              title="Adjust Stock"
            >
              <Settings size={14} />
              <span className="hidden sm:inline">Adjust</span>
            </button>
          </div>

          <button
            onClick={onDelete}
            className="flex items-center gap-1 px-2 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
            title="Delete Material"
          >
            <Trash2 size={14} />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>
      </div>

      {/* Quick Stats Overlay (optional hover effect) */}
      <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-5 transition-all duration-200 rounded-lg pointer-events-none" />
    </div>
  );
};

export default MaterialCard;