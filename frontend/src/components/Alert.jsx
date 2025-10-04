import React from 'react';

export default function Alert({ type = 'info', title, children, onClose, className = '' }) {
  const baseClasses = 'rounded-lg p-4 mb-4 border';
  
  const typeClasses = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  return (
    <div className={`${baseClasses} ${typeClasses[type]} ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2">
          <span className="text-lg mt-0.5">{icons[type]}</span>
          <div className="flex-1">
            {title && (
              <h4 className="font-semibold mb-1">{title}</h4>
            )}
            <div className="text-sm">
              {children}
            </div>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-4 text-current hover:opacity-70 transition-opacity"
            aria-label="Close alert"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}