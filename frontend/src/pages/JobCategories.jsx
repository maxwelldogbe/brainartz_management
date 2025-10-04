import React, { useState, useEffect } from 'react';
import { jobCategoriesAPI } from '../utils/services';
import JobCategoryForm from '../components/JobCategoryForm';
import { Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';

export default function JobCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await jobCategoriesAPI.getAll();
      setCategories(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingCategory(null);
    setFormOpen(true);
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormOpen(true);
  };

  const handleSave = (savedCategory) => {
    if (editingCategory) {
      // Update existing
      setCategories(prev => prev.map(cat => 
        cat.id === savedCategory.id ? savedCategory : cat
      ));
    } else {
      // Add new
      setCategories(prev => [savedCategory, ...prev]);
    }
    showSuccess(`Category ${editingCategory ? 'updated' : 'created'} successfully`);
  };

  const handleToggleActive = async (category) => {
    try {
      await jobCategoriesAPI.toggleActive(category.id);
      
      // Update local state
      setCategories(prev => prev.map(cat => 
        cat.id === category.id 
          ? { ...cat, is_active: !cat.is_active }
          : cat
      ));
      
      showSuccess(`Category ${category.is_active ? 'deactivated' : 'activated'}`);
    } catch (error) {
      console.error('Failed to toggle category status:', error);
      showError('Failed to update category status');
    }
  };

  const handleDelete = async (category) => {
    if (!confirm(`Are you sure you want to delete "${category.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await jobCategoriesAPI.delete(category.id);
      setCategories(prev => prev.filter(cat => cat.id !== category.id));
      showSuccess('Category deleted successfully');
    } catch (error) {
      console.error('Failed to delete category:', error);
      showError('Failed to delete category. It may be in use by existing works.');
    }
  };

  // Helper functions for notifications
  const showSuccess = (message) => {
    alert('✅ ' + message);
  };

  const showError = (message) => {
    alert('❌ ' + message);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Categories</h1>
          <p className="text-gray-600 mt-1">Organize your work types for better management</p>
        </div>
        
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
          <button 
            onClick={loadCategories}
            className="mt-2 text-red-600 hover:text-red-800 underline"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Categories Grid */}
      {categories.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏷️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No categories yet</h3>
          <p className="text-gray-500 mb-4">Create your first job category to organize your works</p>
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create First Category
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map(category => (
            <CategoryCard
              key={category.id}
              category={category}
              onEdit={handleEdit}
              onToggleActive={handleToggleActive}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Form Modal */}
      <JobCategoryForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        editingCategory={editingCategory}
      />
    </div>
  );
}

function CategoryCard({ category, onEdit, onToggleActive, onDelete }) {
  return (
    <div className={`category-card bg-white rounded-lg border-2 transition-all hover:shadow-md ${
      category.is_active ? 'border-gray-200' : 'border-gray-100 bg-gray-50'
    }`}>
      <div className="p-6">
        {/* Header with color indicator */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: category.color }}
            />
            <div>
              <h3 className={`font-semibold ${
                category.is_active ? 'text-gray-900' : 'text-gray-500'
              }`}>
                {category.name}
              </h3>
              {!category.is_active && (
                <span className="text-xs text-gray-400">Inactive</span>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {category.description && (
          <p className={`text-sm mb-4 line-clamp-2 ${
            category.is_active ? 'text-gray-600' : 'text-gray-400'
          }`}>
            {category.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between mb-4 text-sm">
          <div className={`flex items-center gap-4 ${
            category.is_active ? 'text-gray-600' : 'text-gray-400'
          }`}>
            <span>📋 {category.works_count || 0} works</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(category)}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="Edit category"
            >
              <Pencil className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => onToggleActive(category)}
              className={`p-2 rounded transition-colors ${
                category.is_active 
                  ? 'text-gray-500 hover:text-orange-600 hover:bg-orange-50'
                  : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
              }`}
              title={category.is_active ? 'Deactivate' : 'Activate'}
            >
              {category.is_active ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
            
            <button
              onClick={() => onDelete(category)}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Delete category"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          
          <div className={`text-xs ${
            category.is_active ? 'text-green-600' : 'text-gray-400'
          }`}>
            {category.is_active ? '● Active' : '○ Inactive'}
          </div>
        </div>
      </div>
    </div>
  );
}