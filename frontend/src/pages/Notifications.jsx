import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import NotificationItem from '../components/notifications/NotificationItem';
import api from '../utils/axios';
import '../styles/notifications.css';

const Notifications = () => {
  const navigate = useNavigate();
  const { notifications, setNotifications, markAllAsRead } = useNotifications();
  
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, unread, new_work, work_reopened, work_completed
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  
  const limit = 20;
  
  const fetchNotifications = useCallback(async (pageNum = 1, filterType = 'all') => {
    setLoading(true);
    try {
      const params = {
        limit,
        offset: (pageNum - 1) * limit,
      };
      
      if (filterType === 'unread') {
        params.is_read = false;
      } else if (filterType !== 'all') {
        params.type = filterType;
      }
      
      const response = await api.get('/api/services/notifications/', { params });
      
      const newNotifications = response.data.results || response.data;
      
      if (pageNum === 1) {
        setNotifications(newNotifications);
      } else {
        setNotifications(prev => [...prev, ...newNotifications]);
      }
      
      setHasMore(response.data.next != null);
      setTotalCount(response.data.count || newNotifications.length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [setNotifications]);
  
  useEffect(() => {
    fetchNotifications(1, filter);
  }, [filter, fetchNotifications]);
  
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPage(1);
  };
  
  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(nextPage, filter);
  };
  
  const handleMarkAllRead = async () => {
    try {
      await api.post('/api/services/notifications/mark_all_read/');
      markAllAsRead();
      fetchNotifications(1, filter);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };
  
  const handleDeleteNotification = async (notificationId) => {
    if (!window.confirm('Are you sure you want to delete this notification?')) {
      return;
    }
    
    try {
      await api.delete(`/api/services/notifications/${notificationId}/`);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setTotalCount(prev => prev - 1);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };
  
  const handleNotificationClick = (notification) => {
    const type = notification.type || notification.notification_type;
    
    // Work notifications
    if (notification.work_order_id) {
      navigate(`/portal/works?id=${notification.work_order_id}`);
      return;
    }
    
    // Inventory notifications
    if (type === 'low_stock' || type === 'material_pickup' || type === 'material_request') {
      navigate('/portal/inventory/materials');
      return;
    }
    
    if (type === 'procurement_created' || type === 'procurement_delivered') {
      if (notification.procurement_id) {
        navigate(`/portal/inventory/procurements?id=${notification.procurement_id}`);
      } else {
        navigate('/portal/inventory/procurements');
      }
      return;
    }
  };
  
  const filteredNotifications = notifications;
  const unreadCount = filteredNotifications.filter(n => !n.is_read).length;
  
  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <div className="header-top">
          <h1>Notifications</h1>
          {unreadCount > 0 && (
            <button className="btn-secondary" onClick={handleMarkAllRead}>
              Mark all as read ({unreadCount})
            </button>
          )}
        </div>
        
        <div className="notifications-filters">
          <button
            className={`filter-button ${filter === 'all' ? 'active' : ''}`}
            onClick={() => handleFilterChange('all')}
          >
            All
            {filter === 'all' && ` (${totalCount})`}
          </button>
          <button
            className={`filter-button ${filter === 'unread' ? 'active' : ''}`}
            onClick={() => handleFilterChange('unread')}
          >
            Unread
            {filter === 'unread' && unreadCount > 0 && ` (${unreadCount})`}
          </button>
          <button
            className={`filter-button ${filter === 'new_work' ? 'active' : ''}`}
            onClick={() => handleFilterChange('new_work')}
          >
            New Work
          </button>
          <button
            className={`filter-button ${filter === 'work_reopened' ? 'active' : ''}`}
            onClick={() => handleFilterChange('work_reopened')}
          >
            Reopened
          </button>
          <button
            className={`filter-button ${filter === 'work_completed' ? 'active' : ''}`}
            onClick={() => handleFilterChange('work_completed')}
          >
            Completed
          </button>
          <button
            className={`filter-button ${filter === 'low_stock' ? 'active' : ''}`}
            onClick={() => handleFilterChange('low_stock')}
          >
             Low Stock
          </button>
          <button
            className={`filter-button ${filter === 'material_pickup' ? 'active' : ''}`}
            onClick={() => handleFilterChange('material_pickup')}
          >
            Pickups
          </button>
          <button
            className={`filter-button ${filter === 'procurement_delivered' ? 'active' : ''}`}
            onClick={() => handleFilterChange('procurement_delivered')}
          >
            Deliveries
          </button>
        </div>
      </div>
      
      <div className="notifications-list">
        {loading && page === 1 ? (
          <div className="notifications-loading">
            <div className="spinner"></div>
            <p>Loading notifications...</p>
          </div>
        ) : filteredNotifications.length > 0 ? (
          <>
            {filteredNotifications.map(notification => (
              <div key={notification.id} className="notification-list-item">
                <NotificationItem
                  notification={notification}
                  onClick={() => handleNotificationClick(notification)}
                />
                <button
                  className="delete-notification"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteNotification(notification.id);
                  }}
                  title="Delete notification"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
            ))}
            
            {hasMore && (
              <div className="load-more-container">
                <button
                  className="btn-secondary"
                  onClick={handleLoadMore}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Load more'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="notifications-empty">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="empty-icon">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            <h2>No notifications</h2>
            <p>
              {filter === 'unread' 
                ? "You're all caught up! No unread notifications."
                : filter !== 'all'
                ? `No ${filter.replace('_', ' ')} notifications found.`
                : "You don't have any notifications yet."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
