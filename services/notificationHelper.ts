import { useNotifications } from '@/hooks/useNotifications';

/**
 * Centralized notification helper for creating notifications across the app.
 * This ensures consistent notification creation for all app events.
 */
export class NotificationHelper {
  private static instance: NotificationHelper;
  private addNotification?: (title: string, body?: string) => Promise<void>;

  private constructor() {}

  static initialize(addNotificationFn: (title: string, body?: string) => Promise<void>) {
    if (!NotificationHelper.instance) {
      NotificationHelper.instance = new NotificationHelper();
    }
    NotificationHelper.instance.addNotification = addNotificationFn;
  }

  static getInstance(): NotificationHelper {
    if (!NotificationHelper.instance) {
      throw new Error('NotificationHelper not initialized. Call NotificationHelper.initialize() first.');
    }
    return NotificationHelper.instance;
  }

  // Task notifications
  async taskCreated(title: string) {
    if (this.addNotification) await this.addNotification('Task Created', `Task "${title}" has been added.`);
  }

  async taskCompleted(title: string) {
    if (this.addNotification) await this.addNotification('Task Completed', `Great job! You completed "${title}".`);
  }

  async taskOverdue(title: string) {
    if (this.addNotification) await this.addNotification('Task Overdue', `"${title}" is overdue. Complete it now!`);
  }

  // Goal notifications
  async goalCreated(title: string) {
    if (this.addNotification) await this.addNotification('Goal Created', `New goal "${title}" has been set.`);
  }

  async goalAchieved(title: string) {
    if (this.addNotification) await this.addNotification('Goal Achieved', `Congratulations! You achieved "${title}".`);
  }

  // Habit notifications
  async habitCreated(name: string) {
    if (this.addNotification) await this.addNotification('Habit Created', `New habit "${name}" has been added.`);
  }

  async habitStreak(name: string, days: number) {
    if (this.addNotification) await this.addNotification('Habit Streak', `${days} day streak for "${name}"! Keep it up!`);
  }

  // Event/Hackathon notifications
  async eventReminder(title: string) {
    if (this.addNotification) await this.addNotification('Event Reminder', `"${title}" is starting soon.`);
  }

  // Study notifications
  async studySessionStarted(topic: string) {
    if (this.addNotification) await this.addNotification('Study Session Started', `Started studying "${topic}".`);
  }

  async studySessionCompleted(topic: string, duration: number) {
    if (this.addNotification) await this.addNotification('Study Session Completed', `Completed ${duration} minutes of "${topic}".`);
  }

  // Notes notifications
  async noteCreated(title: string) {
    if (this.addNotification) await this.addNotification('Note Created', `Note "${title}" has been saved.`);
  }

  // Book notifications
  async bookProgress(title: string, progress: number) {
    if (this.addNotification) await this.addNotification('Reading Progress', `${progress}% complete on "${title}".`);
  }

  async bookCompleted(title: string) {
    if (this.addNotification) await this.addNotification('Book Completed', `Finished reading "${title}". Great achievement!`);
  }

  // Exercise notifications
  async exerciseLogged(calories: number) {
    if (this.addNotification) await this.addNotification('Exercise Logged', `Burned ${calories} calories. Keep moving!`);
  }

  // Money Vault notifications
  async expenseLogged(amount: number, category: string) {
    if (this.addNotification) await this.addNotification('Expense Logged', `Logged ${category} expense: $${amount}.`);
  }

  // Custom Section notifications
  async customSectionCreated(name: string) {
    if (this.addNotification) await this.addNotification('Custom Section Created', `Section "${name}" has been created.`);
  }

  async customSectionDeleted(name: string) {
    if (this.addNotification) await this.addNotification('Custom Section Deleted', `Section "${name}" has been deleted.`);
  }

  async customItemCompleted(sectionName: string, itemTitle: string) {
    if (this.addNotification) await this.addNotification('Item Completed', `Completed "${itemTitle}" in ${sectionName}.`);
  }

  // Backup/Sync notifications
  async backupCompleted() {
    if (this.addNotification) await this.addNotification('Backup Completed', 'Your data has been backed up successfully.');
  }

  async syncCompleted() {
    if (this.addNotification) await this.addNotification('Sync Completed', 'All data synchronized successfully.');
  }

  // Profile notifications
  async profileUpdated() {
    if (this.addNotification) await this.addNotification('Profile Updated', 'Your profile has been updated.');
  }

  // Achievement notifications
  async achievementUnlocked(title: string) {
    if (this.addNotification) await this.addNotification('Achievement Unlocked', `You earned the "${title}" badge!`);
  }

  // History notifications
  async historyRestored() {
    if (this.addNotification) await this.addNotification('History Restored', 'Your task history has been restored.');
  }
}

// Convenience hook for using the notification helper
export function useNotificationHelper() {
  const { addNotification } = useNotifications();
  
  // Initialize the helper
  NotificationHelper.initialize(addNotification);
  
  return NotificationHelper.getInstance();
}
