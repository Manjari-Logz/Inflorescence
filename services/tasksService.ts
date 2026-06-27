import supabase from '@/lib/supabase';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  deadline?: string;
  category: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  estimated_time?: number;
  progress: number;
  notes?: string;
  completed: boolean;
  completed_at?: string;
  archived?: boolean;
  created_at: string;
  // Recurrence fields
  repeatType?: 'none' | 'daily';
  completedDates?: string[];
  // Reminder fields
  reminderEnabled?: boolean;
  reminderTime?: string;
  notificationId?: string;
}

export const tasksService = {
  async fetch(userId: string) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    // Convert snake_case from database to camelCase for TypeScript interface
    const convertedData = data?.map((task: any) => ({
      ...task,
      repeatType: task.repeat_type || 'none',
      completedDates: task.completed_dates || [],
      reminderEnabled: task.reminder_enabled || false,
      reminderTime: task.reminder_time,
      notificationId: task.notification_id,
    })) as Task[] | null;
    
    return { data: convertedData, error: error?.message ?? null };
  },

  async create(input: Omit<Task, 'id' | 'created_at'>) {
    // Convert camelCase to snake_case for database
    const dbInput: any = {
      ...input,
      repeat_type: input.repeatType,
      completed_dates: input.completedDates,
      reminder_enabled: input.reminderEnabled,
      reminder_time: input.reminderTime,
      notification_id: input.notificationId,
    };
    delete dbInput.repeatType;
    delete dbInput.completedDates;
    delete dbInput.reminderEnabled;
    delete dbInput.reminderTime;
    delete dbInput.notificationId;
    
    const { data, error } = await supabase.from('tasks').insert(dbInput).select().single();
    // Convert back to camelCase
    const convertedData = data ? {
      ...data,
      repeatType: (data as any).repeat_type || 'none',
      completedDates: (data as any).completed_dates || [],
      reminderEnabled: (data as any).reminder_enabled || false,
      reminderTime: (data as any).reminder_time,
      notificationId: (data as any).notification_id,
    } as Task : null;
    return { data: convertedData, error: error?.message ?? null };
  },

  async update(id: string, updates: Partial<Task>) {
    // Convert camelCase to snake_case for database
    const dbUpdates: any = {
      ...updates,
      repeat_type: updates.repeatType,
      completed_dates: updates.completedDates,
      reminder_enabled: updates.reminderEnabled,
      reminder_time: updates.reminderTime,
      notification_id: updates.notificationId,
    };
    delete dbUpdates.repeatType;
    delete dbUpdates.completedDates;
    delete dbUpdates.reminderEnabled;
    delete dbUpdates.reminderTime;
    delete dbUpdates.notificationId;
    
    const { error } = await supabase.from('tasks').update(dbUpdates).eq('id', id);
    return { error: error?.message ?? null };
  },

  async remove(id: string) {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    return { error: error?.message ?? null };
  },

  // Helper to get today's date in local timezone (YYYY-MM-DD format)
  getTodayLocal(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // Helper to check if a recurring task is completed for today
  isCompletedForToday(task: Task): boolean {
    if (task.repeatType !== 'daily') return task.completed;
    
    const today = this.getTodayLocal();
    const completedDates = task.completedDates || [];
    return completedDates.includes(today);
  },

  // Helper to mark a recurring task as completed for today
  completeForToday(task: Task): Partial<Task> {
    if (task.repeatType !== 'daily') {
      return { completed: true, completed_at: new Date().toISOString() };
    }
    
    const today = this.getTodayLocal();
    const completedDates = task.completedDates || [];
    if (!completedDates.includes(today)) {
      completedDates.push(today);
    }
    
    return { 
      completedDates,
      completed: true,
      completed_at: new Date().toISOString()
    };
  },

  // Helper to unmark a recurring task for today
  uncompleteForToday(task: Task): Partial<Task> {
    if (task.repeatType !== 'daily') {
      return { completed: false, completed_at: undefined };
    }
    
    const today = this.getTodayLocal();
    const completedDates = (task.completedDates || []).filter(date => date !== today);
    
    return {
      completedDates,
      completed: completedDates.length > 0,
      completed_at: completedDates.length > 0 ? task.completed_at : undefined
    };
  },
};
