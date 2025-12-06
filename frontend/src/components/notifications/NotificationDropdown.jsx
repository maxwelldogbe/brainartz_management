import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import NotificationItem from './NotificationItem';
import api from '../../utils/axios';

const NotificationDropdown = ({ onClose }) => {
  const navigate = useNavigate();
  const { notifications, markAllAsRead, soundEnabled, toggleSound, setNotifications, requestNotificationPermission } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  const recentNotifications = notifications.slice(0, 5);
  
  useEffect(() => {
    // Fetch initial notifications if empty
    if (notifications.length === 0) {
      fetchNotifications();
    }
  }, []);
  
  const fetchNotifications = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      const response = await api.get('/api/services/notifications/', {
        params: { limit: 10, offset: 0 }
      });
      setNotifications(response.data.results || response.data);
      setHasMore(response.data.next != null);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };
  
  const handleMarkAllRead = async () => {
    try {
      await api.post('/api/services/notifications/mark_all_read/');
      markAllAsRead();
    } catch (error) {
    }
  };
  
  const handleViewAll = () => {
    navigate('/portal/notifications');
    onClose();
  };
  
  const handleNotificationClick = (notification) => {
    const type = notification.type || notification.notification_type;
    
    // Work notifications
    if (notification.work_order_id) {
      navigate(`/portal/works?id=${notification.work_order_id}`);
      onClose();
      return;
    }
    
    // Inventory notifications
    if (type === 'low_stock' || type === 'material_pickup' || type === 'material_request') {
      navigate('/portal/inventory/materials');
      onClose();
      return;
    }
    
    if (type === 'procurement_created' || type === 'procurement_delivered') {
      if (notification.procurement_id) {
        navigate(`/portal/inventory/procurements?id=${notification.procurement_id}`);
      } else {
        navigate('/portal/inventory/procurements');
      }
      onClose();
      return;
    }
    
    // Default - go to notifications page
    navigate('/portal/notifications');
    onClose();
  };
  
  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      // Show a test notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🔔 Notifications Enabled!', {
          body: 'You will now receive desktop notifications.',
          icon: '/logo.png',
        });
      }
    }
  };

  const notificationPermission = 'Notification' in window ? Notification.permission : 'denied';

  return (
    <div className="notification-dropdown">
      <div className="notification-dropdown-header">
        <h3>Notifications</h3>
        <div className="notification-actions">
          <button
            className="icon-button"
            onClick={toggleSound}
            title={soundEnabled ? 'Mute sounds' : 'Unmute sounds'}
          >
            {soundEnabled ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="icon">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="icon">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
              </svg>
            )}
          </button>
          {recentNotifications.some(n => !n.is_read) && (
            <button
              className="text-button"
              onClick={handleMarkAllRead}
            >
              Mark all read
            </button>
          )}
        </div>
      </div>
      
      {/* Desktop Notification Banner */}
      {notificationPermission !== 'granted' && (
        <div className="notification-permission-banner">
          <div className="banner-content">
            <span className="banner-icon">🔔</span>
            <div className="banner-text">
              <strong>Enable Desktop Notifications</strong>
              <p>Get alerts even when you're away</p>
            </div>
          </div>
          <button className="banner-button" onClick={handleEnableNotifications}>
            Enable
          </button>
        </div>
      )}
      
      <div className="notification-dropdown-body">
        {loading && notifications.length === 0 ? (
          <div className="notification-loading">Loading...</div>
        ) : recentNotifications.length > 0 ? (
          <>
            {recentNotifications.map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={() => handleNotificationClick(notification)}
              />
            ))}
          </>
        ) : (
          <div className="notification-empty">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="empty-icon">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            <p>No notifications yet</p>
          </div>
        )}
      </div>
      
      {recentNotifications.length > 0 && (
        <div className="notification-dropdown-footer">
          <button className="view-all-button" onClick={handleViewAll}>
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
