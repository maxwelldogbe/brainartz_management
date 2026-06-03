import api from '../api';

const API_BASE = '/api';

export const inventoryService = {
  // Materials
  getMaterials: (params = {}) => {
    return api.get(`${API_BASE}/materials/`, { params });
  },

  getMaterial: (id) => {
    return api.get(`${API_BASE}/materials/${id}/`);
  },

  createMaterial: (data) => {
    return api.post(`${API_BASE}/materials/`, data);
  },

  updateMaterial: (id, data) => {
    return api.patch(`${API_BASE}/materials/${id}/`, data);
  },

  getMaterialStats: () => {
    return api.get(`${API_BASE}/materials/statistics/`);
  },

  // Pending Stock Adjustments
  getPendingAdjustments: () => {
    return api.get(`${API_BASE}/pending-stock-adjustments/`);
  },

  getPendingAdjustment: (id) => {
    return api.get(`${API_BASE}/pending-stock-adjustments/${id}/`);
  },

  submitStockAdjustment: (materialId, quantity, reason) => {
    return api.post(`${API_BASE}/pending-stock-adjustments/`, {
      adjustment_type: 'stock_addition',
      material: materialId,
      quantity,
      reason,
    });
  },

  submitMaterialAddition: (name, category, unit, quantity, reorderLevel, reason) => {
    return api.post(`${API_BASE}/pending-stock-adjustments/`, {
      adjustment_type: 'new_material',
      material_name: name,
      material_category: category,
      material_unit: unit,
      quantity,
      reorder_level: reorderLevel,
      reason,
    });
  },

  approvePendingAdjustment: (id) => {
    return api.post(`${API_BASE}/pending-stock-adjustments/${id}/approve/`);
  },

  rejectPendingAdjustment: (id, rejectionReason) => {
    return api.post(`${API_BASE}/pending-stock-adjustments/${id}/reject/`, {
      rejection_reason: rejectionReason,
    });
  },

  getPendingCount: () => {
    return api.get(`${API_BASE}/pending-stock-adjustments/pending_count/`);
  },

  // Material Usage
  recordMaterialUsage: (materialId, quantityTaken, note = '') => {
    return api.post(`${API_BASE}/material-usage/record_usage/`, {
      material_id: materialId,
      quantity_taken: quantityTaken,
      note,
    });
  },

  getMaterialUsage: (params = {}) => {
    return api.get(`${API_BASE}/material-usage/`, { params });
  },
};

export default inventoryService;
