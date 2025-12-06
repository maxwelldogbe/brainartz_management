import React from 'react';
import { Search, Filter, X } from 'lucide-react';

export default function WorkFilters({ filters, onFiltersChange, categories = [], workers = [] }) {
  const handleFilterChange = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.keys(filters).some(key => 
    filters[key] !== null && filters[key] !== undefined && filters[key] !== ''
  );

  return (
    <div className="work-filters bg-white rounded-lg border p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-500" />
          <h3 className="font-medium text-gray-900">Filters</h3>
          {hasActiveFilters && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              Active
            </span>
          )}
        </div>
        
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="h-4 w-4" />
            Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {/* Search */}
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title or customer..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            value={filters.category || ''}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Worker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Worker
          </label>
          <select
            value={filters.worker || ''}
            onChange={(e) => handleFilterChange('worker', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Workers</option>
            <option value="unassigned">Unassigned</option>
            {workers.map(worker => (
              <option key={worker.id} value={worker.id}>
                {worker.first_name && worker.last_name 
                  ? `${worker.first_name} ${worker.last_name}` 
                  : worker.username}
              </option>
            ))}
          </select>
        </div>

        {/* Completion Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Completion
          </label>
          <select
            value={filters.completed !== undefined ? filters.completed.toString() : ''}
            onChange={(e) => handleFilterChange('completed', 
              e.target.value === '' ? undefined : e.target.value === 'true'
            )}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Works</option>
            <option value="false">Incomplete</option>
            <option value="true">Completed</option>
          </select>
        </div>
      </div>

      {/* Price Range Filter */}
      <div className="mt-4 pt-4 border-t">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Price Range
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="Min"
            value={filters.min_price || ''}
            onChange={(e) => handleFilterChange('min_price', e.target.value)}
            className="w-24 px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <span className="text-gray-500">—</span>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="Max"
            value={filters.max_price || ''}
            onChange={(e) => handleFilterChange('max_price', e.target.value)}
            className="w-24 px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-600">Active filters:</span>
            
            {filters.search && (
              <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                Search: "{filters.search}"
                <button
                  onClick={() => handleFilterChange('search', '')}
                  className="hover:text-blue-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            
            {filters.category && (
              <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                Category: {categories.find(c => c.id === parseInt(filters.category))?.name}
                <button
                  onClick={() => handleFilterChange('category', '')}
                  className="hover:text-green-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            
            {filters.status && (
              <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                Status: {filters.status.replace('_', ' ')}
                <button
                  onClick={() => handleFilterChange('status', '')}
                  className="hover:text-purple-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            
            {filters.worker && (
              <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                Worker: {filters.worker === 'unassigned' ? 'Unassigned' : 
                  workers.find(w => w.id === parseInt(filters.worker))?.username}
                <button
                  onClick={() => handleFilterChange('worker', '')}
                  className="hover:text-orange-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            
            {(filters.min_price || filters.max_price) && (
              <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                Price: GH₵{filters.min_price || '0'} - GH₵{filters.max_price || '∞'}
                <button
                  onClick={() => {
                    handleFilterChange('min_price', '');
                    handleFilterChange('max_price', '');
                  }}
                  className="hover:text-yellow-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}