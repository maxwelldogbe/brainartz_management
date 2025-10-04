import React, { useState, useEffect } from 'react';
import { BarChart3, FileText, Download, Calendar, TrendingUp, TrendingDown, Package, AlertTriangle } from 'lucide-react';
import { materialsAPI, stockMovementsAPI, procurementsAPI } from '../utils/services';

const InventoryReports = () => {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState({
    overview: {},
    lowStockItems: [],
    topUsedMaterials: [],
    recentMovements: [],
    procurementStats: {}
  });
  
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0] // today
  });

  useEffect(() => {
    loadReportData();
  }, [dateRange]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      console.log('📊 Loading inventory reports...');

      // Load multiple data sources in parallel
      const [materialsResponse, movementsResponse, procurementsResponse] = await Promise.all([
        materialsAPI.getAll(),
        stockMovementsAPI.getAll({ 
          date_from: dateRange.startDate, 
          date_to: dateRange.endDate 
        }),
        procurementsAPI.getAll()
      ]);

      const materials = Array.isArray(materialsResponse) ? materialsResponse : (materialsResponse?.results || []);
      const movements = Array.isArray(movementsResponse) ? movementsResponse : (movementsResponse?.results || []);
      const procurements = Array.isArray(procurementsResponse) ? procurementsResponse : (procurementsResponse?.results || []);

      // Calculate overview stats
      const totalMaterials = materials.length;
      const lowStockItems = materials.filter(m => (m.current_stock || 0) <= (m.reorder_level || 0));
      const outOfStockItems = materials.filter(m => (m.current_stock || 0) === 0);
      const totalValue = materials.reduce((sum, m) => sum + ((m.current_stock || 0) * (m.unit_cost || 0)), 0);

      // Calculate procurement stats
      const totalProcurements = procurements.length;
      const pendingProcurements = procurements.filter(p => p.status === 'pending').length;
      const totalProcurementValue = procurements.reduce((sum, p) => sum + (p.total_cost || 0), 0);

      // Get top used materials from movements
      const materialUsage = {};
      movements.filter(m => m.movement_type === 'out').forEach(movement => {
        const materialName = movement.material_name || 'Unknown';
        materialUsage[materialName] = (materialUsage[materialName] || 0) + Math.abs(movement.quantity_changed || 0);
      });
      
      const topUsedMaterials = Object.entries(materialUsage)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([name, quantity]) => ({ name, quantity }));

      setReportData({
        overview: {
          totalMaterials,
          lowStockCount: lowStockItems.length,
          outOfStockCount: outOfStockItems.length,
          totalValue,
          totalMovements: movements.length,
          stockInMovements: movements.filter(m => m.movement_type === 'in').length,
          stockOutMovements: movements.filter(m => m.movement_type === 'out').length
        },
        lowStockItems: lowStockItems.slice(0, 20), // Top 20 low stock items
        topUsedMaterials,
        recentMovements: movements.slice(0, 10), // Recent 10 movements
        procurementStats: {
          totalProcurements,
          pendingProcurements,
          totalValue: totalProcurementValue
        }
      });

    } catch (error) {
      console.error('❌ Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    // Simple CSV export
    const csvData = [
      ['Inventory Report', `Generated on ${new Date().toLocaleString()}`],
      ['Date Range', `${dateRange.startDate} to ${dateRange.endDate}`],
      [''],
      ['Overview'],
      ['Total Materials', reportData.overview.totalMaterials],
      ['Low Stock Items', reportData.overview.lowStockCount],
      ['Out of Stock Items', reportData.overview.outOfStockCount],
      ['Total Inventory Value', `$${reportData.overview.totalValue?.toFixed(2)}`],
      ['Total Movements', reportData.overview.totalMovements],
      [''],
      ['Low Stock Items'],
      ['Material Name', 'Current Stock', 'Reorder Level', 'Status'],
      ...reportData.lowStockItems.map(item => [
        item.name,
        item.current_stock || 0,
        item.reorder_level || 0,
        (item.current_stock || 0) === 0 ? 'Out of Stock' : 'Low Stock'
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-report-${dateRange.startDate}-${dateRange.endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading inventory reports...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Reports</h1>
          <p className="text-gray-600">Analytics and insights for inventory management</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Date Range Selector */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          
          <button
            onClick={exportReport}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Materials</p>
              <p className="text-2xl font-bold text-gray-900">{reportData.overview.totalMaterials}</p>
            </div>
            <Package className="text-blue-500" size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Low Stock Items</p>
              <p className="text-2xl font-bold text-red-600">{reportData.overview.lowStockCount}</p>
            </div>
            <AlertTriangle className="text-red-500" size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Value</p>
              <p className="text-2xl font-bold text-green-600">${reportData.overview.totalValue?.toFixed(2)}</p>
            </div>
            <TrendingUp className="text-green-500" size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Stock Movements</p>
              <p className="text-2xl font-bold text-blue-600">{reportData.overview.totalMovements}</p>
            </div>
            <BarChart3 className="text-blue-500" size={24} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Low Stock Items */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Low Stock Alert
            </h2>
          </div>
          <div className="p-6">
            {reportData.lowStockItems.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No low stock items found</p>
            ) : (
              <div className="space-y-3">
                {reportData.lowStockItems.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <div className="font-medium text-gray-900">{item.name}</div>
                      <div className="text-sm text-gray-500">
                        Current: {item.current_stock || 0} | Reorder at: {item.reorder_level || 0}
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      (item.current_stock || 0) === 0 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {(item.current_stock || 0) === 0 ? 'Out of Stock' : 'Low Stock'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top Used Materials */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-blue-500" />
              Most Used Materials
            </h2>
          </div>
          <div className="p-6">
            {reportData.topUsedMaterials.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No usage data available</p>
            ) : (
              <div className="space-y-3">
                {reportData.topUsedMaterials.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div className="font-medium text-gray-900">{item.name}</div>
                    <div className="text-sm text-gray-600">{item.quantity} used</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Stock Movements */}
      <div className="mt-8 bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-500" />
            Recent Stock Movements
          </h2>
        </div>
        <div className="overflow-x-auto">
          {reportData.recentMovements.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No recent movements found</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.recentMovements.map((movement, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(movement.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {movement.material_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        movement.movement_type === 'in' ? 'bg-green-100 text-green-800' : 
                        movement.movement_type === 'out' ? 'bg-red-100 text-red-800' : 
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {movement.movement_type === 'in' ? 'Stock In' : 
                         movement.movement_type === 'out' ? 'Stock Out' : 
                         'Adjustment'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {movement.movement_type === 'out' ? '-' : '+'}{Math.abs(movement.quantity_changed || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {movement.reference || movement.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryReports;