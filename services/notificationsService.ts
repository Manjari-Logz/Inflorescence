import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { getSupabaseClient } from '@/template';

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
      const { status: existing } = await Notifications.getPermissionsAsync();
      if (existing === 'granted') return true;
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch (e) {
      console.warn('[notificationsService] Error requesting notification permissions:', e);
      return false;
    }
  },

  async registerForPush(userId: string): Promise<string | null> {
    try {
      // Detect if running inside Expo Go
      const isExpoGo =
        Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
        Constants.appOwnership === 'expo' ||
        Constants.expoConfig?.name === 'Expo Go';

      if (isExpoGo) {
        console.log('[notificationsService] Running in Expo Go. Skipping remote push registration.');
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
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Inflorescence',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          sound: 'default',
        });
      }

      // In Expo SDK 53, projectId from extra.eas.projectId is required
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      const token = tokenData.data;
      const client = getSupabaseClient();
      await client.from('push_tokens').upsert({ user_id: userId, token, platform: Platform.OS }, { onConflict: 'user_id,token' });
      return token;
    } catch (error) {
      console.warn('[notificationsService] Error registering remote push token:', error);
      return null;
    }
  },

  async scheduleAllReminders(tasks: { title: string; deadline?: string }[]) {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (e) {
      console.warn('[notificationsService] Error cancelling notifications:', e);
      return; // If notifications aren't working, skip scheduling
    }

    try {
      // Morning summary — 9 AM daily
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Good Morning!',
          body: `You have ${tasks.filter(t => t.deadline).length} tasks with deadlines. Start strong today!`,
          sound: true,
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 9, minute: 0 },
      });

      // Evening expense reminder — 8 PM daily
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Evening Check-in',
          body: "How much did you spend today? Log your expenses in Money Vault.",
          sound: true,
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 20, minute: 0 },
      });

      // Task deadline reminders
      const now = new Date();
      for (const task of tasks) {
        if (!task.deadline) continue;
        const deadline = new Date(task.deadline);
        if (deadline <= now) continue;

        for (const daysBefore of [2, 1, 0]) {
          const triggerDate = new Date(deadline);
          triggerDate.setDate(triggerDate.getDate() - daysBefore);
          triggerDate.setHours(9, 0, 0, 0);
          if (triggerDate <= now) continue;

          const label = daysBefore === 0 ? 'today' : daysBefore === 1 ? 'tomorrow' : 'in 2 days';
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `Task Due ${daysBefore === 0 ? 'Today' : `in ${daysBefore}d`}`,
              body: `"${task.title}" is due ${label}.`,
            },
            trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate },
          });
        }
      }
    } catch (error) {
      console.warn('[notificationsService] Error scheduling notification reminders:', error);
    }
  },

  async scheduleDeadlineReminder(title: string, deadline: Date) {
    try {
      const triggerDate = new Date(deadline);
      triggerDate.setHours(8, 0, 0, 0);
      if (triggerDate <= new Date()) return;
      await Notifications.scheduleNotificationAsync({
        content: { title: 'Deadline Reminder', body: `"${title}" deadline is approaching!` },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate },
      });
    } catch (error) {
      console.warn('[notificationsService] Error scheduling deadline reminder:', error);
    }
  },

  async sendLocal(title: string, body: string) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: { title, body, sound: true },
        trigger: null,
      });
    } catch (error) {
      console.warn('[notificationsService] Error sending local notification:', error);
    }
  },
};
