import React, { useState, useEffect } from 'react';
import { Package, TrendingUp, TrendingDown, RotateCcw, Calendar, Search } from 'lucide-react';
import { stockMovementsAPI } from '../utils/services';

const StockMovements = () => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    dateFrom: '',
    dateTo: ''
  });

  useEffect(() => {
    loadMovements();
  }, [filters]);

  const loadMovements = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        search: filters.search,
        movement_type: filters.type,
        date_from: filters.dateFrom,
        date_to: filters.dateTo
      };
      
      console.log('🔍 Loading stock movements with params:', params);
      const response = await stockMovementsAPI.getAll(params);
      console.log('📦 Stock movements response:', response);
      
      const movementsData = Array.isArray(response) ? response : (response?.results || response?.data || []);
      setMovements(movementsData);
    } catch (error) {
      console.error('❌ Error loading stock movements:', error);
      setError('Failed to load stock movements. Please try again.');
      setMovements([]);
    } finally {
      setLoading(false);
    }
  };

  const getMovementIcon = (type) => {
    const icons = {
      'in': <TrendingUp className="w-5 h-5 text-green-600" />,
      'out': <TrendingDown className="w-5 h-5 text-red-600" />,
      'adjustment': <RotateCcw className="w-5 h-5 text-blue-600" />
    };
    return icons[type] || <Package className="w-5 h-5 text-gray-600" />;
  };

  const getMovementColor = (type) => {
    const colors = {
      'in': 'bg-green-50 text-green-800 border-green-200',
      'out': 'bg-red-50 text-red-800 border-red-200',
      'adjustment': 'bg-blue-50 text-blue-800 border-blue-200'
    };
    return colors[type] || 'bg-gray-50 text-gray-800 border-gray-200';
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Movements</h1>
          <p className="text-gray-600">Track inventory changes and adjustments</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Search materials..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Movement Type
            </label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="in">Stock In</option>
              <option value="out">Stock Out</option>
              <option value="adjustment">Adjustment</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date From
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date To
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 text-red-800 px-4 py-3 rounded-lg mb-6 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">×</button>
        </div>
      )}

      {/* Movements List */}
      <div className="bg-white rounded-lg shadow-sm">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600">Loading stock movements...</span>
          </div>
        ) : movements.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No stock movements found</h3>
            <p className="text-gray-600">
              {Object.values(filters).some(f => f) 
                ? 'Try adjusting your filters to see more movements.'
                : 'Stock movements will appear here as inventory changes.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Material
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance After
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {movements.map((movement) => (
                  <tr key={movement.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {new Date(movement.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(movement.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {movement.material_name || 'Unknown Material'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getMovementIcon(movement.movement_type)}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getMovementColor(movement.movement_type)}`}>
                          {movement.movement_type === 'in' ? 'Stock In' : 
                           movement.movement_type === 'out' ? 'Stock Out' : 
                           'Adjustment'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {movement.movement_type === 'out' ? '-' : '+'}{Math.abs(movement.quantity_changed || 0)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {movement.balance_after || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {movement.reference || movement.notes || '-'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockMovements;