import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from '@/template';
import { notificationsDbService, DbNotification } from '@/services/notificationsDbService';

interface NotificationsContextType {
  notifications: DbNotification[];
  unreadCount: number;
  loading: boolean;
  addNotification: (title: string, body?: string) => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<DbNotification[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await notificationsDbService.fetch(user.id);
    if (data) setNotifications(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) { load(); } else { setNotifications([]); }
  }, [user, load]);

  const addNotification = async (title: string, body?: string) => {
    if (!user) return;
    const { data } = await notificationsDbService.create(user.id, title, body);
    if (data) setNotifications(prev => [data, ...prev]);
  };

  const markRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    await notificationsDbService.markRead(id);
  };

  const markAllRead = async () => {
    if (!user) return;
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    await notificationsDbService.markAllRead(user.id);
  };

  const deleteNotification = async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    await notificationsDbService.remove(id);
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, loading, addNotification, markRead, markAllRead, deleteNotification, refresh: load }}>
      {children}
    </NotificationsContext.Provider>
  );
}
