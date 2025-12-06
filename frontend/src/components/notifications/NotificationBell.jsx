import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import NotificationDropdown from './NotificationDropdown';
import '../../styles/notifications.css';

const NotificationBell = () => {
  const { unreadCount, isConnected, connectionState } = useNotifications();
  const [showDropdown, setShowDropdown] = useState(false);
  const bellRef = useRef(null);
  const dropdownRef = useRef(null);
  
  // Debug: Log unread count changes
  useEffect(() => {
  }, [unreadCount]);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        bellRef.current &&
        !bellRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };
    
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);
  
  const toggleDropdown = () => {
    setShowDropdown(prev => !prev);
  };
  
  return (
    <div className="notification-bell-container">
      <button
        ref={bellRef}
        className={`notification-bell ${unreadCount > 0 ? 'has-unread' : ''}`}
        onClick={toggleDropdown}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="bell-icon"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
          />
        </svg>
        
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        
        {connectionState !== 'connected' && (
          <span
            className={`connection-indicator ${connectionState}`}
            title={`Connection: ${connectionState}`}
          />
        )}
      </button>
      
      {showDropdown && (
        <div ref={dropdownRef}>
          <NotificationDropdown onClose={() => setShowDropdown(false)} />
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
