import React, { useState, useEffect } from 'react';
import { Plus, Package, Clock, CheckCircle, AlertCircle, ShoppingCart, User } from 'lucide-react';
import SimpleProcurementForm from '../components/inventory/SimpleProcurementForm';
import MaterialPickingModal from '../components/inventory/MaterialPickingModal';
import { procurementsAPI, materialsAPI, jobMaterialsAPI } from '../utils/services';

const Procurements = () => {
  const [procurements, setProcurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showPickingModal, setShowPickingModal] = useState(false);
  const [editingProcurement, setEditingProcurement] = useState(null);
  const [activeTab, setActiveTab] = useState('procurement'); // 'procurement' or 'picking'
  const [statusFilter, setStatusFilter] = useState('');
  const [stats, setStats] = useState({
    pending: 0,
    delivered: 0,
    total: 0,
    requests: 0
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
      console.log('🔍 Loading procurements with params:', params);
      
      const response = await procurementsAPI.getAll(params);
      console.log('🛒 Procurements API response:', response);
      
      // Handle different response structures
      let procurementsData = [];
      if (Array.isArray(response)) {
        procurementsData = response;
      } else if (response && Array.isArray(response.results)) {
        procurementsData = response.results;
      } else if (response && Array.isArray(response.data)) {
        procurementsData = response.data;
      } else {
        console.warn('Unexpected response structure:', response);
        procurementsData = [];
      }
      
      console.log('📊 Processed procurements data:', procurementsData);
      setProcurements(procurementsData);
    } catch (error) {
      console.error('❌ Error loading procurements:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
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

  const handlePickMaterials = () => {
    setShowPickingModal(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingProcurement(null);
    loadProcurements();
    loadStats();
  };

  const handlePickingModalClose = () => {
    setShowPickingModal(false);
    loadStats(); // Refresh stats after material picking
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
      {/* Enhanced Header with Tabs */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Procurement & Material Usage</h1>
          <p className="text-gray-600">Manage procurement orders and track material usage</p>
        </div>
        <div className="flex space-x-2">
          {activeTab === 'procurement' && (
            <button
              onClick={handleAddProcurement}
              className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              <Plus size={20} />
              New Procurement
            </button>
          )}
          {activeTab === 'picking' && (
            <button
              onClick={handlePickMaterials}
              className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
            >
              <Package size={20} />
              Pick Materials
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('procurement')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'procurement'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <ShoppingCart size={20} />
                <span>Procurement Orders</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('picking')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'picking'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <User size={20} />
                <span>Material Usage</span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Material Requests</p>
              <p className="text-2xl font-bold text-purple-600">{stats.requests}</p>
            </div>
            <AlertCircle className="text-purple-500" size={24} />
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'procurement' && (
        <>
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
                          Supplier
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
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
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {procurement.supplier_name || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {procurement.quantity_ordered || 0}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              ₵{procurement.total_cost || 0}
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
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'picking' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-center py-12">
            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Material Usage Tracking</h3>
            <p className="text-gray-600 mb-6">
              Track materials used in jobs and notify admin about inventory needs.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
              <button
                onClick={handlePickMaterials}
                className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 flex items-center justify-center space-x-2"
              >
                <Package size={20} />
                <span>Record Material Usage</span>
              </button>
              <button
                onClick={handleAddProcurement}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 flex items-center justify-center space-x-2"
              >
                <AlertCircle size={20} />
                <span>Request Materials</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Procurement Form Modal */}
      {showForm && (
        <SimpleProcurementForm
          procurement={editingProcurement}
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
    </div>
  );
};


export default Procurements;