import axios from '../../utils/axios';

/**
 * Complete Inventory API Service with error handling
 * Manages materials, procurement, stock adjustments, and work order integration
 */
class InventoryService {
  constructor() {
    this.baseURL = '/api/services';
  }

  // ============== MATERIALS MANAGEMENT ==============
  
  /**
   * Get materials with filtering and pagination
   * @param {Object} params - Query parameters
   * @param {string} params.search - Search term
   * @param {string} params.category - Material category filter
   * @param {string} params.lowStock - Filter for low stock items
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   */
  async getMaterials(params = {}) {
    try {
      const response = await axios.get(`${this.baseURL}/materials/`, { params });
      return {
        success: true,
        data: response.data,
        message: 'Materials fetched successfully'
      };
    } catch (error) {
      return this.handleError(error, 'Failed to fetch materials');
    }
  }

  /**
   * Get single material by ID
   */
  async getMaterial(id) {
    try {
      const response = await axios.get(`${this.baseURL}/materials/${id}/`);
      return {
        success: true,
        data: response.data,
        message: 'Material fetched successfully'
      };
    } catch (error) {
      return this.handleError(error, 'Failed to fetch material');
    }
  }

  /**
   * Create new material
   */
  async createMaterial(data) {
    try {
      const response = await axios.post(`${this.baseURL}/materials/`, data);
      return {
        success: true,
        data: response.data,
        message: 'Material created successfully'
      };
    } catch (error) {
      return this.handleError(error, 'Failed to create material');
    }
  }

  /**
   * Update existing material
   */
  async updateMaterial(id, data) {
    try {
      const response = await axios.put(`${this.baseURL}/materials/${id}/`, data);
      return {
        success: true,
        data: response.data,
        message: 'Material updated successfully'
      };
    } catch (error) {
      return this.handleError(error, 'Failed to update material');
    }
  }

  /**
   * Delete material
   */
  async deleteMaterial(id) {
    try {
      await axios.delete(`${this.baseURL}/materials/${id}/`);
      return {
        success: true,
        message: 'Material deleted successfully'
      };
    } catch (error) {
      return this.handleError(error, 'Failed to delete material');
    }
  }

  /**
   * Manual stock adjustment (Manager only)
   */
  async adjustStock(materialId, data) {
    try {
      const response = await axios.post(`${this.baseURL}/materials/${materialId}/adjust_stock/`, data);
      return {
        success: true,
        data: response.data,
        message: 'Stock adjusted successfully'
      };
    } catch (error) {
      return this.handleError(error, 'Failed to adjust stock');
    }
  }

  // ============== PROCUREMENT MANAGEMENT ==============

  /**
   * Get procurements with filtering
   */
  async getProcurements(params = {}) {
    try {
      const response = await axios.get(`${this.baseURL}/procurements/`, { params });
      return {
        success: true,
        data: response.data,
        message: 'Procurements fetched successfully'
      };
    } catch (error) {
      return this.handleError(error, 'Failed to fetch procurements');
    }
  }

  /**
   * Get single procurement by ID
   */
  async getProcurement(id) {
    try {
      const response = await axios.get(`${this.baseURL}/procurements/${id}/`);
      return {
        success: true,
        data: response.data,
        message: 'Procurement fetched successfully'
      };
    } catch (error) {
      return this.handleError(error, 'Failed to fetch procurement');
    }
  }

  /**
   * Create new procurement
   */
  async createProcurement(data) {
    try {
      const response = await axios.post(`${this.baseURL}/procurements/`, data);
      return {
        success: true,
        data: response.data,
        message: 'Procurement created successfully'
      };
    } catch (error) {
      return this.handleError(error, 'Failed to create procurement');
    }
  }

  /**
   * Mark procurement as delivered
   */
  async markProcurementDelivered(id, data) {
    try {
      const response = await axios.post(`${this.baseURL}/procurements/${id}/mark_delivered/`, data);
      return {
        success: true,
        data: response.data,
        message: 'Procurement marked as delivered'
      };
    } catch (error) {
      return this.handleError(error, 'Failed to mark procurement as delivered');
    }
  }

  /**
   * Update procurement
   */
  async updateProcurement(id, data) {
    try {
      const response = await axios.put(`${this.baseURL}/procurements/${id}/`, data);
      return {
        success: true,
        data: response.data,
        message: 'Procurement updated successfully'
      };
    } catch (error) {
      return this.handleError(error, 'Failed to update procurement');
    }
  }

  /**
   * Cancel procurement
   */
  async cancelProcurement(id, reason) {
    try {
      const response = await axios.patch(`${this.baseURL}/procurements/${id}/`, { 
        status: 'cancelled',
        notes: reason 
      });
      return {
        success: true,
        data: response.data,
        message: 'Procurement cancelled successfully'
      };
    } catch (error) {
      return this.handleError(error, 'Failed to cancel procurement');
    }
  }

  // ============== WORK ORDER INTEGRATION ==============

  /**
   * Record material usage for a work order
   */
  async recordMaterialUsage(jobId, data) {
    try {
      const response = await axios.post(`${this.baseURL}/works/${jobId}/record_material_usage/`, data);
      return {
        success: true,
        data: response.data,
        message: 'Material usage recorded successfully'
      };
    } catch (error) {
      return this.handleError(error, 'Failed to record material usage');
    }
  }

  /**
   * Get material usage history for a job
   */
  async getJobMaterialUsage(jobId) {
    try {
      const response = await axios.get(`${this.baseURL}/works/${jobId}/materials/`);
      return {
        success: true,
        data: response.data,
        message: 'Material usage history fetched successfully'
      };
    } catch (error) {
      return this.handleError(error, 'Failed to fetch material usage history');
    }
  }

  /**
   * Get available materials for a job (considering stock levels)
   */
  async getAvailableMaterials(jobId) {
    try {
      const response = await axios.get(`${this.baseURL}/materials/`, {
        params: { available_for_job: jobId }
      });
      return {
        success: true,
        data: response.data,
        message: 'Available materials fetched successfully'
      };
    } catch (error) {
      return this.handleError(error, 'Failed to fetch available materials');
    }
  }

  // ============== SUPPLIERS & CATEGORIES ==============

  /**
   * Get suppliers list (extracted from procurement records)
   */
  async getSuppliers(params = {}) {
    try {
      // Get unique suppliers from procurement records
      const response = await axios.get(`${this.baseURL}/procurements/`, { params });
      
      // Extract unique suppliers from procurement data
      const suppliers = [];
      const supplierMap = new Map();
      
      if (response.data && response.data.results) {
        response.data.results.forEach(procurement => {
          const key = procurement.supplier_name?.toLowerCase();
          if (key && !supplierMap.has(key)) {
            supplierMap.set(key, {
              id: suppliers.length + 1,
              name: procurement.supplier_name,
              contact: procurement.supplier_contact,
              email: procurement.supplier_email,
              phone: procurement.supplier_phone
            });
            suppliers.push(supplierMap.get(key));
          }
        });
      }
      
      return {
        success: true,
        data: suppliers,
        message: 'Suppliers fetched successfully'
      };
    } catch (error) {
      return this.handleError(error, 'Failed to fetch suppliers');
    }
  }

  /**
   * Get material categories (from Material.CATEGORY_CHOICES)
   */
  async getCategories() {
    try {
      // These are the predefined categories from Django Material model
      const categories = [
        { id: 'paper', name: 'Paper', value: 'paper' },
        { id: 'ink', name: 'Ink', value: 'ink' },
        { id: 'binding', name: 'Binding Supplies', value: 'binding' },
        { id: 'other', name: 'Other', value: 'other' }
      ];
      
      return {
        success: true,
        data: categories,
        message: 'Categories fetched successfully'
      };
    } catch (error) {
      return this.handleError(error, 'Failed to fetch categories');
    }
  }

  // ============== DASHBOARD & ANALYTICS ==============

  /**
   * Get inventory dashboard data
   */
  async getDashboardData() {
    try {
      const response = await axios.get(`${this.baseURL}/materials/statistics/`);
      return {
        success: true,
        data: response.data,
        message: 'Dashboard data fetched successfully'
      };
    } catch (error) {
      return this.handleError(error, 'Failed to fetch dashboard data');
    }
  }

  /**
   * Get low stock alerts
   */
  async getLowStockAlerts() {
    try {
      const response = await axios.get(`${this.baseURL}/materials/`, {
        params: { low_stock: true }
      });
      return {
        success: true,
        data: response.data,
        message: 'Low stock alerts fetched successfully'
      };
    } catch (error) {
      return this.handleError(error, 'Failed to fetch low stock alerts');
    }
  }

  /**
   * Get pending procurements
   */
  async getPendingProcurements() {
    try {
      const response = await axios.get(`${this.baseURL}/procurements/`, {
        params: { status: 'pending' }
      });
      return {
        success: true,
        data: response.data,
        message: 'Pending procurements fetched successfully'
      };
    } catch (error) {
      return this.handleError(error, 'Failed to fetch pending procurements');
    }
  }

  /**
   * Get inventory reports - Using existing materials endpoint with filters
   */
  async getInventoryReports(type, params = {}) {
    try {
      let endpoint = `${this.baseURL}/materials/`;
      if (type === 'stock-movements') {
        endpoint = `${this.baseURL}/stock-movements/`;
      }
      
      const response = await axios.get(endpoint, { params });
      return {
        success: true,
        data: response.data,
        message: 'Inventory report generated successfully'
      };
    } catch (error) {
      return this.handleError(error, 'Failed to generate inventory report');
    }
  }

  // ============== ERROR HANDLING ==============

  /**
   * Centralized error handling
   */
  handleError(error, defaultMessage) {
    
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          return {
            success: false,
            error: data.message || 'Invalid request data',
            details: data.details || null
          };
        case 401:
          return {
            success: false,
            error: 'Authentication required',
            redirect: '/login'
          };
        case 403:
          return {
            success: false,
            error: 'Access denied. Insufficient permissions',
            details: data.details || null
          };
        case 404:
          return {
            success: false,
            error: data.message || 'Resource not found'
          };
        case 409:
          return {
            success: false,
            error: data.message || 'Conflict with existing data',
            details: data.details || null
          };
        case 422:
          return {
            success: false,
            error: 'Validation failed',
            validation: data.errors || null
          };
        case 500:
          return {
            success: false,
            error: 'Server error. Please try again later'
          };
        default:
          return {
            success: false,
            error: data.message || defaultMessage
          };
      }
    } else if (error.request) {
      // Network error
      return {
        success: false,
        error: 'Network error. Please check your connection'
      };
    } else {
      // Other error
      return {
        success: false,
        error: error.message || defaultMessage
      };
    }
  }
}

// Create and export singleton instance
const inventoryService = new InventoryService();
export default inventoryService;

// Also export the class for testing
export { InventoryService };