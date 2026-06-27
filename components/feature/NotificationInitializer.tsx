import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTasks } from '@/hooks/useTasks';
import { useHabits } from '@/hooks/useHabits';
import { useEvents } from '@/hooks/useEvents';
import { useGoals } from '@/hooks/useGoals';
import { notificationsService } from '@/services/notificationsService';
import Constants, { ExecutionEnvironment } from 'expo-constants';

export function NotificationInitializer() {
  const { user } = useAuth();
  const { tasks } = useTasks();
  const { habits } = useHabits();
  const { hackathons } = useEvents();
  const { shortGoals, longGoals } = useGoals();

  useEffect(() => {
    if (!user) return;
    
    // Skip push registration in Expo Go (SDK 53)
    let isExpoGo = false;
    try {
      isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
    } catch (e) {
      console.warn('[NotificationInitializer] Constants check error:', e);
    }

    if (isExpoGo) {
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

    (async () => {
      try {
        const filteredTasks = (tasks || [])
          .filter(t => t && !t.completed && !t.archived)
          .map(t => ({ title: t.title, deadline: t.deadline }));

        const activeHabits = (habits || [])
          .map(h => ({ name: h.name }));

        const activeEvents = (hackathons || [])
          .map(h => ({ title: h.name, date: h.start_date }));

        const activeGoals = [
          ...(shortGoals || []).map(g => ({ title: g.title, deadline: g.due_date })),
          ...(longGoals || []).map(g => ({ title: g.vision, deadline: g.timeline }))
        ];

        // Compute current productivity score
        const completedCount = (tasks || []).filter(t => t && t.completed).length;
        const totalCount = (tasks || []).length;
        const score = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 75;

        await notificationsService.scheduleAllReminders(
          filteredTasks,
          activeHabits,
          activeEvents,
          activeGoals,
          score
        );
      } catch (err) {
        console.warn('[NotificationInitializer] scheduleAllReminders error:', err);
      }
    })();
  }, [
    user?.id,
    tasks?.length,
    habits?.length,
    hackathons?.length,
    shortGoals?.length,
    longGoals?.length
  ]);

  return null;
}
