import React, { useState, useEffect } from 'react';
import { Bell, Plus, CheckCircle, RotateCcw } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import '../../styles/notifications.css';

const NotificationPermissionPrompt = () => {
  const { requestNotificationPermission } = useNotifications();
  const [showPrompt, setShowPrompt] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if we should show the prompt
    const checkPermission = () => {
      if ('Notification' in window) {
        const permission = Notification.permission;
        const dismissed = localStorage.getItem('notification_prompt_dismissed');
        
        // Show prompt if permission is default (not granted or denied) and not dismissed
        if (permission === 'default' && !dismissed) {
          // Show after 2 seconds delay
          setTimeout(() => {
            setShowPrompt(true);
          }, 2000);
        }
      }
    };

    checkPermission();
  }, []);

  const handleEnable = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      setShowPrompt(false);
      // Show a test notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🔔 Notifications Enabled!', {
          body: 'You will now receive real-time work updates.',
          icon: '/logo.png',
          requireInteraction: false,
        });
      }
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setIsDismissed(true);
    localStorage.setItem('notification_prompt_dismissed', 'true');
  };

  const handleLater = () => {
    setShowPrompt(false);
    // Don't set dismissed, will show again next session
  };

  if (!showPrompt || isDismissed) {
    return null;
  }

  return (
    <div className="notification-permission-overlay">
      <div className="notification-permission-prompt">
        <div className="permission-icon">
          <Bell className="h-8 w-8" />
        </div>
        
        <h2>Enable Desktop Notifications?</h2>
        
        <p>
          Get instant alerts for work updates even when you're on another tab or application.
        </p>
        
        {/* <div className="permission-benefits">
          <div className="benefit-item">
            <span className="benefit-icon"><Plus className="h-4 w-4" /></span>
            <span>New work assignments</span>
          </div>
          <div className="benefit-item">
            <span className="benefit-icon"><CheckCircle className="h-4 w-4" /></span>
            <span>Work completion alerts</span>
          </div>
          <div className="benefit-item">
            <span className="benefit-icon"><RotateCcw className="h-4 w-4" /></span>
            <span>Work reopened notices</span>
          </div>
        </div> */}
        
        <div className="permission-actions">
          <button 
            className="btn-primary" 
            onClick={handleEnable}
          >
            Enable Notifications
          </button>
          <button 
            className="btn-secondary" 
            onClick={handleLater}
          >
            Maybe Later
          </button>
          <button 
            className="btn-text" 
            onClick={handleDismiss}
          >
            Don't Ask Again
          </button>
        </div>
        
        <p className="permission-note">
          You can change this setting anytime in your browser preferences.
        </p>
      </div>
    </div>
  );
};

export default NotificationPermissionPrompt;
