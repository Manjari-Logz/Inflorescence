import { useEffect } from 'react';
import { useAuth } from '@/template';
import { useTasks } from '@/hooks/useTasks';
import { notificationsService } from '@/services/notificationsService';

export function NotificationInitializer() {
  const { user } = useAuth();
  const { tasks } = useTasks();

  useEffect(() => {
    if (!user) return;
    let isActive = true;
    (async () => {
      try {
        await notificationsService.registerForPush(user.id);
      } catch (err) {
        console.warn('[NotificationInitializer] registerForPush error:', err);
      }
      
      if (!isActive) return;
      
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
