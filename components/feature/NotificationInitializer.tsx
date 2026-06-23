import { useEffect } from 'react';
import { useAuth } from '@/template';
import { useTasks } from '@/hooks/useTasks';
import { notificationsService } from '@/services/notificationsService';
import Constants, { ExecutionEnvironment } from 'expo-constants';

export function NotificationInitializer() {
  const { user } = useAuth();
  const { tasks } = useTasks();

  useEffect(() => {
    if (!user) return;
    // Skip push registration in Expo Go (SDK 53) as it does not support remote notifications.
    if (Constants.executionEnvironment === ExecutionEnvironment.ExpoGo) {
      console.log('[NotificationInitializer] Skipping push registration in Expo Go');
    } else {
      (async () => {
        try {
          await notificationsService.registerForPush(user.id);
        } catch (err) {
          console.warn('[NotificationInitializer] registerForPush error:', err);
        }
      })();
    }
    let isActive = true;
    (async () => {
      // Schedule reminders only after ensuring registration (or skipping in Expo Go)
      try {
        const filteredTasks = (tasks || []).filter(t => t && !t.completed && !t.archived).map(t => ({
          title: t.title,
          deadline: t.deadline
        }));
        await notificationsService.scheduleAllReminders(filteredTasks);
      } catch (err) {
        console.warn('[NotificationInitializer] scheduleAllReminders error:', err);
      }
    })();
    return () => {
      isActive = false;
    };
  }, [user?.id, tasks?.length]);

  return null;
}
