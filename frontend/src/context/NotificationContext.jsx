import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user, accessToken } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState('disconnected'); // disconnected, connecting, connected, reconnecting
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 10;
  const baseReconnectDelay = 1000; // 1 second
  
  const playNotificationSound = useCallback(() => {
    if (soundEnabled) {
      try {
        // Create a simple beep sound using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      } catch (error) {
      }
    }
  }, [soundEnabled]);
  
  const showBrowserNotification = useCallback((notification) => {
    
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        // Get notification type icon/badge color
        const getIcon = (type) => {
          switch(type) {
            case 'new_work': return '🆕';
            case 'work_completed': return '✅';
            case 'work_reopened': return '🔄';
            default: return '🔔';
          }
        };
        
        const browserNotif = new Notification(notification.title, {
          body: notification.message,
          icon: '/logo.png',
          badge: '/logo.png',
          tag: `notification-${notification.id}`,
          requireInteraction: true, // Notification stays until user interacts
          vibrate: [200, 100, 200], // Vibration pattern for mobile
          data: {
            notificationId: notification.id,
            workOrderId: notification.work_order_id,
            url: notification.work_order_id ? `/portal/works?id=${notification.work_order_id}` : '/portal/notifications'
          }
        });
        
        // Handle notification click
        browserNotif.onclick = function(event) {
          event.preventDefault();
          window.focus();
          
          // Navigate to the work order or notifications page
          const baseUrl = window.location.origin;
          if (notification.work_order_id) {
            window.location.href = `${baseUrl}/portal/works?id=${notification.work_order_id}`;
          } else {
            window.location.href = `${baseUrl}/portal/notifications`;
          }
          
          browserNotif.close();
        };
        
      } catch (error) {
      }
    } else {
    }
  }, []);
  
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      } catch (error) {
        return false;
      }
    }
    return Notification.permission === 'granted';
  }, []);
  
  const getWebSocketUrl = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = import.meta.env.VITE_API_URL 
      ? new URL(import.meta.env.VITE_API_URL).host 
      : window.location.host;
    return `${protocol}//${host}/ws/notifications/?token=${accessToken}`;
  }, [accessToken]);
  
  const connectWebSocket = useCallback(() => {
    if (!user || !accessToken) {
      return;
    }
    
    if (wsRef.current?.readyState === WebSocket.OPEN || 
        wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }
    
    setConnectionState('connecting');
    
    try {
      const wsUrl = getWebSocketUrl();
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        setIsConnected(true);
        setConnectionState('connected');
        reconnectAttemptsRef.current = 0;
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'connection_established':
              setUnreadCount(data.unread_count || 0);
              break;
              
            case 'notification':
              const newNotification = data.notification;
              setNotifications(prev => {
                return [newNotification, ...prev];
              });
              setUnreadCount(prev => {
                const newCount = prev + 1;
                return newCount;
              });
              playNotificationSound();
              showBrowserNotification(newNotification);
              break;
              
            case 'unread_count':
              setUnreadCount(data.count);
              break;
              
            case 'pong':
              break;
              
            default:
          }
        } catch (error) {
        }
      };
      
      ws.onerror = (error) => {
      };
      
      ws.onclose = (event) => {
        setIsConnected(false);
        wsRef.current = null;
        
        // Attempt reconnection with exponential backoff
        if (user && accessToken && reconnectAttemptsRef.current < maxReconnectAttempts) {
          setConnectionState('reconnecting');
          const delay = Math.min(
            baseReconnectDelay * Math.pow(2, reconnectAttemptsRef.current),
            30000 // Max 30 seconds
          );
          
          reconnectAttemptsRef.current += 1;
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, delay);
        } else {
          setConnectionState('disconnected');
        }
      };
      
      wsRef.current = ws;
      
      // Send periodic ping to keep connection alive
      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000); // Every 30 seconds
      
      // Store interval ID for cleanup
      ws.pingInterval = pingInterval;
      
    } catch (error) {
      setConnectionState('disconnected');
    }
  }, [user, accessToken, getWebSocketUrl, playNotificationSound, showBrowserNotification]);
  
  const disconnectWebSocket = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      if (wsRef.current.pingInterval) {
        clearInterval(wsRef.current.pingInterval);
      }
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionState('disconnected');
    reconnectAttemptsRef.current = 0;
  }, []);
  
  const markAsRead = useCallback((notificationId) => {
    
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'mark_read',
        notification_id: notificationId
      }));
    }
    
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
    
    // Manually decrement unread count
    setUnreadCount(prev => {
      const newCount = Math.max(0, prev - 1);
      return newCount;
    });
  }, []);
  
  const markAllAsRead = useCallback(() => {
    
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'mark_all_read'
      }));
    }
    
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }, []);
  
  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => !prev);
  }, []);
  
  // Fetch initial unread count
  useEffect(() => {
    const fetchInitialUnreadCount = async () => {
      if (!user || !accessToken) return;
      
      try {
        const response = await fetch('/api/services/notifications/unread_count/', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setUnreadCount(data.count || 0);
        }
      } catch (error) {
      }
    };
    
    fetchInitialUnreadCount();
  }, [user, accessToken]);
  
  // Connect/disconnect based on auth state
  useEffect(() => {
    if (user && accessToken) {
      connectWebSocket();
    } else {
      disconnectWebSocket();
    }
    
    return () => {
      disconnectWebSocket();
    };
  }, [user, accessToken]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectWebSocket();
    };
  }, [disconnectWebSocket]);
  
  const value = {
    notifications,
    unreadCount,
    isConnected,
    connectionState,
    soundEnabled,
    markAsRead,
    markAllAsRead,
    toggleSound,
    requestNotificationPermission,
    setNotifications,
  };
  
  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
