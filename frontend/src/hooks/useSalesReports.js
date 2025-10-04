import { useState, useCallback } from 'react';
import { salesReportsAPI } from '../utils/services';

export function useSalesReports() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createReport = useCallback(async (date) => {
    try {
      setLoading(true);
      setError(null);
      const report = await salesReportsAPI.create({ date });
      return report;
    } catch (err) {
      console.error('Error creating report:', err);
      if (err.response?.data?.date) {
        setError('A report for this date already exists');
      } else {
        setError('Failed to create report. Please try again.');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateReport = useCallback(async (id, data) => {
    try {
      setLoading(true);
      setError(null);
      const report = await salesReportsAPI.update(id, data);
      return report;
    } catch (err) {
      console.error('Error updating report:', err);
      setError('Failed to update report. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const submitReport = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      const report = await salesReportsAPI.submit(id);
      return report;
    } catch (err) {
      console.error('Error submitting report:', err);
      setError('Failed to submit report. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const generateFromWorks = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      const report = await salesReportsAPI.generateFromWorks(id);
      return report;
    } catch (err) {
      console.error('Error auto-generating report:', err);
      setError('Failed to auto-generate report. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteReport = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      await salesReportsAPI.delete(id);
    } catch (err) {
      console.error('Error deleting report:', err);
      setError('Failed to delete report. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Category Items
  const addCategoryItem = useCallback(async (data) => {
    try {
      setLoading(true);
      setError(null);
      const item = await salesReportsAPI.createItem(data);
      return item;
    } catch (err) {
      console.error('Error adding category item:', err);
      setError('Failed to add category item. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCategoryItem = useCallback(async (id, data) => {
    try {
      setLoading(true);
      setError(null);
      const item = await salesReportsAPI.updateItem(id, data);
      return item;
    } catch (err) {
      console.error('Error updating category item:', err);
      setError('Failed to update category item. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteCategoryItem = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      await salesReportsAPI.deleteItem(id);
    } catch (err) {
      console.error('Error deleting category item:', err);
      setError('Failed to delete category item. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Expenses
  const addExpense = useCallback(async (data) => {
    try {
      setLoading(true);
      setError(null);
      const expense = await salesReportsAPI.createExpense(data);
      return expense;
    } catch (err) {
      console.error('Error adding expense:', err);
      setError('Failed to add expense. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateExpense = useCallback(async (id, data) => {
    try {
      setLoading(true);
      setError(null);
      const expense = await salesReportsAPI.updateExpense(id, data);
      return expense;
    } catch (err) {
      console.error('Error updating expense:', err);
      setError('Failed to update expense. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteExpense = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      await salesReportsAPI.deleteExpense(id);
    } catch (err) {
      console.error('Error deleting expense:', err);
      setError('Failed to delete expense. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Notes
  const addNote = useCallback(async (data) => {
    try {
      setLoading(true);
      setError(null);
      const note = await salesReportsAPI.createNote(data);
      return note;
    } catch (err) {
      console.error('Error adding note:', err);
      setError('Failed to add note. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteNote = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      await salesReportsAPI.deleteNote(id);
    } catch (err) {
      console.error('Error deleting note:', err);
      setError('Failed to delete note. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    clearError,
    
    // Report operations
    createReport,
    updateReport,
    submitReport,
    generateFromWorks,
    deleteReport,
    
    // Category items
    addCategoryItem,
    updateCategoryItem,
    deleteCategoryItem,
    
    // Expenses
    addExpense,
    updateExpense,
    deleteExpense,
    
    // Notes
    addNote,
    deleteNote
  };
}