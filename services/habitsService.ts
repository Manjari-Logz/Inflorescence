import supabase from '@/lib/supabase';

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  frequency: string;
  streak: number;
  last_completed?: string;
  created_at: string;
  updated_at: string;
  habit_logs?: HabitLog[];
}

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  date: string;
  created_at: string;
}

export const habitsService = {
  async fetch(userId: string) {
    const { data, error } = await supabase
      .from('habits')
      .select('*, habit_logs(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data: data as Habit[] | null, error: error?.message ?? null };
  },

  async create(input: Omit<Habit, 'id' | 'streak' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('habits')
      .insert({ ...input, streak: 0 })
      .select()
      .single();
    return { data: data as Habit | null, error: error?.message ?? null };
  },

  async update(id: string, updates: Partial<Habit>) {
    const { data, error } = await supabase
      .from('habits')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    return { data: data as Habit | null, error: error?.message ?? null };
  },

  async remove(id: string) {
    
    const { error } = await supabase.from('habits').delete().eq('id', id);
    return { error: error?.message ?? null };
  },

  async log(habitId: string, userId: string, dateStr: string) {
    
    
    // 1. Insert into habit_logs
    const { data: logData, error: logError } = await supabase
      .from('habit_logs')
      .insert({ habit_id: habitId, user_id: userId, date: dateStr })
      .select()
      .single();

    if (logError) return { log: null, error: logError.message };

    // 2. Fetch all logs for this habit to compute streak
    const { data: allLogs } = await supabase
      .from('habit_logs')
      .select('date')
      .eq('habit_id', habitId)
      .order('date', { ascending: false });

    let streak = 0;
    let lastCompleted: string | undefined = undefined;

    if (allLogs && allLogs.length > 0) {
      lastCompleted = allLogs[0].date;
      
      // Calculate streak
      const logDates = allLogs.map(l => new Date(l.date).toDateString());
      let currentCheck = new Date(dateStr);
      let streakActive = true;

      // Find streak going backwards
      while (streakActive) {
        if (logDates.includes(currentCheck.toDateString())) {
          streak++;
          currentCheck.setDate(currentCheck.getDate() - 1);
        } else {
          streakActive = false;
        }
      }
    }

    // 3. Update habit with new streak and last completed date
    await this.update(habitId, {
      streak,
      last_completed: lastCompleted,
    });

    return { log: logData as HabitLog, error: null };
  },

  async unlog(habitId: string, userId: string, dateStr: string) {
    

    // 1. Delete from habit_logs
    const { error: deleteError } = await supabase
      .from('habit_logs')
      .delete()
      .eq('habit_id', habitId)
      .eq('date', dateStr);

    if (deleteError) return { error: deleteError.message };

    // 2. Re-fetch and re-calculate streak
    const { data: allLogs } = await supabase
      .from('habit_logs')
      .select('date')
      .eq('habit_id', habitId)
      .order('date', { ascending: false });

    let streak = 0;
    let lastCompleted: string | null = null;

    if (allLogs && allLogs.length > 0) {
      lastCompleted = allLogs[0].date;
      const logDates = allLogs.map(l => new Date(l.date).toDateString());
      
      // Determine starting date for streak calculation
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      let currentCheck = logDates.includes(today.toDateString()) ? today : logDates.includes(yesterday.toDateString()) ? yesterday : null;
      
      if (currentCheck) {
        let streakActive = true;
        while (streakActive) {
          if (logDates.includes(currentCheck.toDateString())) {
            streak++;
            currentCheck.setDate(currentCheck.getDate() - 1);
          } else {
            streakActive = false;
          }
        }
      }
    }

    // 3. Update habit
    await this.update(habitId, {
      streak,
      last_completed: lastCompleted || undefined,
    });

    return { error: null };
  },
};
