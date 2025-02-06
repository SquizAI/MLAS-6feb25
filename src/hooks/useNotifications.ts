import { useState, useEffect } from 'react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  timestamp: Date;
  read: boolean;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Update unread count whenever notifications change
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    markAsRead: (id: string) => {
      setNotifications(prev =>
        prev.map(n =>
          n.id === id ? { ...n, read: true } : n
        )
      );
    },
    clearAll: () => {
      setNotifications([]);
    },
  };
}