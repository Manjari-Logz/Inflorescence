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
  async registerForPush(userId: string): Promise<string | null> {
    if (!Device.isDevice) return null;

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Inflorescence',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    try {
      const tokenData = await Notifications.getExpoPushTokenAsync();
      const token = tokenData.data;
      const client = getSupabaseClient();
      await client.from('push_tokens').upsert({
        user_id: userId,
        token,
        platform: Platform.OS,
      }, { onConflict: 'user_id,token' });
      return token;
    } catch {
      return null;
    }
  },

  async scheduleDailyReminder(hour = 9, minute = 0) {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🌸 Inflorescence',
        body: 'Good morning! Check your tasks and log your mood for today.',
        sound: true,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
    });
  },

  async scheduleTaskReminders(tasks: { title: string; deadline?: string }[]) {
    const now = new Date();
    for (const task of tasks) {
      if (!task.deadline) continue;
      const deadline = new Date(task.deadline);
      if (deadline <= now) continue;

      const offsets = [
        { days: 0, label: 'Today' },
        { days: -1, label: 'Tomorrow' },
        { days: -2, label: 'Day after tomorrow' },
      ];

      for (const { days, label } of offsets) {
        const triggerDate = new Date(deadline);
        triggerDate.setDate(triggerDate.getDate() + days);
        triggerDate.setHours(9, 0, 0, 0);
        if (triggerDate <= now) continue;

        await Notifications.scheduleNotificationAsync({
          content: {
            title: `📋 Task Reminder (${label})`,
            body: `"${task.title}" is due ${days === 0 ? 'today' : days === -1 ? 'tomorrow' : 'in 2 days'}.`,
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
      content: {
        title: '⏰ Deadline Reminder',
        body: `"${title}" deadline is approaching!`,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate },
    });
  },
};
