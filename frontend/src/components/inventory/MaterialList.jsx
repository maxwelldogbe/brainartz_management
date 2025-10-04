import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  Edit, 
  Trash2,
  TrendingUp,
  TrendingDown,
  MoreVertical,
  Eye,
  Settings
} from 'lucide-react';
import MaterialCard from './MaterialCard';
import MaterialForm from './MaterialForm';
import StockAdjustmentModal from './StockAdjustmentModal';
import Modal from '../Modal';
import { useInventory } from '../../hooks/inventory/useInventory';

/**
 * MaterialList Component
 * Displays and manages the list of materials with search, filtering, and actions
 */
const MaterialList = () => {
  const {
    materials,
    categories,
    loading,
    error,
    materialsFilters,
    materialsPage,
    totalPages,
    updateMaterialsFilters,
    setMaterialsPage,
    deleteMaterial,
    clearMessages
  } = useInventory();

  // Local state for modals and UI
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStockAdjustModal, setShowStockAdjustModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [sortBy, setSortBy] = useState('name'); // 'name' | 'stock' | 'category'
  const [sortOrder, setSortOrder] = useState('asc');

  // Handle search input
  const handleSearchChange = (e) => {
    updateMaterialsFilters({ search: e.target.value });
  };

  // Handle category filter
  const handleCategoryFilter = (categoryId) => {
    updateMaterialsFilters({ category: categoryId });
  };

  // Handle low stock filter
  const handleLowStockFilter = () => {
    updateMaterialsFilters({ lowStock: !materialsFilters.lowStock });
  };

  // Handle sort
  const handleSort = (field) => {
    const newOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(field);
    setSortOrder(newOrder);
  };

  // Handle edit material
  const handleEditMaterial = (material) => {
    setSelectedMaterial(material);
    setShowEditModal(true);
  };

  // Handle stock adjustment
  const handleStockAdjustment = (material) => {
    setSelectedMaterial(material);
    setShowStockAdjustModal(true);
  };

  // Handle delete material
  const handleDeleteMaterial = async (materialId) => {
    if (window.confirm('Are you sure you want to delete this material?')) {
      await deleteMaterial(materialId);
    }
  };

  // Get stock level indicator
  const getStockLevel = (material) => {
    if (material.currentStock === 0) return 'out';
    if (material.currentStock <= material.reorderLevel) return 'low';
    if (material.currentStock <= material.reorderLevel * 2) return 'medium';
    return 'high';
  };

  // Sort materials
  const sortedMaterials = [...materials].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'stock':
        comparison = a.currentStock - b.currentStock;
        break;
      case 'category':
        comparison = (a.category?.name || '').localeCompare(b.category?.name || '');
        break;
      default:
        comparison = 0;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Calculate statistics
  const stats = {
    total: materials.length,
    lowStock: materials.filter(m => getStockLevel(m) === 'low').length,
    outOfStock: materials.filter(m => getStockLevel(m) === 'out').length,
    totalValue: materials.reduce((sum, m) => sum + (m.currentStock * m.unitCost), 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Materials Inventory</h1>
          <p className="text-gray-600">Manage your materials and stock levels</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          Add Material
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Materials</p>
              <p className="text-xl font-semibold">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Low Stock</p>
              <p className="text-xl font-semibold">{stats.lowStock}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Out of Stock</p>
              <p className="text-xl font-semibold">{stats.outOfStock}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Value</p>
              <p className="text-xl font-semibold">${stats.totalValue.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search materials..."
              value={materialsFilters.search}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Category Filter */}
          <div className="min-w-48">
            <select
              value={materialsFilters.category}
              onChange={(e) => handleCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Low Stock Filter */}
          <button
            onClick={handleLowStockFilter}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              materialsFilters.lowStock
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            <AlertTriangle size={16} />
            Low Stock Only
          </button>

          {/* View Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white shadow-sm text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded transition-colors ${
                viewMode === 'list'
                  ? 'bg-white shadow-sm text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              List
            </button>
          </div>

          {/* Sort Options */}
          <div className="min-w-40">
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="stock-asc">Stock Low-High</option>
              <option value="stock-desc">Stock High-Low</option>
              <option value="category-asc">Category A-Z</option>
              <option value="category-desc">Category Z-A</option>
            </select>
          </div>
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

      {/* Materials Display */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading materials...</span>
        </div>
      ) : sortedMaterials.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No materials found</h3>
          <p className="text-gray-600 mb-6">
            {materialsFilters.search || materialsFilters.category || materialsFilters.lowStock
              ? 'Try adjusting your filters to see more materials.'
              : 'Get started by adding your first material.'}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add First Material
          </button>
        </div>
      ) : (
        <>
          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedMaterials.map(material => (
                <MaterialCard
                  key={material.id}
                  material={material}
                  onEdit={() => handleEditMaterial(material)}
                  onDelete={() => handleDeleteMaterial(material.id)}
                  onAdjustStock={() => handleStockAdjustment(material)}
                />
              ))}
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th 
                        onClick={() => handleSort('name')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        Material Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th 
                        onClick={() => handleSort('stock')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        Stock Level
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit Cost
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedMaterials.map(material => {
                      const stockLevel = getStockLevel(material);
                      return (
                        <tr key={material.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {material.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {material.unit}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {material.category?.name || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">
                                {material.currentStock}
                              </span>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                stockLevel === 'out' 
                                  ? 'bg-red-100 text-red-800'
                                  : stockLevel === 'low'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : stockLevel === 'medium'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {stockLevel === 'out' ? 'Out' : stockLevel === 'low' ? 'Low' : 'Good'}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              Reorder at: {material.reorderLevel}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${material.unitCost.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {stockLevel === 'out' ? (
                              <span className="flex items-center gap-1 text-red-600">
                                <TrendingDown size={14} />
                                Out of Stock
                              </span>
                            ) : stockLevel === 'low' ? (
                              <span className="flex items-center gap-1 text-yellow-600">
                                <AlertTriangle size={14} />
                                Low Stock
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-green-600">
                                <CheckCircle size={14} />
                                In Stock
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleEditMaterial(material)}
                                className="text-blue-600 hover:text-blue-800"
                                title="Edit Material"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleStockAdjustment(material)}
                                className="text-green-600 hover:text-green-800"
                                title="Adjust Stock"
                              >
                                <Settings size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteMaterial(material.id)}
                                className="text-red-600 hover:text-red-800"
                                title="Delete Material"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing page {materialsPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setMaterialsPage(Math.max(1, materialsPage - 1))}
                  disabled={materialsPage === 1}
                  className="px-3 py-2 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setMaterialsPage(Math.min(totalPages, materialsPage + 1))}
                  disabled={materialsPage === totalPages}
                  className="px-3 py-2 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showCreateModal && (
        <Modal onClose={() => setShowCreateModal(false)} title="Add New Material">
          <MaterialForm
            onSuccess={() => {
              setShowCreateModal(false);
            }}
            onCancel={() => setShowCreateModal(false)}
          />
        </Modal>
      )}

      {showEditModal && selectedMaterial && (
        <Modal onClose={() => setShowEditModal(false)} title="Edit Material">
          <MaterialForm
            material={selectedMaterial}
            onSuccess={() => {
              setShowEditModal(false);
              setSelectedMaterial(null);
            }}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedMaterial(null);
            }}
          />
        </Modal>
      )}

      {showStockAdjustModal && selectedMaterial && (
        <StockAdjustmentModal
          material={selectedMaterial}
          onClose={() => {
            setShowStockAdjustModal(false);
            setSelectedMaterial(null);
          }}
        />
      )}
    </div>
  );
};

export default MaterialList;