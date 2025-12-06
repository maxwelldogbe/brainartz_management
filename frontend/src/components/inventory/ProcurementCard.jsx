import React from 'react';
import { 
  ShoppingCart, 
  Calendar, 
  Banknote, 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Truck,
  AlertTriangle,
  Users,
  Eye,
  Tag
} from 'lucide-react';

/**
 * ProcurementCard Component
 * Individual procurement order display card with status and actions
 */
const ProcurementCard = ({ 
  procurement, 
  onMarkDelivered, 
  onView,
  className = '' 
}) => {
  // Get status display properties
  const getStatusDisplay = () => {
    switch (procurement.status) {
      case 'pending':
        return {
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          icon: Clock,
          label: 'Pending Approval',
          badgeColor: 'bg-yellow-100 text-yellow-800'
        };
      case 'approved':
        return {
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          icon: CheckCircle,
          label: 'Approved',
          badgeColor: 'bg-blue-100 text-blue-800'
        };
      case 'ordered':
        return {
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          icon: ShoppingCart,
          label: 'Ordered',
          badgeColor: 'bg-purple-100 text-purple-800'
        };
      case 'delivered':
        return {
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          icon: Truck,
          label: 'Delivered',
          badgeColor: 'bg-green-100 text-green-800'
        };
      case 'cancelled':
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          icon: XCircle,
          label: 'Cancelled',
          badgeColor: 'bg-red-100 text-red-800'
        };
      default:
        return {
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          icon: Package,
          label: 'Unknown',
          badgeColor: 'bg-gray-100 text-gray-800'
        };
    }
  };

  // Check if delivery is overdue
  const isOverdue = () => {
    const expectedDate = new Date(procurement.expectedDelivery);
    const today = new Date();
    return expectedDate < today && procurement.status !== 'delivered' && procurement.status !== 'cancelled';
  };

  // Calculate days until/since expected delivery
  const getDaysFromExpected = () => {
    const expectedDate = new Date(procurement.expectedDelivery);
    const today = new Date();
    const diffTime = expectedDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 0) return `In ${diffDays} days`;
    return `${Math.abs(diffDays)} days overdue`;
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

  const statusDisplay = getStatusDisplay();
  const StatusIcon = statusDisplay.icon;
  const overdue = isOverdue();
  const daysFromExpected = getDaysFromExpected();

  return (
    <div className={`bg-white rounded-lg shadow-sm border hover:shadow-md transition-all duration-200 ${className}`}>
      {/* Header with status */}
      <div className={`p-4 rounded-t-lg ${statusDisplay.bgColor} ${statusDisplay.borderColor} border-b`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg">
              <ShoppingCart className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                Order #{procurement.id.slice(-8)}
              </h3>
              <p className="text-sm text-gray-600">
                {procurement.materials?.length || 0} items
              </p>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusDisplay.badgeColor}`}>
              <StatusIcon size={12} />
              {statusDisplay.label}
            </span>
            
            {procurement.urgency && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getUrgencyColor(procurement.urgency)}`}>
                {procurement.urgency.toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Supplier Info */}
        {procurement.supplier && (
          <div className="flex items-center gap-2 mb-4">
            <Users size={14} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-900">
              {procurement.supplier.name}
            </span>
          </div>
        )}

        {/* Key Information */}
        <div className="space-y-3 mb-4">
          {/* Expected Delivery */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Expected Delivery:</span>
            <div className="text-right">
              <div className={`text-sm font-medium ${overdue ? 'text-red-600' : 'text-gray-900'}`}>
                {new Date(procurement.expectedDelivery).toLocaleDateString()}
              </div>
              <div className={`text-xs ${overdue ? 'text-red-500' : 'text-gray-500'}`}>
                {daysFromExpected}
              </div>
            </div>
          </div>

          {/* Total Cost */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Total Cost:</span>
            <div className="flex items-center gap-1">
              <Banknote size={14} className="text-green-600" />
              <span className="font-semibold text-green-700">
                {procurement.totalCost?.toFixed(2) || '0.00'}
              </span>
            </div>
          </div>

          {/* Created Date */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Created:</span>
            <span className="text-sm text-gray-900">
              {new Date(procurement.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Materials Preview */}
        {procurement.materials && procurement.materials.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Materials:</h4>
            <div className="space-y-2">
              {procurement.materials.slice(0, 3).map((material, index) => (
                <div key={index} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                  <span className="text-gray-900">{material.name}</span>
                  <span className="text-gray-600">
                    {material.quantity} {material.unit}
                  </span>
                </div>
              ))}
              {procurement.materials.length > 3 && (
                <div className="text-xs text-gray-500 text-center">
                  +{procurement.materials.length - 3} more items
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notes Preview */}
        {procurement.notes && (
          <div className="mb-4 p-2 bg-gray-50 rounded">
            <div className="text-xs text-gray-600 mb-1">Notes:</div>
            <div className="text-sm text-gray-900 line-clamp-2">
              {procurement.notes}
            </div>
          </div>
        )}

        {/* Alerts */}
        {overdue && (
          <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle size={14} />
              <span className="text-xs font-medium">Delivery overdue</span>
            </div>
          </div>
        )}

        {procurement.urgency === 'urgent' && procurement.status !== 'delivered' && (
          <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle size={14} />
              <span className="text-xs font-medium">Urgent procurement</span>
            </div>
          </div>
        )}

        {/* Progress Timeline */}
        <div className="mb-4">
          <div className="text-xs text-gray-600 mb-2">Progress:</div>
          <div className="flex items-center gap-1">
            {['pending', 'approved', 'ordered', 'delivered'].map((status, index) => {
              const isActive = ['pending', 'approved', 'ordered', 'delivered'].indexOf(procurement.status) >= index;
              const isCurrent = procurement.status === status;
              
              return (
                <div key={status} className="flex items-center">
                  <div className={`w-3 h-3 rounded-full border-2 ${
                    isActive 
                      ? isCurrent 
                        ? 'bg-blue-600 border-blue-600' 
                        : 'bg-green-600 border-green-600'
                      : 'bg-gray-200 border-gray-300'
                  }`} />
                  {index < 3 && (
                    <div className={`w-8 h-0.5 ${
                      ['pending', 'approved', 'ordered', 'delivered'].indexOf(procurement.status) > index
                        ? 'bg-green-600'
                        : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Pending</span>
            <span>Approved</span>
            <span>Ordered</span>
            <span>Delivered</span>
          </div>
        </div>
      </div>

      {/* Actions Footer */}
      <div className="px-4 py-3 bg-gray-50 rounded-b-lg border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {onView && (
              <button
                onClick={() => onView(procurement)}
                className="flex items-center gap-1 px-2 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                title="View Details"
              >
                <Eye size={14} />
                <span className="hidden sm:inline">View</span>
              </button>
            )}
          </div>

          {procurement.status === 'ordered' && onMarkDelivered && (
            <button
              onClick={() => onMarkDelivered(procurement)}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-green-600 text-white hover:bg-green-700 rounded transition-colors"
              title="Mark as Delivered"
            >
              <Truck size={14} />
              <span>Mark Delivered</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProcurementCard;