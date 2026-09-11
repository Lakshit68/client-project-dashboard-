import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { ActivityLog, NotificationItem } from '../types';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineCount: number;
  activities: ActivityLog[];
  notifications: NotificationItem[];
  unreadCount: number;
  fetchMissedActivities: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { accessToken, user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch last 20 activity logs from DB for missed events recovery
  const fetchMissedActivities = async () => {
    if (!accessToken) return;
    try {
      const res = await fetch('/api/activity', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities);
      }
    } catch (err) {
      console.error('Failed to fetch activity history:', err);
    }
  };

  const fetchNotifications = async () => {
    if (!accessToken) return;
    try {
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  const markNotificationRead = async (id: string) => {
    if (!accessToken) return;
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markAllNotificationsRead = async () => {
    if (!accessToken) return;
    try {
      const res = await fetch('/api/notifications/read-all', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!accessToken || !user) {
      if (socket) socket.disconnect();
      setSocket(null);
      setIsConnected(false);
      return;
    }

    // Load initial DB state
    fetchMissedActivities();
    fetchNotifications();

    // Establish WebSocket Connection
    const socketInstance = io(window.location.origin, {
      auth: { token: accessToken },
      transports: ['websocket'],
    });

    socketInstance.on('connect', () => {
      console.log('⚡ Socket connected to server');
      setIsConnected(true);
    });

    socketInstance.on('presence:update', (data: { onlineCount: number }) => {
      setOnlineCount(data.onlineCount);
    });

    socketInstance.on('activity:new', (newActivity: ActivityLog) => {
      setActivities((prev) => [newActivity, ...prev.slice(0, 19)]);
    });

    socketInstance.on('notification:new', (newNotif: NotificationItem) => {
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    socketInstance.on('disconnect', () => {
      console.log('⚡ Socket disconnected');
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [accessToken, user]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        onlineCount,
        activities,
        notifications,
        unreadCount,
        fetchMissedActivities,
        fetchNotifications,
        markNotificationRead,
        markAllNotificationsRead,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within a SocketProvider');
  return context;
};
