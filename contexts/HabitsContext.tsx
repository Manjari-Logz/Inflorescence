import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { habitsService, Habit } from '@/services/habitsService';

interface HabitsContextType {
  habits: Habit[];
  loading: boolean;
  addHabit: (name: string, description: string | undefined, frequency: string) => Promise<void>;
  updateHabit: (id: string, updates: Partial<Habit>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  logHabit: (habitId: string, dateStr: string) => Promise<void>;
  unlogHabit: (habitId: string, dateStr: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const HabitsContext = createContext<HabitsContextType | undefined>(undefined);

export function HabitsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await habitsService.fetch(user.id);
    if (data) setHabits(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) { load(); } else { setHabits([]); }
  }, [user, load]);

  const addHabit = async (name: string, description: string | undefined, frequency: string) => {
    if (!user) return;
    const { data } = await habitsService.create({ user_id: user.id, name, description, frequency });
    if (data) {
      setHabits(prev => [{ ...data, habit_logs: [] }, ...prev]);
      await addNotification('Habit Created', `New habit "${name}" has been added.`);
    }
  };

  const updateHabit = async (id: string, updates: Partial<Habit>) => {
    const { data } = await habitsService.update(id, updates);
    if (data) {
      setHabits(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h));
    }
  };

  const deleteHabit = async (id: string) => {
    const error = await habitsService.remove(id);
    if (!error) setHabits(prev => prev.filter(h => h.id !== id));
  };

  const logHabit = async (habitId: string, dateStr: string) => {
    if (!user) return;
    const habit = habits.find(h => h.id === habitId);
    const { log, error } = await habitsService.log(habitId, user.id, dateStr);
    if (log) {
      setHabits(prev => prev.map(h => {
        if (h.id === habitId) {
          const logs = h.habit_logs ?? [];
          return {
            ...h,
            streak: h.streak + 1,
            last_completed: dateStr,
            habit_logs: [...logs, log],
          };
        }
        return h;
      }));
      await load();
      if (habit && habit.streak > 0 && (habit.streak + 1) % 7 === 0) {
        await addNotification('Habit Streak', `${habit.streak + 1} day streak for "${habit.name}"! Keep it up!`);
      }
    }
  };

  const unlogHabit = async (habitId: string, dateStr: string) => {
    if (!user) return;
    const { error } = await habitsService.unlog(habitId, user.id, dateStr);
    if (!error) {
      setHabits(prev => prev.map(h => {
        if (h.id === habitId) {
          const logs = h.habit_logs ?? [];
          return {
            ...h,
            habit_logs: logs.filter(l => l.date !== dateStr),
          };
        }
        return h;
      }));
      // Re-fetch to get correct computed streak
      await load();
    }
  };

  return (
    <HabitsContext.Provider value={{ habits, loading, addHabit, updateHabit, deleteHabit, logHabit, unlogHabit, refresh: load }}>
      {children}
    </HabitsContext.Provider>
  );
}
