import React from 'react';
import { X } from 'lucide-react';

export default function Modal({ 
  isOpen, 
  open, // backward compatibility
  onClose, 
  title, 
  children, 
  size = 'default' 
}) {
  const modalOpen = isOpen !== undefined ? isOpen : open;
  
  if (!modalOpen) return null;

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'max-w-md';
      case 'large':
        return 'max-w-4xl';
      case 'xl':
        return 'max-w-6xl';
      case 'full':
        return 'max-w-screen-xl';
      default:
        return 'max-w-2xl';
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className={`bg-white rounded-lg shadow-xl w-full ${getSizeClasses()} max-h-[90vh] overflow-hidden`}>
        {title && (
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {children}
        </div>
      </div>
    </div>
  );
}
