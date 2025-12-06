import React, { useState, useEffect } from 'react';
/* eslint-disable react-hooks/exhaustive-deps */
import { Link } from 'react-router-dom';
import { Plus, Package, AlertTriangle, TrendingUp, ShoppingCart, Activity, Clock, Users } from 'lucide-react';
import { materialsAPI, procurementsAPI, stockMovementsAPI, materialUsageAPI } from '../utils/services';

const Inventory = () => {
  const [materials, setMaterials] = useState([]);
  const [recentProcurements, setRecentProcurements] = useState([]);
  const [recentMovements, setRecentMovements] = useState([]);
  const [recentUsages, setRecentUsages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMaterials: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    totalValue: 0,
    pendingProcurements: 0,
    recentMovements: 0,
    monthlyUsage: 0
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      
      // Load all data in parallel
      await Promise.all([
        loadMaterials(),
        loadStats(),
        loadRecentProcurements(),
        loadRecentMovements(),
        loadRecentUsages()
      ]);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const loadMaterials = async () => {
    try {
      const response = await materialsAPI.getAll({ limit: 10 });
      
      const materialsData = Array.isArray(response) ? response : (response?.results || response?.data || []);
      setMaterials(materialsData);
    } catch (error) {
      setMaterials([]);
    }
  };

  const loadStats = async () => {
    try {
      const response = await materialsAPI.getStatistics();
      
      // Handle the new statistics structure
      if (response && typeof response === 'object') {
        setStats(prev => ({
          ...prev,
          totalMaterials: response.total_materials || 0,
          lowStockItems: response.low_stock_count || 0,
          outOfStockItems: response.out_of_stock_count || 0,
          totalValue: response.total_stock_value || 0,
          recentMovements: response.recent_movements_count || 0,
          monthlyUsage: response.monthly_usage || 0
        }));
      }
    } catch (error) {
    }
  };

  const loadRecentProcurements = async () => {
    try {
      const response = await procurementsAPI.getAll({ limit: 5, ordering: '-created_at' });
      const procurementsData = Array.isArray(response) ? response : (response?.results || []);
      setRecentProcurements(procurementsData);
      
      // Count pending procurements
      const pendingCount = procurementsData.filter(p => p.status === 'pending').length;
      setStats(prev => ({ ...prev, pendingProcurements: pendingCount }));
    } catch (error) {
    }
  };

  const loadRecentMovements = async () => {
    try {
      const response = await stockMovementsAPI.getAll({ limit: 5, ordering: '-created_at' });
      const movementsData = Array.isArray(response) ? response : (response?.results || []);
      setRecentMovements(movementsData);
    } catch (error) {
    }
  };

  const loadRecentUsages = async () => {
    try {
      const response = await materialUsageAPI.getAll({ ordering: '-taken_at' });
      const usagesData = Array.isArray(response) ? response.slice(0, 5) : (response?.results?.slice(0, 5) || []);
      setRecentUsages(usagesData);
    } catch (error) {
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600">Manage materials, stock levels, and procurement</p>
        </div>
        <Link
          to="/portal/inventory/materials/new"
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
        >
          <Plus size={20} />
          Add Material
        </Link>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Materials</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalMaterials}</p>
            </div>
            <Package className="text-blue-500" size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Low Stock Items</p>
              <p className="text-2xl font-bold text-red-600">{stats.lowStockItems}</p>
            </div>
            <AlertTriangle className="text-red-500" size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Pending Procurements</p>
              <p className="text-2xl font-bold text-orange-600">{stats.pendingProcurements}</p>
            </div>
            <Clock className="text-orange-500" size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Value</p>
              <p className="text-2xl font-bold text-green-600">
                ₵{stats.totalValue?.toLocaleString() || '0'}
              </p>
            </div>
            <TrendingUp className="text-green-500" size={24} />
          </div>
        </div>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600">{stats.outOfStockItems}</p>
            </div>
            <Package className="text-red-500" size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Recent Movements</p>
              <p className="text-2xl font-bold text-blue-600">{stats.recentMovements}</p>
            </div>
            <Activity className="text-blue-500" size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Monthly Usage</p>
              <p className="text-2xl font-bold text-purple-600">{stats.monthlyUsage}</p>
            </div>
            <Users className="text-purple-500" size={24} />
          </div>
        </div>
      </div>

      {/* Enhanced Quick Actions with Procurement Functions */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <Link
          to="/portal/inventory/materials"
          className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center"
        >
          <Package className="mx-auto mb-2 text-blue-500" size={24} />
          <p className="font-semibold">Materials</p>
          <p className="text-sm text-gray-600">View all materials</p>
        </Link>

        <Link
          to="/portal/inventory/procurements"
          className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center"
        >
          <ShoppingCart className="mx-auto mb-2 text-green-500" size={24} />
          <p className="font-semibold">Procurements</p>
          <p className="text-sm text-gray-600">Manage orders</p>
        </Link>

        <Link
          to="/portal/inventory/procurement-requests"
          className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center"
        >
          <Plus className="mx-auto mb-2 text-orange-500" size={24} />
          <p className="font-semibold">Request Materials</p>
          <p className="text-sm text-gray-600">Request procurement</p>
        </Link>

        <Link
          to="/portal/inventory/stock-movements"
          className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center"
        >
          <TrendingUp className="mx-auto mb-2 text-purple-500" size={24} />
          <p className="font-semibold">Stock Movements</p>
          <p className="text-sm text-gray-600">Track changes</p>
        </Link>

        <Link
          to="/portal/inventory/reports"
          className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center"
        >
          <AlertTriangle className="mx-auto mb-2 text-red-500" size={24} />
          <p className="font-semibold">Reports</p>
          <p className="text-sm text-gray-600">Analytics & alerts</p>
        </Link>
      </div>

      {/* Dashboard Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Materials */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Recent Materials</h2>
              <Link to="/portal/inventory/materials" className="text-blue-500 hover:text-blue-700 text-sm">
                View All →
              </Link>
            </div>
          </div>
          {materials.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No materials yet</h3>
              <p className="text-gray-600 mb-6">Get started by adding your first material.</p>
              <Link
                to="/portal/inventory/materials"
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
              >
                Add Material
              </Link>
            </div>
          ) : (
            <div className="p-6">
              <div className="space-y-3">
                {materials.slice(0, 5).map((material) => {
                  const isLowStock = (material.current_stock || 0) <= (material.reorder_level || 0);
                  return (
                    <div key={material.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{material.name}</p>
                        <p className="text-sm text-gray-600">
                          {material.current_stock || 0} {material.unit || 'units'}
                        </p>
                      </div>
                      <div className="text-right">
                        {isLowStock ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            In Stock
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Recent Procurements */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Recent Procurements</h2>
              <Link to="/portal/inventory/procurements" className="text-blue-500 hover:text-blue-700 text-sm">
                View All →
              </Link>
            </div>
          </div>
          {recentProcurements.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No procurements yet</h3>
              <p className="text-gray-600">Start ordering materials.</p>
            </div>
          ) : (
            <div className="p-6">
              <div className="space-y-3">
                {recentProcurements.map((procurement) => (
                  <div key={procurement.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{procurement.material_name || 'N/A'}</p>
                      <p className="text-sm text-gray-600">
                        Qty: {procurement.quantity_ordered} • ₵{procurement.total_cost}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      procurement.status === 'delivered' 
                        ? 'bg-green-100 text-green-800'
                        : procurement.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {procurement.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activities Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Stock Movements */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Recent Stock Movements</h2>
              <Link to="/portal/inventory/stock-movements" className="text-blue-500 hover:text-blue-700 text-sm">
                View All →
              </Link>
            </div>
          </div>
          {recentMovements.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No movements yet</h3>
              <p className="text-gray-600">Stock movements will appear here.</p>
            </div>
          ) : (
            <div className="p-6">
              <div className="space-y-3">
                {recentMovements.map((movement) => (
                  <div key={movement.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{movement.material?.name || 'Material'}</p>
                      <p className="text-sm text-gray-600">
                        {movement.movement_type === 'inflow' ? '+' : '-'}{movement.quantity}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      movement.movement_type === 'inflow'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {movement.movement_type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recent Material Usage */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Recent Material Usage</h2>
          </div>
          {recentUsages.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No usage yet</h3>
              <p className="text-gray-600">Material usage will appear here.</p>
            </div>
          ) : (
            <div className="p-6">
              <div className="space-y-3">
                {recentUsages.map((usage) => (
                  <div key={usage.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{usage.material_name || 'Material'}</p>
                      <p className="text-sm text-gray-600">
                        Taken: {usage.quantity_taken} {usage.material_unit} • By: {usage.taken_by_name}
                      </p>
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(usage.taken_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inventory;