import React from 'react';
import { Pencil, CheckCircle, RotateCcw, FolderOpen, User, Calendar, Banknote, Check, Clock, ClipboardList } from 'lucide-react';

export default function EnhancedWorkCard({ 
  work, 
  onEdit, 
  onToggleComplete, 
  onViewFiles,
  isUpdating = false
}) {
  const getStatusColor = (status) => {
    const colors = {
      'completed': '#10B981',
      'in_progress': '#F59E0B', 
      'pending': '#6B7280'
    };
    return colors[status] || colors.pending;
  };

  const getStatusIcon = (status) => {
    const icons = {
      'completed': <Check className="h-4 w-4" />,
      'in_progress': <Clock className="h-4 w-4" />,
      'pending': <ClipboardList className="h-4 w-4" />
    };
    return icons[status] || icons.pending;
  };

  const getStatusText = (work) => {
    if (work.completed) return 'completed';
    if (work.worker) return 'in_progress';
    return 'pending';
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS'
    }).format(price);
  };

  const status = getStatusText(work);
  
  return (
    <div className="work-card bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {work.title || 'Untitled Work'}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <User className="h-4 w-4 text-gray-400" />
              <p className="text-sm text-gray-600 truncate">
                {work.customer_name || 'No Customer'}
              </p>
            </div>
          </div>
          
          <div className="ml-4">
            <span 
              className="inline-flex items-center justify-center p-2 rounded-full text-white"
              style={{ backgroundColor: getStatusColor(status) }}
              title={status.replace('_', ' ').toUpperCase()}
            >
              {getStatusIcon(status)}
            </span>
          </div>
        </div>

        {/* Category */}
        {work.category_name && (
          <div className="mb-3">
            <span 
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border"
              style={{ 
                backgroundColor: `${work.category_color}20`,
                borderColor: work.category_color,
                color: work.category_color
              }}
            >
              <span style={{ color: work.category_color }}>●</span>
              {work.category_name}
            </span>
          </div>
        )}

        {/* Description */}
        <div className="mb-4">
          <p className="text-gray-700 text-sm line-clamp-3">
            {work.description}
          </p>
        </div>

        {/* Worker Assignment */}
        {work.worker_name && (
          <div className="mb-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              {/* <span className="text-blue-600">👷</span> */}
              <span>Assigned to: <strong>{work.worker_name}</strong></span>
            </div>
          </div>
        )}

        {/* Meta Information */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Banknote className="h-4 w-4" />
            <span className="font-semibold text-gray-900">
              {formatPrice(work.price)}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>
              {new Date(work.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Files Info */}
        {work.files_count > 0 && (
          <div className="mb-4">
            <button 
              className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
              onClick={() => onViewFiles(work)}
            >
              <FolderOpen className="h-4 w-4" />
              {work.files_count} file{work.files_count !== 1 ? 's' : ''}
            </button>
          </div>
        )}

        {/* Internal Notes */}
        {work.note && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <div className="flex items-start gap-2">
              <span className="text-yellow-600 text-sm font-medium">Note:</span>
              <p className="text-sm text-yellow-800">{work.note}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onEdit(work)}
              className="inline-flex items-center justify-center p-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </button>
            
            {work.files_count === 0 && (
              <button 
                onClick={() => onViewFiles(work)}
                className="inline-flex items-center justify-center p-2 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                title="Add Files"
              >
                <FolderOpen className="h-4 w-4" />
              </button>
            )}
          </div>
          
          <button 
            onClick={() => onToggleComplete(work)}
            disabled={isUpdating}
            className={`inline-flex items-center justify-center p-2 rounded-md transition-colors ${
              isUpdating
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : work.completed 
                ? 'text-orange-700 bg-orange-50 hover:bg-orange-100' 
                : 'text-green-700 bg-green-50 hover:bg-green-100'
            }`}
            title={isUpdating ? 'Updating...' : work.completed ? 'Reopen' : 'Complete'}
          >
            {isUpdating ? (
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : work.completed ? (
              <RotateCcw className="h-4 w-4" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Work List component for grid display
export function WorkList({ 
  works, 
  onEdit, 
  onToggleComplete, 
  onViewFiles,
  loading = false,
  updatingWorks = new Set()
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-gray-200 rounded-lg h-64"></div>
          </div>
        ))}
      </div>
    );
  }

  if (works.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📋</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No works found</h3>
        <p className="text-gray-500">Create your first work or adjust your filters</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {works.map(work => (
        <EnhancedWorkCard
          key={work.id}
          work={work}
          onEdit={onEdit}
          onToggleComplete={onToggleComplete}
          onViewFiles={onViewFiles}
          isUpdating={updatingWorks.has(work.id)}
        />
      ))}
    </div>
  );
}

// Work table / list view for compact rows
export function WorkTable({
  works,
  onEdit,
  onToggleComplete,
  loading = false,
  updatingWorks = new Set()
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse bg-white rounded-lg p-4 border border-gray-200"></div>
        ))}
      </div>
    );
  }

  if (!works || works.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No works found</h3>
        <p className="text-gray-500">Create your first work or adjust your filters</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {works.map(work => (
        <div key={work.id} className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-900 truncate">{work.title || 'Untitled Work'}</h4>
                <div className="text-xs text-gray-500 truncate">{work.customer_name || 'No Customer'} • {work.category_name || 'Uncategorized'}</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-700 font-medium">{new Intl.NumberFormat('en-GH',{style:'currency',currency:'GHS'}).format(work.price)}</div>
            <div className="text-xs text-gray-500">{new Date(work.created_at).toLocaleDateString()}</div>
            <div>
              <button onClick={() => onEdit(work)} className="px-2 py-1 text-xs bg-gray-100 rounded">Edit</button>
            </div>
            <div>
              <button onClick={() => onToggleComplete(work)} disabled={updatingWorks.has(work.id)} className="px-2 py-1 text-xs rounded bg-green-50 text-green-700">{updatingWorks.has(work.id) ? 'Updating...' : (work.completed ? 'Reopen' : 'Complete')}</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}