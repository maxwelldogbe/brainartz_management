import React, { useState, useEffect } from 'react';
/* eslint-disable react-hooks/exhaustive-deps */
import { Link } from 'react-router-dom';
import { Plus, Search, Package, Edit, Minus, ClipboardList, FileText } from 'lucide-react';
import SimpleMaterialForm from '../components/inventory/SimpleMaterialForm';
import MaterialPickingModal from '../components/inventory/MaterialPickingModal';
import StaffStockAdditionForm from '../components/inventory/StaffStockAdditionForm';
import { materialsAPI } from '../utils/services';
import { useRoleAccess } from '../hooks/useRoleAccess';

const Materials = () => {
  const { canAccessAdminFeatures } = useRoleAccess();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showPickingModal, setShowPickingModal] = useState(false);
  const [showStaffAdditionForm, setShowStaffAdditionForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    lowStock: false
  });

  useEffect(() => {
    loadMaterials();
  }, [searchTerm, filters]);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        search: searchTerm,
        category: filters.category,
        low_stock: filters.lowStock
      };
      
      const response = await materialsAPI.getAll(params);
      
      // Handle different response structures
      let materialsData = [];
      if (Array.isArray(response)) {
        materialsData = response;
      } else if (response && Array.isArray(response.results)) {
        materialsData = response.results;
      } else if (response && Array.isArray(response.data)) {
        materialsData = response.data;
      } else {
        materialsData = [];
      }
      
      setMaterials(materialsData);
    } catch (error) {
      console.error('Error fetching materials:', error);
      
      // Don't set error for empty data - just show empty state
      if (error.response?.status === 401) {
        setError('Authentication required. Please log in again.');
      } else if (error.response?.status === 403) {
        setError('Access denied. You do not have permission to view materials.');
      } else if (error.response?.status >= 500) {
        setError('Server error. Please try again later.');
      } else {
        console.error('Error loading materials:', error);
      }
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMaterial = () => {
    setEditingMaterial(null);
    setShowForm(true);
  };

  const handleEditMaterial = (material) => {
    setEditingMaterial(material);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingMaterial(null);
    loadMaterials();
  };

  const handlePickingModalClose = () => {
    setShowPickingModal(false);
    loadMaterials();
  };

  const handleDeleteMaterial = async (id) => {
    if (window.confirm('Are you sure you want to delete this material?')) {
      try {
        await materialsAPI.delete(id);
        loadMaterials();
      } catch (error) {
        console.error('Error deleting material:', error);
        setError('Failed to delete material. Please try again.');
      }
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Materials Management</h1>
          <p className="text-gray-600">
            {canAccessAdminFeatures 
              ? 'Manage inventory materials and stock levels' 
              : 'View inventory materials and record material pickups'}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowPickingModal(true)}
            className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
          >
            <ClipboardList size={20} />
            Record Material Pickup
          </button>
          
          {canAccessAdminFeatures ? (
            <>
              <Link
                to="/portal/inventory/pending-adjustments"
                className="flex items-center gap-2 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600"
              >
                <FileText size={20} />
                Approve Stock Requests
              </Link>
              <button
                onClick={handleAddMaterial}
                className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
              >
                <Plus size={20} />
                Add Material
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowStaffAdditionForm(true)}
              className="flex items-center gap-2 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600"
            >
              <FileText size={20} />
              Request Stock Addition
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search materials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              <option value="paper">Paper</option>
              <option value="ink">Ink</option>
              <option value="binding">Binding Supplies</option>
              <option value="other">Other</option>
            </select>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.lowStock}
                onChange={(e) => setFilters({ ...filters, lowStock: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">Low Stock Only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 text-red-800 px-4 py-3 rounded-lg mb-6 flex justify-between items-center">
          <span>{error}</span>
          <button 
            onClick={() => setError(null)} 
            className="text-red-600 hover:text-red-800"
          >
            ×
          </button>
        </div>
      )}

      {/* Materials List */}
      <div className="bg-white rounded-lg shadow-sm">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600">Loading materials...</span>
          </div>
        ) : materials.length === 0 && !loading ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No materials found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filters.category || filters.lowStock
                ? 'Try adjusting your filters to see more materials.'
                : 'Get started by adding your first material.'}
            </p>
            <button
              onClick={handleAddMaterial}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
            >
              Add First Material
            </button>
          </div>
        ) : (
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Material Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reorder Level
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
                  {materials.map((material) => {
                    const isLowStock = (material.current_stock || 0) <= (material.reorder_level || 0);
                    const isOutOfStock = (material.current_stock || 0) === 0;
                    
                    return (
                      <tr key={material.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {material.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {material.category || 'Other'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {material.current_stock || 0}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {material.unit || 'units'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {material.reorder_level || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isOutOfStock ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Out of Stock
                            </span>
                          ) : isLowStock ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              In Stock
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {canAccessAdminFeatures ? (
                            <>
                              <button
                                onClick={() => handleEditMaterial(material)}
                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteMaterial(material.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </>
                          ) : (
                            <span className="text-gray-400 text-sm">View Only</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Material Form Modal */}
      {showForm && (
        <SimpleMaterialForm
          material={editingMaterial}
          onClose={handleFormClose}
          onSave={handleFormClose}
        />
      )}

      {/* Material Picking Modal */}
      {showPickingModal && (
        <MaterialPickingModal
          onClose={handlePickingModalClose}
          onSave={handlePickingModalClose}
        />
      )}

      {/* Staff Stock Addition Request Form */}
      {showStaffAdditionForm && (
        <StaffStockAdditionForm
          onClose={() => setShowStaffAdditionForm(false)}
          onSuccess={() => {
            setShowStaffAdditionForm(false);
            alert('Stock addition request submitted successfully! It will be reviewed by an admin.');
          }}
        />
      )}
    </div>
  );
};


export default Materials;