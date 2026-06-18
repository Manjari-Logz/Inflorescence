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
      await notificationsService.scheduleDailyReminder(9, 0);
      await notificationsService.scheduleTaskReminders(
        tasks.filter(t => !t.completed).map(t => ({ title: t.title, deadline: t.deadline })),
      );
    })();
  }, [user?.id, tasks.length]);

  return null;
}
