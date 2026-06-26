import { useContext } from 'react';
import { NotificationsContext } from '@/contexts/NotificationsContext';

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    console.warn('[useNotifications] must be used within NotificationsProvider. Returning fallback.');
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
