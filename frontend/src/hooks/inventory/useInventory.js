import { useState, useEffect, useCallback, useRef } from 'react';
import inventoryService from '../../services/inventory/inventoryService';

/**
 * Custom React Hook for Inventory Operations
 * Provides state management and API integration for inventory features
 */
export const useInventory = () => {
  // ============== STATE MANAGEMENT ==============
  
  const [state, setState] = useState({
    // Data states
    materials: [],
    procurements: [],
    suppliers: [],
    categories: [],
    dashboardData: null,
    lowStockAlerts: [],
    pendingProcurements: [],
    
    // UI states
    loading: false,
    saving: false,
    error: null,
    success: null,
    
    // Pagination
    materialsPage: 1,
    procurementsPage: 1,
    totalMaterials: 0,
    totalProcurements: 0,
    
    // Filters
    materialsFilters: {
      search: '',
      category: '',
      lowStock: false
    },
    procurementsFilters: {
      status: '',
      supplier: '',
      dateRange: null
    }
  });

  // Refs for cleanup
  const mountedRef = useRef(true);
  const abortControllerRef = useRef(null);

  // ============== HELPER FUNCTIONS ==============

  const updateState = useCallback((updates) => {
    if (mountedRef.current) {
      setState(prev => ({ ...prev, ...updates }));
    }
  }, []);

  const setLoading = useCallback((loading) => {
    updateState({ loading });
  }, [updateState]);

  const setSaving = useCallback((saving) => {
    updateState({ saving });
  }, [updateState]);

  const setError = useCallback((error) => {
    updateState({ error, success: null });
  }, [updateState]);

  const setSuccess = useCallback((success) => {
    updateState({ success, error: null });
  }, [updateState]);

  const clearMessages = useCallback(() => {
    updateState({ error: null, success: null });
  }, [updateState]);

  // ============== MATERIALS MANAGEMENT ==============

  const fetchMaterials = useCallback(async (params = {}) => {
    setLoading(true);
    clearMessages();

    try {
      // Cancel previous request if running
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      const queryParams = {
        page: state.materialsPage,
        limit: 20,
        ...state.materialsFilters,
        ...params
      };

      const result = await inventoryService.getMaterials(queryParams);

      if (result.success) {
        updateState({
          materials: result.data.materials || [],
          totalMaterials: result.data.total || 0,
          materialsPage: result.data.page || 1
        });
      } else {
        setError(result.error || 'Failed to fetch materials');
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        setError('Network error while fetching materials');
      }
    } finally {
      setLoading(false);
    }
  }, [state.materialsPage, state.materialsFilters, setLoading, clearMessages, setError, updateState]);

  const createMaterial = useCallback(async (materialData) => {
    setSaving(true);
    clearMessages();

    try {
      const result = await inventoryService.createMaterial(materialData);

      if (result.success) {
        setSuccess('Material created successfully');
        
        // Add new material to the list
        updateState({
          materials: [result.data, ...state.materials]
        });

        // Refresh data to ensure consistency
        await fetchMaterials({ page: 1 });
        
        return { success: true, data: result.data };
      } else {
        setError(result.error || 'Failed to create material');
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = 'Network error while creating material';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setSaving(false);
    }
  }, [setSaving, clearMessages, setSuccess, setError, updateState, state.materials, fetchMaterials]);

  const updateMaterial = useCallback(async (id, materialData) => {
    setSaving(true);
    clearMessages();

    try {
      const result = await inventoryService.updateMaterial(id, materialData);

      if (result.success) {
        setSuccess('Material updated successfully');
        
        // Update material in the list
        updateState({
          materials: state.materials.map(material => 
            material.id === id ? { ...material, ...result.data } : material
          )
        });

        return { success: true, data: result.data };
      } else {
        setError(result.error || 'Failed to update material');
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = 'Network error while updating material';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setSaving(false);
    }
  }, [setSaving, clearMessages, setSuccess, setError, updateState, state.materials]);

  const deleteMaterial = useCallback(async (id) => {
    setSaving(true);
    clearMessages();

    try {
      const result = await inventoryService.deleteMaterial(id);

      if (result.success) {
        setSuccess('Material deleted successfully');
        
        // Remove material from the list
        updateState({
          materials: state.materials.filter(material => material.id !== id)
        });

        return { success: true };
      } else {
        setError(result.error || 'Failed to delete material');
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = 'Network error while deleting material';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setSaving(false);
    }
  }, [setSaving, clearMessages, setSuccess, setError, updateState, state.materials]);

  const adjustStock = useCallback(async (materialId, adjustmentData) => {
    setSaving(true);
    clearMessages();

    try {
      const result = await inventoryService.adjustStock(materialId, adjustmentData);

      if (result.success) {
        setSuccess('Stock adjusted successfully');
        
        // Update material stock in the list
        updateState({
          materials: state.materials.map(material => 
            material.id === materialId 
              ? { ...material, currentStock: result.data.currentStock }
              : material
          )
        });

        return { success: true, data: result.data };
      } else {
        setError(result.error || 'Failed to adjust stock');
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = 'Network error while adjusting stock';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setSaving(false);
    }
  }, [setSaving, clearMessages, setSuccess, setError, updateState, state.materials]);

  // ============== PROCUREMENT MANAGEMENT ==============

  const fetchProcurements = useCallback(async (params = {}) => {
    setLoading(true);
    clearMessages();

    try {
      const queryParams = {
        page: state.procurementsPage,
        limit: 20,
        ...state.procurementsFilters,
        ...params
      };

      const result = await inventoryService.getProcurements(queryParams);

      if (result.success) {
        updateState({
          procurements: result.data.procurements || [],
          totalProcurements: result.data.total || 0,
          procurementsPage: result.data.page || 1
        });
      } else {
        setError(result.error || 'Failed to fetch procurements');
      }
    } catch (error) {
      setError('Network error while fetching procurements');
    } finally {
      setLoading(false);
    }
  }, [state.procurementsPage, state.procurementsFilters, setLoading, clearMessages, setError, updateState]);

  const createProcurement = useCallback(async (procurementData) => {
    setSaving(true);
    clearMessages();

    try {
      const result = await inventoryService.createProcurement(procurementData);

      if (result.success) {
        setSuccess('Procurement created successfully');
        
        // Add new procurement to the list
        updateState({
          procurements: [result.data, ...state.procurements]
        });

        // Refresh pending procurements
        await fetchPendingProcurements();
        
        return { success: true, data: result.data };
      } else {
        setError(result.error || 'Failed to create procurement');
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = 'Network error while creating procurement';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setSaving(false);
    }
  }, [setSaving, clearMessages, setSuccess, setError, updateState, state.procurements]);

  const markProcurementDelivered = useCallback(async (id, deliveryData) => {
    setSaving(true);
    clearMessages();

    try {
      const result = await inventoryService.markProcurementDelivered(id, deliveryData);

      if (result.success) {
        setSuccess('Procurement marked as delivered');
        
        // Update procurement status and related materials stock
        updateState({
          procurements: state.procurements.map(proc => 
            proc.id === id ? { ...proc, ...result.data.procurement } : proc
          ),
          materials: state.materials.map(material => {
            const updatedMaterial = result.data.updatedMaterials?.find(
              updated => updated.id === material.id
            );
            return updatedMaterial ? { ...material, ...updatedMaterial } : material;
          })
        });

        // Refresh relevant data
        await Promise.all([
          fetchPendingProcurements(),
          fetchLowStockAlerts()
        ]);
        
        return { success: true, data: result.data };
      } else {
        setError(result.error || 'Failed to mark procurement as delivered');
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = 'Network error while marking procurement as delivered';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setSaving(false);
    }
  }, [setSaving, clearMessages, setSuccess, setError, updateState, state.procurements, state.materials]);

  // ============== WORK ORDER INTEGRATION ==============

  const recordMaterialUsage = useCallback(async (jobId, usageData) => {
    setSaving(true);
    clearMessages();

    try {
      const result = await inventoryService.recordMaterialUsage(jobId, usageData);

      if (result.success) {
        setSuccess('Material usage recorded successfully');
        
        // Update materials stock based on usage
        updateState({
          materials: state.materials.map(material => {
            const usedMaterial = result.data.usedMaterials?.find(
              used => used.materialId === material.id
            );
            return usedMaterial 
              ? { ...material, currentStock: material.currentStock - usedMaterial.quantity }
              : material;
          })
        });

        // Refresh low stock alerts
        await fetchLowStockAlerts();
        
        return { success: true, data: result.data };
      } else {
        setError(result.error || 'Failed to record material usage');
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = 'Network error while recording material usage';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setSaving(false);
    }
  }, [setSaving, clearMessages, setSuccess, setError, updateState, state.materials]);

  const fetchJobMaterialUsage = useCallback(async (jobId) => {
    setLoading(true);

    try {
      const result = await inventoryService.getJobMaterialUsage(jobId);

      if (result.success) {
        return { success: true, data: result.data };
      } else {
        setError(result.error || 'Failed to fetch job material usage');
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = 'Network error while fetching job material usage';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  // ============== DASHBOARD & ALERTS ==============

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);

    try {
      const result = await inventoryService.getDashboardData();

      if (result.success) {
        updateState({ dashboardData: result.data });
      } else {
        setError(result.error || 'Failed to fetch dashboard data');
      }
    } catch (error) {
      setError('Network error while fetching dashboard data');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, updateState]);

  const fetchLowStockAlerts = useCallback(async () => {
    try {
      const result = await inventoryService.getLowStockAlerts();

      if (result.success) {
        updateState({ lowStockAlerts: result.data || [] });
      }
    } catch (error) {
      console.error('Failed to fetch low stock alerts:', error);
    }
  }, [updateState]);

  const fetchPendingProcurements = useCallback(async () => {
    try {
      const result = await inventoryService.getPendingProcurements();

      if (result.success) {
        updateState({ pendingProcurements: result.data?.procurements || [] });
      }
    } catch (error) {
      console.error('Failed to fetch pending procurements:', error);
    }
  }, [updateState]);

  // ============== SUPPLIERS & CATEGORIES ==============

  const fetchSuppliers = useCallback(async () => {
    try {
      const result = await inventoryService.getSuppliers();

      if (result.success) {
        updateState({ suppliers: result.data || [] });
      }
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const result = await inventoryService.getCategories();

      if (result.success) {
        updateState({ categories: result.data || [] });
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  }, []);

  // ============== FILTER MANAGEMENT ==============

  const updateMaterialsFilters = useCallback((filters) => {
    updateState({
      materialsFilters: { ...state.materialsFilters, ...filters },
      materialsPage: 1
    });
  }, [updateState, state.materialsFilters]);

  const updateProcurementsFilters = useCallback((filters) => {
    updateState({
      procurementsFilters: { ...state.procurementsFilters, ...filters },
      procurementsPage: 1
    });
  }, [updateState, state.procurementsFilters]);

  const resetFilters = useCallback(() => {
    updateState({
      materialsFilters: {
        search: '',
        category: '',
        lowStock: false
      },
      procurementsFilters: {
        status: '',
        supplier: '',
        dateRange: null
      }
    });
  }, [updateState]);

  // ============== PAGINATION ==============

  const setMaterialsPage = useCallback((page) => {
    updateState({ materialsPage: page });
  }, [updateState]);

  const setProcurementsPage = useCallback((page) => {
    updateState({ procurementsPage: page });
  }, [updateState]);

  // ============== EFFECT HOOKS ==============

  // Initial data loading - only run once on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await Promise.all([
          fetchSuppliers(),
          fetchCategories()
        ]);
      } catch (error) {
        console.error('Error loading initial inventory data:', error);
      }
    };

    loadInitialData();
  }, []); // Empty dependency array - only run on mount

  // Load materials when filters change
  useEffect(() => {
    fetchMaterials();
  }, [
    state.materialsFilters.search,
    state.materialsFilters.category,
    state.materialsFilters.lowStock,
    state.materialsPage
  ]);

  // Load procurements when filters change
  useEffect(() => {
    fetchProcurements();
  }, [
    state.procurementsFilters.status,
    state.procurementsFilters.supplier,
    state.procurementsPage
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // ============== RETURN HOOK API ==============

  return {
    // Data
    materials: state.materials,
    procurements: state.procurements,
    suppliers: state.suppliers,
    categories: state.categories,
    dashboardData: state.dashboardData,
    lowStockAlerts: state.lowStockAlerts,
    pendingProcurements: state.pendingProcurements,

    // UI State
    loading: state.loading,
    saving: state.saving,
    error: state.error,
    success: state.success,

    // Pagination
    materialsPage: state.materialsPage,
    procurementsPage: state.procurementsPage,
    totalMaterials: state.totalMaterials,
    totalProcurements: state.totalProcurements,

    // Filters
    materialsFilters: state.materialsFilters,
    procurementsFilters: state.procurementsFilters,

    // Material Actions
    fetchMaterials,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    adjustStock,

    // Procurement Actions
    fetchProcurements,
    createProcurement,
    markProcurementDelivered,

    // Work Order Actions
    recordMaterialUsage,
    fetchJobMaterialUsage,

    // Dashboard Actions
    fetchDashboardData,
    fetchLowStockAlerts,
    fetchPendingProcurements,

    // Utility Actions
    clearMessages,
    updateMaterialsFilters,
    updateProcurementsFilters,
    resetFilters,
    setMaterialsPage,
    setProcurementsPage,
    
    // Computed Properties
    hasLowStockAlerts: state.lowStockAlerts.length > 0,
    hasPendingProcurements: state.pendingProcurements.length > 0,
    totalPages: Math.ceil(state.totalMaterials / 20),
    procurementPages: Math.ceil(state.totalProcurements / 20)
  };
};

export default useInventory;