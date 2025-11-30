import React, { useEffect } from 'react';
import { 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  DollarSign,
  Clock,
  CheckCircle,
  Truck,
  Eye,
  Plus,
  RefreshCw
} from 'lucide-react';
import LowStockAlertWidget from './LowStockAlertWidget';
import PendingProcurementsWidget from './PendingProcurementsWidget';
import { useInventory } from '../../hooks/inventory/useInventory';

/**
 * InventoryDashboard Component
 * Main dashboard showing inventory overview, alerts, and quick actions
 */
const InventoryDashboard = () => {
  const {
    materials,
    procurements,
    _dashboardData,
    _lowStockAlerts,
    _pendingProcurements,
    loading,
    error,
    fetchDashboardData,
    fetchMaterials,
    fetchProcurements,
    clearMessages
  } = useInventory();

  // Load dashboard data on mount
  useEffect(() => {
    fetchDashboardData();
    fetchMaterials({ limit: 5 });
    fetchProcurements({ limit: 5 });
  }, [fetchDashboardData, fetchMaterials, fetchProcurements]);

  // Calculate key metrics
  const metrics = {
    totalMaterials: materials.length,
    totalValue: materials.reduce((sum, m) => sum + (m.currentStock * m.unitCost), 0),
    lowStockCount: materials.filter(m => m.currentStock <= m.reorderLevel).length,
    outOfStockCount: materials.filter(m => m.currentStock === 0).length,
    pendingProcurements: procurements.filter(p => p.status === 'pending').length,
    totalProcurementValue: procurements.reduce((sum, p) => sum + (p.totalCost || 0), 0)
  };

  // Recent activity (mock data - would come from API)
  const recentActivity = [
    {
      id: 1,
      type: 'stock_adjustment',
      message: 'Stock adjusted for Steel Rods (+50 units)',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      icon: TrendingUp,
      color: 'text-green-600'
    },
    {
      id: 2,
      type: 'procurement_delivered',
      message: 'Procurement #PR-001 delivered from ABC Suppliers',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      icon: Truck,
      color: 'text-blue-600'
    },
    {
      id: 3,
      type: 'material_usage',
      message: 'Materials used for Job #JB-123',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      icon: Package,
      color: 'text-purple-600'
    },
    {
      id: 4,
      type: 'low_stock_alert',
      message: 'Low stock alert: Concrete Mix below reorder level',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
      icon: AlertTriangle,
      color: 'text-yellow-600'
    }
  ];

  const formatRelativeTime = (date) => {
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours === 1) return '1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    return `${diffInDays} days ago`;
  };

  if (loading && !materials.length) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Dashboard</h1>
          <p className="text-gray-600">Overview of your materials, stock levels, and procurement status</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              fetchDashboardData();
              fetchMaterials({ limit: 5 });
              fetchProcurements({ limit: 5 });
            }}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex justify-between items-center">
          <span>{error}</span>
          <button onClick={clearMessages} className="text-red-600 hover:text-red-800">
            ×
          </button>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Materials</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalMaterials}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Inventory Value</p>
              <p className="text-2xl font-bold text-gray-900">${metrics.totalValue.toFixed(0)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Low Stock Items</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.lowStockCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Out of Stock</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.outOfStockCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Widgets Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LowStockAlertWidget />
        <PendingProcurementsWidget />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Materials */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Materials</h2>
              <a href="/inventory/materials" className="text-blue-600 hover:text-blue-800 text-sm">
                View All
              </a>
            </div>
          </div>
          <div className="p-4">
            {materials.slice(0, 5).length > 0 ? (
              <div className="space-y-3">
                {materials.slice(0, 5).map(material => (
                  <div key={material.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded">
                        <Package className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{material.name}</div>
                        <div className="text-sm text-gray-500">{material.currentStock} {material.unit}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        material.currentStock === 0 
                          ? 'bg-red-100 text-red-800'
                          : material.currentStock <= material.reorderLevel
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {material.currentStock === 0 ? 'Out' : material.currentStock <= material.reorderLevel ? 'Low' : 'Good'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No materials yet</p>
                <a href="/inventory/materials" className="text-blue-600 hover:text-blue-800 text-sm">
                  Add first material
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Recent Procurements */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Procurements</h2>
              <a href="/inventory/procurements" className="text-blue-600 hover:text-blue-800 text-sm">
                View All
              </a>
            </div>
          </div>
          <div className="p-4">
            {procurements.slice(0, 5).length > 0 ? (
              <div className="space-y-3">
                {procurements.slice(0, 5).map(procurement => (
                  <div key={procurement.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded">
                        <ShoppingCart className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">#{procurement.id.slice(-6)}</div>
                        <div className="text-sm text-gray-500">{procurement.materials?.length || 0} items</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        procurement.status === 'pending' 
                          ? 'bg-yellow-100 text-yellow-800'
                          : procurement.status === 'delivered'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {procurement.status?.charAt(0).toUpperCase() + procurement.status?.slice(1)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        ${procurement.totalCost?.toFixed(0) || '0'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No procurements yet</p>
                <a href="/inventory/procurements" className="text-blue-600 hover:text-blue-800 text-sm">
                  Create first procurement
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {recentActivity.map(activity => {
                const ActivityIcon = activity.icon;
                return (
                  <div key={activity.id} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded">
                    <div className={`p-1.5 rounded-full bg-gray-100 ${activity.color}`}>
                      <ActivityIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{activity.message}</p>
                      <p className="text-xs text-gray-500">{formatRelativeTime(activity.timestamp)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <a href="/inventory/activity" className="text-blue-600 hover:text-blue-800 text-sm">
                View all activity →
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <a
            href="/inventory/materials/new"
            className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
          >
            <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200">
              <Plus className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Add Material</div>
              <div className="text-sm text-gray-500">Create new material</div>
            </div>
          </a>

          <a
            href="/inventory/procurements/new"
            className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors group"
          >
            <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200">
              <ShoppingCart className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">New Procurement</div>
              <div className="text-sm text-gray-500">Order materials</div>
            </div>
          </a>

          <a
            href="/inventory/reports"
            className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors group"
          >
            <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">View Reports</div>
              <div className="text-sm text-gray-500">Inventory analytics</div>
            </div>
          </a>

          <a
            href="/inventory/settings"
            className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-500 hover:bg-gray-50 transition-colors group"
          >
            <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200">
              <Package className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Manage Categories</div>
              <div className="text-sm text-gray-500">Setup & settings</div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
};

export default InventoryDashboard;