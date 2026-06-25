import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { getSupabaseClient } from '@/template';

// Helper to run promises with a timeout to prevent startup blocking or infinite wait
const withTimeout = <T>(promise: Promise<T>, ms = 3000, fallback: T): Promise<T> => {
  let timeoutId: any;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Operation timed out')), ms);
  });
  return Promise.race([promise, timeoutPromise])
    .then((result) => {
      clearTimeout(timeoutId);
      return result;
    })
    .catch((err) => {
      clearTimeout(timeoutId);
      console.warn('[notificationsService] Safe operation failed/timed out:', err);
      return fallback;
    });
};

try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch (e) {
  console.warn('[notificationsService] Failed to set notification handler:', e);
}

export const notificationsService = {
  async requestPermissions(): Promise<boolean> {
    try {
      if (!Device.isDevice) return false;
      const existing = await withTimeout(
        Notifications.getPermissionsAsync(),
        2000,
        { status: 'undetermined' } as any
      );
      if (existing.status === 'granted') return true;
      
      const requested = await withTimeout(
        Notifications.requestPermissionsAsync(),
        3000,
        { status: 'denied' } as any
      );
      return requested.status === 'granted';
    } catch (e) {
      console.warn('[notificationsService] Error requesting notification permissions:', e);
      return false;
    }
  },

  async registerForPush(userId: string): Promise<string | null> {
    try {
      // Detect if running inside Expo Go (official SDK 53 detection)
      let isExpoGo = false;
      try {
        isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
      } catch (err) {
        console.warn('[notificationsService] Error checking environment:', err);
      }

      if (isExpoGo) {
        console.warn('[notificationsService] DEVELOPER WARNING: Remote push notifications require a custom Development Build in Expo SDK 53+ and are unsupported in Expo Go. Skipping remote push registration. Local notifications will still function.');
        return null;
      }

      // Check if it is a physical device
      if (!Device.isDevice) {
        console.log('[notificationsService] Not a physical device. Skipping remote push registration.');
        return null;
      }

      const granted = await this.requestPermissions();
      if (!granted) {
        console.log('[notificationsService] Notification permissions not granted.');
        return null;
      }

      if (Platform.OS === 'android') {
        await withTimeout(
          Notifications.setNotificationChannelAsync('default', {
            name: 'Inflorescence',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            sound: 'default',
          }),
          2000,
          null
        );
      }

      // In Expo SDK 53, projectId from extra.eas.projectId is required
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      const tokenData = await withTimeout(
        Notifications.getExpoPushTokenAsync({ projectId }),
        5000,
        null
      );
      
      if (!tokenData) {
        console.warn('[notificationsService] Push token acquisition timed out or failed.');
        return null;
      }

      const token = tokenData.data;
      const client = getSupabaseClient();
      await withTimeout(
        (async () => {
          return await client.from('push_tokens').upsert(
            { user_id: userId, token, platform: Platform.OS },
            { onConflict: 'user_id,token' }
          );
        })(),
        4000,
        null
      );
      return token;
    } catch (error) {
      console.warn('[notificationsService] Error registering remote push token:', error);
      return null;
    }
  },

  async scheduleAllReminders(
    tasks: { title: string; deadline?: string }[] = [],
    habits: { name: string; frequency?: string }[] = [],
    events: { title: string; date?: string }[] = [],
    goals: { title: string; deadline?: string }[] = [],
    productivityScore: number = 75
  ) {
    try {
      await withTimeout(Notifications.cancelAllScheduledNotificationsAsync(), 2000, undefined);
    } catch (e) {
      console.warn('[notificationsService] Error cancelling notifications:', e);
      return; // If notifications API fails, skip scheduling to prevent app lock
    }

    const now = new Date();

    // 1. Morning Summary Reminder — 9 AM Daily
    try {
      await withTimeout(
        Notifications.scheduleNotificationAsync({
          content: {
            title: 'Good Morning!',
            body: `You have ${tasks.filter(t => t.deadline).length} active tasks today. Let's make it a productive day!`,
            sound: true,
          },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 9, minute: 0 } as any,
        }),
        2000,
        null
      );
    } catch (e) {
      console.warn('[notificationsService] Failed to schedule morning summary:', e);
    }

    // 2. Evening Check-in Expense Reminder — 8 PM Daily
    try {
      await withTimeout(
        Notifications.scheduleNotificationAsync({
          content: {
            title: 'Evening Check-in',
            body: 'Track your budget! Remember to log your daily expenses in the Money Vault.',
            sound: true,
          },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 20, minute: 0 } as any,
        }),
        2000,
        null
      );
    } catch (e) {
      console.warn('[notificationsService] Failed to schedule evening check-in:', e);
    }

    // 3. Task Deadline Reminders
    for (const task of tasks.slice(0, 10)) { // limit to avoid clogging notification slots
      if (!task.deadline) continue;
      try {
        const deadline = new Date(task.deadline);
        if (deadline <= now) continue;

        // Schedule reminder for 9 AM on the deadline day
        const triggerDate = new Date(deadline);
        triggerDate.setHours(9, 0, 0, 0);

        if (triggerDate > now) {
          await withTimeout(
            Notifications.scheduleNotificationAsync({
              content: {
                title: 'Task Due Today',
                body: `"${task.title}" is due today. Complete it to keep your productivity score high!`,
                sound: true,
              },
              trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate } as any,
            }),
            2000,
            null
          );
        }
      } catch (e) {
        console.warn(`[notificationsService] Failed to schedule task reminder for ${task.title}:`, e);
      }
    }

    // 4. Habit Reminders — 11 AM Daily for active habits
    if (habits.length > 0) {
      try {
        const habitNames = habits.slice(0, 3).map(h => h.name).join(', ');
        await withTimeout(
          Notifications.scheduleNotificationAsync({
            content: {
              title: 'Habit Tracker Check-in',
              body: `Don't break your streak! Remember to practice: ${habitNames}.`,
              sound: true,
            },
            trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 11, minute: 0 } as any,
          }),
          2000,
          null
        );
      } catch (e) {
        console.warn('[notificationsService] Failed to schedule habit reminders:', e);
      }
    }

    // 5. Event/Hackathon Reminders
    for (const event of events.slice(0, 5)) {
      if (!event.date) continue;
      try {
        const eventDate = new Date(event.date);
        const reminderDate = new Date(eventDate.getTime() - 2 * 60 * 60 * 1000); // 2 hours before
        if (reminderDate > now) {
          await withTimeout(
            Notifications.scheduleNotificationAsync({
              content: {
                title: 'Upcoming Event',
                body: `"${event.title}" starts in 2 hours. Get ready!`,
                sound: true,
              },
              trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: reminderDate } as any,
            }),
            2000,
            null
          );
        }
      } catch (e) {
        console.warn(`[notificationsService] Failed to schedule event reminder for ${event.title}:`, e);
      }
    }

    // 6. Goal Milestones Reminders — Sunday at 6 PM
    if (goals.length > 0) {
      try {
        await withTimeout(
          Notifications.scheduleNotificationAsync({
            content: {
              title: 'Weekly Goals Review',
              body: `Keep eyes on the prize! Review your ${goals.length} active goals and update progress.`,
              sound: true,
            },
            trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: 1, hour: 18, minute: 0 } as any, // 1 = Sunday in expo-notifications depending on locale, or standard
          }),
          2000,
          null
        );
      } catch (e) {
        console.warn('[notificationsService] Failed to schedule goal reminders:', e);
      }
    }

    // 7. Focus Reminders — 2 PM daily
    try {
      await withTimeout(
        Notifications.scheduleNotificationAsync({
          content: {
            title: 'Time for Deep Focus',
            body: 'Block out distractions and take 25 minutes for a focus session now.',
            sound: true,
          },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 14, minute: 0 } as any,
        }),
        2000,
        null
      );
    } catch (e) {
      console.warn('[notificationsService] Failed to schedule focus reminders:', e);
    }

    // 8. Smart Productivity Reminders based on performance score
    try {
      const motivationalMsg = productivityScore >= 80 
        ? 'Amazing job this week! Keep crushing your goals.' 
        : 'Let\'s level up! Completing just 2 tasks today will boost your score.';
      await withTimeout(
        Notifications.scheduleNotificationAsync({
          content: {
            title: 'Productivity Insight',
            body: `Current Score: ${productivityScore}%. ${motivationalMsg}`,
            sound: true,
          },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 16, minute: 30 } as any,
        }),
        2000,
        null
      );
    } catch (e) {
      console.warn('[notificationsService] Failed to schedule smart productivity reminders:', e);
    }
  },

  async scheduleDeadlineReminder(title: string, deadline: Date) {
    try {
      const triggerDate = new Date(deadline);
      triggerDate.setHours(8, 0, 0, 0);
      if (triggerDate <= new Date()) return;
      await withTimeout(
        Notifications.scheduleNotificationAsync({
          content: { title: 'Deadline Reminder', body: `"${title}" deadline is approaching!` },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate } as any,
        }),
        2000,
        null
      );
    } catch (error) {
      console.warn('[notificationsService] Error scheduling deadline reminder:', error);
    }
  },

  async sendLocal(title: string, body: string) {
    try {
      await withTimeout(
        Notifications.scheduleNotificationAsync({
          content: { title, body, sound: true },
          trigger: null,
        }),
        2000,
        null
      );
    } catch (error) {
      console.warn('[notificationsService] Error sending local notification:', error);
    }
  },
};
