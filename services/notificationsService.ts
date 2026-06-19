import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { getSupabaseClient } from '@/template';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const notificationsService = {
  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) return false;
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  },

  async registerForPush(userId: string): Promise<string | null> {
    const granted = await this.requestPermissions();
    if (!granted) return null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Inflorescence',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        sound: 'default',
      });
    }

    try {
      const tokenData = await Notifications.getExpoPushTokenAsync();
      const token = tokenData.data;
      const client = getSupabaseClient();
      await client.from('push_tokens').upsert({ user_id: userId, token, platform: Platform.OS }, { onConflict: 'user_id,token' });
      return token;
    } catch {
      return null;
    }
  },

  async scheduleAllReminders(tasks: { title: string; deadline?: string }[]) {
    await Notifications.cancelAllScheduledNotificationsAsync();

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
  },

  async scheduleDeadlineReminder(title: string, deadline: Date) {
    const triggerDate = new Date(deadline);
    triggerDate.setHours(8, 0, 0, 0);
    if (triggerDate <= new Date()) return;
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Deadline Reminder', body: `"${title}" deadline is approaching!` },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate },
    });
  },

  async sendLocal(title: string, body: string) {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger: null,
    });
  },
};
