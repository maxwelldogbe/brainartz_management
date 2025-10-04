import React from 'react';
import Alert from './Alert';

// Temporary component to show when backend endpoints are not yet implemented
export function BackendNotImplemented({ feature, endpoint, onClose }) {
  return (
    <Alert type="warning" title={`${feature} - Backend Not Ready`} onClose={onClose}>
      <div className="space-y-2">
        <p>This feature requires backend implementation.</p>
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-xs">
          <p><strong>Missing Endpoint:</strong> <code>{endpoint}</code></p>
          <p><strong>Status:</strong> Backend development needed</p>
        </div>
        <p className="text-sm">
          The frontend is ready, but the backend API endpoints need to be created.
          Contact your backend developer to implement the employee management system.
        </p>
      </div>
    </Alert>
  );
}