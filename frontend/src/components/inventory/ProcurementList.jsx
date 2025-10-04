import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  ShoppingCart, 
  Clock, 
  CheckCircle, 
  XCircle,
  Truck,
  Eye,
  Edit,
  Calendar,
  DollarSign,
  Package
} from 'lucide-react';
import ProcurementCard from './ProcurementCard';
import ProcurementForm from './ProcurementForm';
import DeliveryModal from './DeliveryModal';
import Modal from '../Modal';
import { useInventory } from '../../hooks/inventory/useInventory';

/**
 * ProcurementList Component
 * Displays and manages procurement orders with filtering and actions
 */
const ProcurementList = () => {
  const {
    procurements,
    suppliers,
    loading,
    error,
    procurementsFilters,
    procurementsPage,
    procurementPages,
    updateProcurementsFilters,
    setProcurementsPage,
    clearMessages
  } = useInventory();

  // Local state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [selectedProcurement, setSelectedProcurement] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [sortBy, setSortBy] = useState('created'); // 'created' | 'expected' | 'total'
  const [sortOrder, setSortOrder] = useState('desc');

  // Handle search
  const handleSearchChange = (e) => {
    updateProcurementsFilters({ search: e.target.value });
  };

  // Handle status filter
  const handleStatusFilter = (status) => {
    updateProcurementsFilters({ status });
  };

  // Handle supplier filter
  const handleSupplierFilter = (supplierId) => {
    updateProcurementsFilters({ supplier: supplierId });
  };

  // Handle date range filter
  const handleDateRangeFilter = (range) => {
    updateProcurementsFilters({ dateRange: range });
  };

  // Handle sort
  const handleSort = (field) => {
    const newOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(field);
    setSortOrder(newOrder);
  };

  // Handle delivery
  const handleMarkDelivered = (procurement) => {
    setSelectedProcurement(procurement);
    setShowDeliveryModal(true);
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'ordered':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Sort procurements
  const sortedProcurements = [...procurements].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'created':
        comparison = new Date(a.createdAt) - new Date(b.createdAt);
        break;
      case 'expected':
        comparison = new Date(a.expectedDelivery) - new Date(b.expectedDelivery);
        break;
      case 'total':
        comparison = a.totalCost - b.totalCost;
        break;
      default:
        comparison = 0;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Calculate statistics
  const stats = {
    total: procurements.length,
    pending: procurements.filter(p => p.status === 'pending').length,
    inProgress: procurements.filter(p => ['approved', 'ordered'].includes(p.status)).length,
    delivered: procurements.filter(p => p.status === 'delivered').length,
    totalValue: procurements.reduce((sum, p) => sum + (p.totalCost || 0), 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Procurement Orders</h1>
          <p className="text-gray-600">Manage material procurement and deliveries</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          New Procurement
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-xl font-semibold">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-xl font-semibold">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Truck className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-xl font-semibold">{stats.inProgress}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Delivered</p>
              <p className="text-xl font-semibold">{stats.delivered}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Value</p>
              <p className="text-xl font-semibold">${stats.totalValue.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search procurements..."
              value={procurementsFilters.search || ''}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="min-w-40">
            <select
              value={procurementsFilters.status || ''}
              onChange={(e) => handleStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="ordered">Ordered</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Supplier Filter */}
          <div className="min-w-48">
            <select
              value={procurementsFilters.supplier || ''}
              onChange={(e) => handleSupplierFilter(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Suppliers</option>
              {suppliers.map(supplier => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>

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

          {/* Sort */}
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
              <option value="created-desc">Latest First</option>
              <option value="created-asc">Oldest First</option>
              <option value="expected-asc">Due Soon</option>
              <option value="expected-desc">Due Later</option>
              <option value="total-desc">Highest Value</option>
              <option value="total-asc">Lowest Value</option>
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

      {/* Procurements Display */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading procurements...</span>
        </div>
      ) : sortedProcurements.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No procurement orders found</h3>
          <p className="text-gray-600 mb-6">
            {Object.values(procurementsFilters).some(filter => filter)
              ? 'Try adjusting your filters to see more procurements.'
              : 'Get started by creating your first procurement order.'}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create First Procurement
          </button>
        </div>
      ) : (
        <>
          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedProcurements.map(procurement => (
                <ProcurementCard
                  key={procurement.id}
                  procurement={procurement}
                  onMarkDelivered={() => handleMarkDelivered(procurement)}
                />
              ))}
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Supplier
                      </th>
                      <th 
                        onClick={() => handleSort('expected')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        Expected Delivery
                      </th>
                      <th 
                        onClick={() => handleSort('total')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        Total Cost
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
                    {sortedProcurements.map(procurement => (
                      <tr key={procurement.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              #{procurement.id.slice(-8)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {procurement.materials?.length || 0} items
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {procurement.supplier?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {new Date(procurement.expectedDelivery).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          ${procurement.totalCost?.toFixed(2) || '0.00'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(procurement.status)}`}>
                            {procurement.status?.charAt(0).toUpperCase() + procurement.status?.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            {procurement.status === 'ordered' && (
                              <button
                                onClick={() => handleMarkDelivered(procurement)}
                                className="text-green-600 hover:text-green-800"
                                title="Mark as Delivered"
                              >
                                <Truck size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {procurementPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing page {procurementsPage} of {procurementPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setProcurementsPage(Math.max(1, procurementsPage - 1))}
                  disabled={procurementsPage === 1}
                  className="px-3 py-2 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setProcurementsPage(Math.min(procurementPages, procurementsPage + 1))}
                  disabled={procurementsPage === procurementPages}
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
        <Modal onClose={() => setShowCreateModal(false)} title="Create Procurement Order">
          <ProcurementForm
            onSuccess={() => setShowCreateModal(false)}
            onCancel={() => setShowCreateModal(false)}
          />
        </Modal>
      )}

      {showDeliveryModal && selectedProcurement && (
        <DeliveryModal
          procurement={selectedProcurement}
          onClose={() => {
            setShowDeliveryModal(false);
            setSelectedProcurement(null);
          }}
        />
      )}
    </div>
  );
};

export default ProcurementList;