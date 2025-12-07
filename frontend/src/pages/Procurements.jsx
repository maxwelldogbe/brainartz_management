import React, { useState, useEffect } from 'react';
/* eslint-disable react-hooks/exhaustive-deps */
import { Plus, Package, Clock, CheckCircle } from 'lucide-react';
import SimpleProcurementForm from '../components/inventory/SimpleProcurementForm';
import { procurementsAPI } from '../utils/services';
import { useRoleAccess } from '../hooks/useRoleAccess';

const Procurements = () => {
  const { canAccessAdminFeatures } = useRoleAccess();
  const [procurements, setProcurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProcurement, setEditingProcurement] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [stats, setStats] = useState({
    pending: 0,
    delivered: 0,
    total: 0
  });

  useEffect(() => {
    loadProcurements();
    loadStats();
  }, [statusFilter]);

  const loadProcurements = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = statusFilter ? { status: statusFilter } : {};
      
      const response = await procurementsAPI.getAll(params);
      
      // Handle different response structures
      let procurementsData = [];
      if (Array.isArray(response)) {
        procurementsData = response;
      } else if (response && Array.isArray(response.results)) {
        procurementsData = response.results;
      } else if (response && Array.isArray(response.data)) {
        procurementsData = response.data;
      } else {
        procurementsData = [];
      }
      
      setProcurements(procurementsData);
    } catch (error) {
      console.error('Error fetching procurements:', error);
      
      if (error.response?.status === 401) {
        setError('Authentication required. Please log in again.');
      } else if (error.response?.status === 403) {
        setError('Access denied. You do not have permission to view procurements.');
      } else if (error.response?.status >= 500) {
        setError('Server error. Please try again later.');
      } else {
        setError(`Failed to load procurement orders: ${error.message}`);
      }
      setProcurements([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const [allResponse, pendingResponse] = await Promise.all([
        procurementsAPI.getAll(),
        procurementsAPI.getAll({ status: 'pending' })
      ]);

      const all = allResponse.results || allResponse || [];
      const pending = pendingResponse.results || pendingResponse || [];
      
      setStats({
        total: all.length,
        pending: pending.length,
        delivered: all.filter(p => p.status === 'delivered').length
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      setStats({ total: 0, pending: 0, delivered: 0 });
    }
  };

  const handleAddProcurement = () => {
    setEditingProcurement(null);
    setShowForm(true);
  };

  const handleEditProcurement = (procurement) => {
    setEditingProcurement(procurement);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingProcurement(null);
    loadProcurements();
    loadStats();
  };

  const handleMarkDelivered = async (id, deliveryData) => {
    try {
      await procurementsAPI.markDelivered(id, deliveryData);
      loadProcurements();
      loadStats();
    } catch (error) {
      console.error('Error marking procurement as delivered:', error);
      setError('Failed to mark procurement as delivered. Please try again.');
    }
  };

  return (
    <div className="p-6">
      {/* Enhanced Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Procurement Orders</h1>
          <p className="text-gray-600">Manage procurement orders</p>
        </div>
        <button
          onClick={handleAddProcurement}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
        >
          <Plus size={20} />
          New Procurement
        </button>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Package className="text-blue-500" size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Pending</p>
              <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
            </div>
            <Clock className="text-orange-500" size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Delivered</p>
              <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
            </div>
            <CheckCircle className="text-green-500" size={24} />
          </div>
        </div>
      </div>

      {/* Procurement Content */}
          {/* Procurement Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
            <div className="flex gap-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="ordered">Ordered</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
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

          {/* Procurements List */}
          <div className="bg-white rounded-lg shadow-sm">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-600">Loading procurement orders...</span>
              </div>
            ) : procurements.length === 0 && !loading ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No procurement orders found</h3>
                <p className="text-gray-600 mb-6">
                  {statusFilter
                    ? `No procurement orders with status "${statusFilter}".`
                    : 'Get started by creating your first procurement order.'}
                </p>
                <button
                  onClick={handleAddProcurement}
                  className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
                >
                  Create First Order
                </button>
              </div>
            ) : (
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Material
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Unit Cost
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Cost
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order Date
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {procurements.map((procurement) => (
                        <tr key={procurement.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {procurement.material?.name || procurement.material_name || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {procurement.material?.unit || procurement.material_unit || ''}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {procurement.quantity_ordered || 0}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              ₵{parseFloat(procurement.unit_cost || 0).toFixed(2)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900">
                              ₵{parseFloat(procurement.total_cost || 0).toFixed(2)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              procurement.status === 'delivered' 
                                ? 'bg-green-100 text-green-800'
                                : procurement.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {procurement.status || 'pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {procurement.order_date ? new Date(procurement.order_date).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {canAccessAdminFeatures && (
                              <>
                                <button
                                  onClick={() => handleEditProcurement(procurement)}
                                  className="text-indigo-600 hover:text-indigo-900 mr-4"
                                >
                                  Edit
                                </button>
                                {procurement.status === 'pending' && (
                                  <button
                                    onClick={() => handleMarkDelivered(procurement.id, {})}
                                    className="text-green-600 hover:text-green-900"
                                  >
                                    Mark Delivered
                                  </button>
                                )}
                              </>
                            )}
                            {!canAccessAdminFeatures && (
                              <span className="text-gray-400 text-sm">View Only</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

      {/* Procurement Form Modal */}
      {showForm && (
        <SimpleProcurementForm
          procurement={editingProcurement}
          onClose={handleFormClose}
          onSave={handleFormClose}
        />
      )}
    </div>
  );
};


export default Procurements;