import { useState, useCallback, useEffect } from 'react';
import inventoryService from '../services/inventory/inventoryService';

export const useInventory = () => {
  const [materials, setMaterials] = useState([]);
  const [pendingAdjustments, setPendingAdjustments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  const fetchMaterials = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await inventoryService.getMaterials(params);
      setMaterials(response.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch materials');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPendingAdjustments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await inventoryService.getPendingAdjustments();
      setPendingAdjustments(response.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch pending adjustments');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await inventoryService.getMaterialStats();
      setStats(response.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  const submitStockAdjustment = useCallback(async (materialId, quantity, reason) => {
    try {
      setError(null);
      const response = await inventoryService.submitStockAdjustment(materialId, quantity, reason);
      await fetchPendingAdjustments();
      return response.data;
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Failed to submit adjustment';
      setError(message);
      throw err;
    }
  }, [fetchPendingAdjustments]);

  const submitMaterialAddition = useCallback(async (name, category, unit, quantity, reorderLevel, reason) => {
    try {
      setError(null);
      const response = await inventoryService.submitMaterialAddition(name, category, unit, quantity, reorderLevel, reason);
      await fetchPendingAdjustments();
      return response.data;
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Failed to submit material addition';
      setError(message);
      throw err;
    }
  }, [fetchPendingAdjustments]);

  const approveAdjustment = useCallback(async (id) => {
    try {
      setError(null);
      const response = await inventoryService.approvePendingAdjustment(id);
      await fetchPendingAdjustments();
      await fetchMaterials();
      return response.data;
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Failed to approve adjustment';
      setError(message);
      throw err;
    }
  }, [fetchPendingAdjustments, fetchMaterials]);

  const rejectAdjustment = useCallback(async (id, reason) => {
    try {
      setError(null);
      const response = await inventoryService.rejectPendingAdjustment(id, reason);
      await fetchPendingAdjustments();
      return response.data;
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Failed to reject adjustment';
      setError(message);
      throw err;
    }
  }, [fetchPendingAdjustments]);

  const recordUsage = useCallback(async (materialId, quantity, note) => {
    try {
      setError(null);
      const response = await inventoryService.recordMaterialUsage(materialId, quantity, note);
      await fetchMaterials();
      return response.data;
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Failed to record usage';
      setError(message);
      throw err;
    }
  }, [fetchMaterials]);

  return {
    materials,
    pendingAdjustments,
    loading,
    error,
    stats,
    fetchMaterials,
    fetchPendingAdjustments,
    fetchStats,
    submitStockAdjustment,
    submitMaterialAddition,
    approveAdjustment,
    rejectAdjustment,
    recordUsage,
  };
};

export default useInventory;
