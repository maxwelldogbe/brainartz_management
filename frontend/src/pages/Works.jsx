import React, { useEffect, useState } from "react";
/* eslint-disable react-hooks/exhaustive-deps */
import {
  fetchWorks,
  markWorkCompleted,
  reopenWork,
  jobCategoriesAPI,
  fetchWorkers,
  workFilesAPI
} from "../utils/services";
import EnhancedWorkForm from "../components/EnhancedWorkForm";
import WorkFilters from "../components/WorkFilters";
import { WorkList, WorkTable } from "../components/EnhancedWorkCard";
import WorkFileUpload from "../components/WorkFileUpload";
import Modal from "../components/Modal";
import { Plus, Grid, List } from "lucide-react";

export default function Works() {
  const [works, setWorks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingWork, setEditingWork] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [filesModalOpen, setFilesModalOpen] = useState(false);
  const [selectedWork, setSelectedWork] = useState(null);
  const [workFiles, setWorkFiles] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [filters, setFilters] = useState({});
  const [error, setError] = useState(null);
  const [updatingWorks, setUpdatingWorks] = useState(new Set());

  useEffect(() => {
    const initData = async () => {
      try {
        const [categoriesData, workersData] = await Promise.all([
          jobCategoriesAPI.getSelectOptions(),
          fetchWorkers()
        ]);
        
        setCategories(categoriesData);
        setWorkers(workersData.filter(worker => worker.is_worker || worker.is_admin));
        
        await loadWorksData();
      } catch (err) {
        console.error("Failed to load initial data:", err);
        setError("Failed to load page data");
      }
    };
    
    initData();
  }, []);

  useEffect(() => {
    loadWorksData();
  }, [filters]);

  const loadWorksData = async () => {
    try {
      setLoading(true);
      const data = await fetchWorks(filters);
      setWorks(data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch works:", err);
      setError("Failed to load works");
    } finally {
      setLoading(false);
    }
  };

  const loadWorkFiles = async (workId) => {
    try {
      const files = await workFilesAPI.getByWork(workId);
      setWorkFiles(files);
    } catch (error) {
      console.error("Failed to load work files:", error);
      setWorkFiles([]);
    }
  };

  const handleCreateWork = () => {
    setEditingWork(null);
    setFormOpen(true);
  };

  const handleEditWork = (work) => {
    setEditingWork(work);
    setFormOpen(true);
  };

  const handleSaveWork = (savedWork) => {
    if (editingWork) {
      setWorks(prev => prev.map(w => w.id === savedWork.id ? savedWork : w));
      showSuccess("Work updated successfully");
    } else {
      setWorks(prev => [savedWork, ...prev]);
      showSuccess("Work created successfully");
    }
  };

  const handleToggleComplete = async (work) => {
    // Prevent double-clicks
    if (updatingWorks.has(work.id)) {
      console.log('Work update already in progress for ID:', work.id);
      return;
    }
    
    try {
      // Add work to updating set
      setUpdatingWorks(prev => new Set([...prev, work.id]));
      
      let updatedWork;
      
      console.log(`Toggling work completion for work ID: ${work.id}, current status: ${work.completed ? 'completed' : 'incomplete'}`);
      
      if (work.completed) {
        // Reopen work - now properly calls the backend API
        console.log('Reopening work for corrections...');
        updatedWork = await reopenWork(work.id);
        console.log('Work reopened successfully:', updatedWork);
        showSuccess("Work reopened for corrections");
      } else {
        // Complete work
        console.log('Marking work as completed...');
        updatedWork = await markWorkCompleted(work.id);
        console.log('Work completed successfully:', updatedWork);
        showSuccess("Work marked as completed");
      }
      
      // Update the work in the local state
      setWorks(prev => prev.map(w => w.id === work.id ? updatedWork : w));
      console.log('Local state updated');
      
    } catch (error) {
      console.error("Failed to toggle work completion:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Show specific error messages
      if (error.response?.status === 404) {
        showError("Work not found. It may have been deleted.");
      } else if (error.response?.status === 403) {
        showError("You don't have permission to modify this work.");
      } else if (error.response?.status >= 500) {
        showError("Server error. Please try again later.");
      } else {
        showError(`Failed to ${work.completed ? 'reopen' : 'complete'} work. Please try again.`);
      }
    } finally {
      // Remove work from updating set
      setUpdatingWorks(prev => {
        const newSet = new Set(prev);
        newSet.delete(work.id);
        return newSet;
      });
    }
  };

  const handleViewFiles = async (work) => {
    setSelectedWork(work);
    setFilesModalOpen(true);
    await loadWorkFiles(work.id);
  };

  const handleFilesUpdate = () => {
    if (selectedWork) {
      loadWorkFiles(selectedWork.id);
      // Also refresh the work to update file count
      loadWorksData();
    }
  };

  // Helper functions for notifications
  const showSuccess = (message) => {
    alert(message);
  };

  const showError = (message) => {
    alert('Error: ' + message);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Works Management</h1>
          <p className="text-gray-600 mt-1">
            {works.length} work{works.length !== 1 ? 's' : ''} found
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${
                viewMode === 'grid' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Grid view"
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${
                viewMode === 'list' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {/* Create Work Button */}
          <button
            onClick={handleCreateWork}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Create Work</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
          <button 
            onClick={loadWorksData}
            className="mt-2 text-red-600 hover:text-red-800 underline"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Filters */}
      <WorkFilters
        filters={filters}
        onFiltersChange={setFilters}
        categories={categories}
        workers={workers}
      />

      {/* Works List / Grid */}
      {viewMode === 'grid' ? (
        <WorkList
          works={works}
          onEdit={handleEditWork}
          onToggleComplete={handleToggleComplete}
          onViewFiles={handleViewFiles}
          loading={loading}
          updatingWorks={updatingWorks}
        />
      ) : (
        <WorkTable
          works={works}
          onEdit={handleEditWork}
          onToggleComplete={handleToggleComplete}
          onViewFiles={handleViewFiles}
          loading={loading}
          updatingWorks={updatingWorks}
        />
      )}

      {/* Work Form Modal */}
      <EnhancedWorkForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSaveWork}
        editingWork={editingWork}
      />

      {/* Files Modal */}
      <Modal
        isOpen={filesModalOpen}
        onClose={() => setFilesModalOpen(false)}
        title={selectedWork ? `Files for "${selectedWork.title}"` : "Work Files"}
        size="large"
      >
        {selectedWork && (
          <div>
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900">{selectedWork.title}</h3>
              <p className="text-sm text-gray-600">Customer: {selectedWork.customer_name || 'No Customer'}</p>
              {selectedWork.category_name && (
                <div className="mt-2">
                  <span 
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border"
                    style={{ 
                      backgroundColor: `${selectedWork.category_color}20`,
                      borderColor: selectedWork.category_color,
                      color: selectedWork.category_color
                    }}
                  >
                    <span style={{ color: selectedWork.category_color }}>●</span>
                    {selectedWork.category_name}
                  </span>
                </div>
              )}
            </div>
            
            <WorkFileUpload
              workId={selectedWork.id}
              files={workFiles}
              onFilesUpdate={handleFilesUpdate}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
