import { useContext } from 'react';
import { NotificationsContext } from '@/contexts/NotificationsContext';

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    return {
      notifications: [],
      unreadCount: 0,
      loading: false,
      addNotification: async () => {},
      markRead: async () => {},
      markAllRead: async () => {},
      deleteNotification: async () => {},
      clearAll: async () => {},
      refresh: async () => {},
    };
  }
  return ctx;
}
