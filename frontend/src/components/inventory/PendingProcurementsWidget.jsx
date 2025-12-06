import React, { useState } from 'react';
import { 
  Clock, 
  ShoppingCart, 
  Calendar, 
  Banknote, 
  AlertTriangle,
  CheckCircle,
  Eye,
  Truck,
  RefreshCw,
  Package,
  Users
} from 'lucide-react';
import { useInventory } from '../../hooks/inventory/useInventory';

/**
 * PendingProcurementsWidget Component
 * Widget displaying pending procurement orders with quick actions
 */
const PendingProcurementsWidget = () => {
  const { 
    pendingProcurements, 
    loading, 
    fetchPendingProcurements,
    markProcurementDelivered 
  } = useInventory();

  const [showAll, setShowAll] = useState(false);

  // Sort by expected delivery date (overdue first, then by urgency)
  const sortedProcurements = [...pendingProcurements].sort((a, b) => {
    const aDate = new Date(a.expectedDelivery);
    const bDate = new Date(b.expectedDelivery);
    const today = new Date();
    
    // Check if overdue
    const aOverdue = aDate < today;
    const bOverdue = bDate < today;
    
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;
    
    // Sort by urgency if both are overdue or both are not overdue
    const urgencyOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    const aUrgency = urgencyOrder[a.urgency] || 3;
    const bUrgency = urgencyOrder[b.urgency] || 3;
    
    if (aUrgency !== bUrgency) {
      return aUrgency - bUrgency;
    }
    
    // Finally sort by expected delivery date
    return aDate - bDate;
  });

  const displayProcurements = showAll ? sortedProcurements : sortedProcurements.slice(0, 5);

  // Calculate days from expected delivery
  const getDaysFromExpected = (expectedDate) => {
    const expected = new Date(expectedDate);
    const today = new Date();
    const diffTime = expected - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return { text: 'Today', isOverdue: false, isToday: true };
    if (diffDays === 1) return { text: 'Tomorrow', isOverdue: false, isToday: false };
    if (diffDays === -1) return { text: 'Yesterday', isOverdue: true, isToday: false };
    if (diffDays > 0) return { text: `In ${diffDays} days`, isOverdue: false, isToday: false };
    return { text: `${Math.abs(diffDays)} days overdue`, isOverdue: true, isToday: false };
  };

  // Get status display
  const getStatusDisplay = (procurement) => {
    const daysInfo = getDaysFromExpected(procurement.expectedDelivery);
    
    if (daysInfo.isOverdue) {
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-800',
        badge: 'bg-red-100 text-red-800',
        icon: AlertTriangle,
        iconColor: 'text-red-600'
      };
    }
    
    if (daysInfo.isToday || procurement.urgency === 'urgent') {
      return {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-800',
        badge: 'bg-orange-100 text-orange-800',
        icon: Clock,
        iconColor: 'text-orange-600'
      };
    }
    
    return {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      badge: 'bg-blue-100 text-blue-800',
      icon: ShoppingCart,
      iconColor: 'text-blue-600'
    };
  };

  // Get urgency color
  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Quick mark as delivered
  const handleQuickDelivery = async (procurement) => {
    const confirmed = window.confirm(
      `Mark procurement #${procurement.id.slice(-8)} as delivered with expected quantities?`
    );
    
    if (confirmed) {
      // Create delivery data with expected quantities
      const deliveryData = {
        deliveryDate: new Date().toISOString().split('T')[0],
        materials: procurement.materials?.map(material => ({
          materialId: material.materialId,
          quantity: material.quantity,
          condition: 'good'
        })) || [],
        condition: 'good',
        notes: 'Quick delivery confirmation'
      };
      
      await markProcurementDelivered(procurement.id, deliveryData);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Pending Procurements</h2>
              <p className="text-sm text-gray-600">
                {pendingProcurements.length} orders awaiting delivery
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={fetchPendingProcurements}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Refresh procurements"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {pendingProcurements.length === 0 ? (
          <div className="text-center py-6">
            <div className="p-3 bg-green-100 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">All Caught Up!</h3>
            <p className="text-sm text-gray-500">No pending procurement orders</p>
            <a 
              href="/inventory/procurements/new" 
              className="inline-block mt-3 text-sm text-blue-600 hover:text-blue-800"
            >
              Create New Procurement
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {displayProcurements.map(procurement => {
              const statusDisplay = getStatusDisplay(procurement);
              const StatusIcon = statusDisplay.icon;
              const daysInfo = getDaysFromExpected(procurement.expectedDelivery);
              
              return (
                <div 
                  key={procurement.id} 
                  className={`p-3 rounded-lg border ${statusDisplay.bg} ${statusDisplay.border}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-1.5 bg-white rounded">
                        <StatusIcon className={`w-4 h-4 ${statusDisplay.iconColor}`} />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className={`font-medium ${statusDisplay.text}`}>
                            Order #{procurement.id.slice(-8)}
                          </h4>
                          
                          {procurement.urgency && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getUrgencyColor(procurement.urgency)}`}>
                              {procurement.urgency.toUpperCase()}
                            </span>
                          )}
                          
                          {daysInfo.isOverdue && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              OVERDUE
                            </span>
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          {/* Supplier */}
                          {procurement.supplier && (
                            <div className="flex items-center gap-2 text-sm">
                              <Users size={14} className="text-gray-400" />
                              <span className="text-gray-700">{procurement.supplier.name}</span>
                            </div>
                          )}
                          
                          {/* Expected Delivery */}
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar size={14} className="text-gray-400" />
                            <span className="text-gray-700">
                              {new Date(procurement.expectedDelivery).toLocaleDateString()}
                            </span>
                            <span className={`font-medium ${daysInfo.isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
                              ({daysInfo.text})
                            </span>
                          </div>
                          
                          {/* Total Cost */}
                          <div className="flex items-center gap-2 text-sm">
                            <DollarSign size={14} className="text-gray-400" />
                            <span className="text-gray-700">
                              GH₵{procurement.totalCost?.toFixed(2) || '0.00'}
                            </span>
                          </div>
                          
                          {/* Materials Count */}
                          <div className="flex items-center gap-2 text-sm">
                            <Package size={14} className="text-gray-400" />
                            <span className="text-gray-700">
                              {procurement.materials?.length || 0} materials
                            </span>
                          </div>
                        </div>
                        
                        {/* Materials Preview */}
                        {procurement.materials && procurement.materials.length > 0 && (
                          <div className="mt-2">
                            <div className="text-xs text-gray-600 mb-1">Materials:</div>
                            <div className="text-sm text-gray-700">
                              {procurement.materials.slice(0, 2).map((material, index) => (
                                <span key={index}>
                                  {material.name} ({material.quantity} {material.unit})
                                  {index < Math.min(procurement.materials.length - 1, 1) && ', '}
                                </span>
                              ))}
                              {procurement.materials.length > 2 && (
                                <span className="text-gray-500">
                                  {' '}+{procurement.materials.length - 2} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Quick Actions */}
                        <div className="flex items-center gap-2 mt-3">
                          <button
                            onClick={() => {
                              window.location.href = `/inventory/procurements/${procurement.id}`;
                            }}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-white hover:bg-gray-50 border border-gray-200 rounded transition-colors"
                          >
                            <Eye size={12} />
                            View
                          </button>
                          
                          {procurement.status === 'ordered' && (
                            <>
                              <button
                                onClick={() => handleQuickDelivery(procurement)}
                                className="flex items-center gap-1 px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                              >
                                <CheckCircle size={12} />
                                Quick Delivery
                              </button>
                              
                              <button
                                onClick={() => {
                                  window.location.href = `/inventory/procurements/${procurement.id}/delivery`;
                                }}
                                className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                              >
                                <Truck size={12} />
                                Full Delivery
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Show More/Less Button */}
            {pendingProcurements.length > 5 && (
              <div className="text-center pt-3 border-t border-gray-200">
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  {showAll 
                    ? `Show Less (${pendingProcurements.length - 5} more hidden)` 
                    : `Show All ${pendingProcurements.length} Procurements`
                  }
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Footer Summary */}
        {pendingProcurements.length > 0 && (
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              {sortedProcurements.filter(p => getDaysFromExpected(p.expectedDelivery).isOverdue).length} overdue,{' '}
              {sortedProcurements.filter(p => p.urgency === 'urgent' || p.urgency === 'high').length} high priority
            </div>
            
            <div className="flex items-center gap-2">
              <a
                href="/inventory/procurements?status=pending"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View All
              </a>
              <span className="text-gray-300">|</span>
              <a
                href="/inventory/procurements/new"
                className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors"
              >
                New Order
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingProcurementsWidget;