import { useEffect } from 'react';
import { useAuth } from '@/template';
import { useTasks } from '@/hooks/useTasks';
import { notificationsService } from '@/services/notificationsService';

export function NotificationInitializer() {
  const { user } = useAuth();
  const { tasks } = useTasks();

  useEffect(() => {
    if (!user) return;
    (async () => {
      await notificationsService.registerForPush(user.id);
      await notificationsService.scheduleAllReminders(
        tasks.filter(t => !t.completed && !t.archived).map(t => ({ title: t.title, deadline: t.deadline })),
      );
    })();
  }, [user?.id, tasks.length]);

  return null;
}
