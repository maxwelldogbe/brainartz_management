import React, { useState, useRef } from 'react';
import { workFilesAPI } from '../utils/services';

export default function WorkFileUpload({ workId, files = [], onFilesUpdate }) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (fileList) => {
    if (!fileList.length) return;

    setUploading(true);
    
    try {
      const result = await workFilesAPI.bulkUpload(workId, fileList);
      
      if (result.uploaded && result.uploaded.length > 0) {
        showSuccess(`${result.uploaded.length} file${result.uploaded.length !== 1 ? 's' : ''} uploaded successfully`);
      }
      
      if (result.errors && result.errors.length > 0) {
        console.warn('Upload errors:', result.errors);
        showWarning(`${result.errors.length} file${result.errors.length !== 1 ? 's' : ''} failed to upload`);
      }
      
      onFilesUpdate?.(); // Refresh files list
    } catch (error) {
      console.error('Upload error:', error);
      showError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFileUpload(droppedFiles);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    handleFileUpload(selectedFiles);
  };

  const handleFileDelete = async (fileId) => {
    if (!confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      await workFilesAPI.delete(fileId);
      showSuccess('File deleted successfully');
      onFilesUpdate?.();
    } catch (error) {
      console.error('Delete error:', error);
      showError('Failed to delete file');
    }
  };

  // Helper functions for notifications (you might want to use a proper toast system)
  const showSuccess = (message) => {
    // Replace with your notification system
    alert('✅ ' + message);
  };

  const showError = (message) => {
    // Replace with your notification system
    alert('❌ ' + message);
  };

  const showWarning = (message) => {
    // Replace with your notification system
    alert('⚠️ ' + message);
  };

  return (
    <div className="work-file-upload-section">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          📁 Work Files
          {files.length > 0 && (
            <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              {files.length}
            </span>
          )}
        </h4>
      </div>
      
      {/* Upload Area */}
      <div 
        className={`file-drop-zone border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
          dragOver 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        } ${uploading ? 'pointer-events-none opacity-75' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        <div className="upload-content">
          {uploading ? (
            <div className="uploading flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-blue-600 font-medium">Uploading files...</p>
            </div>
          ) : (
            <>
              <div className="upload-icon text-4xl mb-3">📤</div>
              <p className="text-lg font-medium text-gray-700 mb-2">
                Drop files here or click to browse
              </p>
              <p className="text-sm text-gray-500">
                Supports: PDF, DOC, DOCX, Images, TXT, ZIP (Max 10MB each)
              </p>
            </>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.zip,.rar,.xlsx,.xls"
      />

      {/* Files List */}
      <div className="files-list mt-6">
        {files.length > 0 ? (
          <div className="space-y-3">
            {files.map(file => (
              <FileItem 
                key={file.id} 
                file={file} 
                onDelete={() => handleFileDelete(file.id)}
              />
            ))}
          </div>
        ) : (
          <div className="no-files text-center py-8 text-gray-500">
            <div className="text-3xl mb-2">📂</div>
            <p>No files uploaded yet</p>
            <p className="text-sm">Upload files to organize work documents</p>
          </div>
        )}
      </div>
    </div>
  );
}

function FileItem({ file, onDelete }) {
  const getFileIcon = (fileType) => {
    const icons = {
      'PDF Document': '📄',
      'Word Document': '📝', 
      'Excel Spreadsheet': '📊',
      'Image': '🖼️',
      'Text File': '📄',
      'Archive': '📦',
      'PowerPoint': '📊'
    };
    return icons[fileType] || '📄';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="file-item flex items-center justify-between p-4 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors">
      <div className="file-info flex items-center gap-4">
        <span className="file-icon text-2xl">
          {getFileIcon(file.file_type)}
        </span>
        <div className="file-details">
          <div className="file-name font-medium text-gray-900 truncate max-w-xs">
            {file.original_name}
          </div>
          <div className="file-meta flex items-center gap-3 text-sm text-gray-500">
            <span className="file-type">{file.file_type}</span>
            <span className="file-size">
              {file.file_size_display || formatFileSize(file.file_size || 0)}
            </span>
            <span className="upload-date">
              {new Date(file.uploaded_at).toLocaleDateString()}
            </span>
          </div>
          {file.description && (
            <div className="file-description text-sm text-gray-600 mt-1">
              {file.description}
            </div>
          )}
        </div>
      </div>
      
      <div className="file-actions flex items-center gap-2">
        <button 
          className="btn-download px-3 py-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1"
          onClick={() => window.open(file.file_url, '_blank')}
          title="Download file"
        >
          📥 Download
        </button>
        <button 
          className="btn-delete px-3 py-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
          onClick={onDelete}
          title="Delete file"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}