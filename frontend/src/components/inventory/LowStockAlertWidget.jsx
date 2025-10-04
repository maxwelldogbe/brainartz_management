import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Package, 
  TrendingDown, 
  ShoppingCart, 
  Eye, 
  Settings,
  RefreshCw,
  X
} from 'lucide-react';
import { useInventory } from '../../hooks/inventory/useInventory';

/**
 * LowStockAlertWidget Component
 * Widget displaying low stock alerts with material details and quick actions
 */
const LowStockAlertWidget = () => {
  const { 
    lowStockAlerts, 
    loading, 
    fetchLowStockAlerts,
    materials 
  } = useInventory();

  const [dismissed, setDismissed] = useState(new Set());
  const [showAll, setShowAll] = useState(false);

  // Filter out dismissed alerts
  const visibleAlerts = lowStockAlerts.filter(alert => !dismissed.has(alert.id));
  const displayAlerts = showAll ? visibleAlerts : visibleAlerts.slice(0, 5);

  // Handle dismiss alert
  const handleDismissAlert = (alertId) => {
    setDismissed(prev => new Set([...prev, alertId]));
  };

  // Calculate urgency level
  const getUrgencyLevel = (material) => {
    if (material.currentStock === 0) return 'critical';
    if (material.currentStock < material.reorderLevel * 0.5) return 'high';
    return 'medium';
  };

  // Get urgency color
  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'critical':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          icon: 'text-red-600',
          badge: 'bg-red-100 text-red-800'
        };
      case 'high':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          text: 'text-orange-800',
          icon: 'text-orange-600',
          badge: 'bg-orange-100 text-orange-800'
        };
      default:
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-800',
          icon: 'text-yellow-600',
          badge: 'bg-yellow-100 text-yellow-800'
        };
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Low Stock Alerts</h2>
              <p className="text-sm text-gray-600">
                {visibleAlerts.length} materials need attention
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={fetchLowStockAlerts}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Refresh alerts"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {visibleAlerts.length === 0 ? (
          <div className="text-center py-6">
            <div className="p-3 bg-green-100 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
              <Package className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">All Good!</h3>
            <p className="text-sm text-gray-500">No materials are running low on stock</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayAlerts.map(material => {
              const urgency = getUrgencyLevel(material);
              const colors = getUrgencyColor(urgency);
              
              return (
                <div 
                  key={material.id} 
                  className={`p-3 rounded-lg border ${colors.bg} ${colors.border}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-1.5 bg-white rounded">
                        {material.currentStock === 0 ? (
                          <TrendingDown className={`w-4 h-4 ${colors.icon}`} />
                        ) : (
                          <AlertTriangle className={`w-4 h-4 ${colors.icon}`} />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`font-medium ${colors.text}`}>
                            {material.name}
                          </h4>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors.badge}`}>
                            {urgency.toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Current Stock:</span>
                            <span className={`font-medium ${colors.text}`}>
                              {material.currentStock} {material.unit}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Reorder Level:</span>
                            <span className="text-gray-700">
                              {material.reorderLevel} {material.unit}
                            </span>
                          </div>
                          
                          {material.supplier && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Supplier:</span>
                              <span className="text-gray-700">{material.supplier.name}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Stock Level Bar */}
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                            <span>Stock Level</span>
                            <span>
                              {((material.currentStock / (material.reorderLevel * 2)) * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="w-full bg-white rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                material.currentStock === 0 
                                  ? 'bg-red-500' 
                                  : material.currentStock < material.reorderLevel * 0.5
                                  ? 'bg-orange-500'
                                  : 'bg-yellow-500'
                              }`}
                              style={{ 
                                width: `${Math.min(100, (material.currentStock / (material.reorderLevel * 2)) * 100)}%` 
                              }}
                            />
                          </div>
                        </div>
                        
                        {/* Quick Actions */}
                        <div className="flex items-center gap-2 mt-3">
                          <button
                            onClick={() => {
                              // Navigate to material details or open procurement modal
                              window.location.href = `/inventory/materials/${material.id}`;
                            }}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-white hover:bg-gray-50 border border-gray-200 rounded transition-colors"
                          >
                            <Eye size={12} />
                            View
                          </button>
                          
                          <button
                            onClick={() => {
                              // Open procurement form with this material pre-selected
                              window.location.href = `/inventory/procurements/new?material=${material.id}`;
                            }}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                          >
                            <ShoppingCart size={12} />
                            Order
                          </button>
                          
                          <button
                            onClick={() => {
                              // Open stock adjustment modal
                              window.location.href = `/inventory/materials/${material.id}/adjust`;
                            }}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                          >
                            <Settings size={12} />
                            Adjust
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Dismiss Button */}
                    <button
                      onClick={() => handleDismissAlert(material.id)}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors ml-2"
                      title="Dismiss alert"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
            
            {/* Show More/Less Button */}
            {visibleAlerts.length > 5 && (
              <div className="text-center pt-3 border-t border-gray-200">
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  {showAll 
                    ? `Show Less (${visibleAlerts.length - 5} more hidden)` 
                    : `Show All ${visibleAlerts.length} Alerts`
                  }
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Footer Actions */}
        {visibleAlerts.length > 0 && (
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              {visibleAlerts.filter(m => m.currentStock === 0).length} out of stock,{' '}
              {visibleAlerts.filter(m => m.currentStock > 0 && m.currentStock <= m.reorderLevel).length} low stock
            </div>
            
            <div className="flex items-center gap-2">
              <a
                href="/inventory/reports/low-stock"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View Report
              </a>
              <span className="text-gray-300">|</span>
              <a
                href="/inventory/procurements/new?lowStock=true"
                className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors"
              >
                Create Bulk Order
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LowStockAlertWidget;