import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from '@/template';
import { goalsService, ShortGoal, LongGoal, Dream } from '@/services/goalsService';

interface GoalsContextType {
  shortGoals: ShortGoal[];
  longGoals: LongGoal[];
  dreams: Dream[];
  loading: boolean;
  addShortGoal: (input: Omit<ShortGoal, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  updateShortGoal: (id: string, updates: Partial<ShortGoal>) => Promise<void>;
  deleteShortGoal: (id: string) => Promise<void>;
  addLongGoal: (input: Omit<LongGoal, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  updateLongGoal: (id: string, updates: Partial<LongGoal>) => Promise<void>;
  deleteLongGoal: (id: string) => Promise<void>;
  addDream: (input: Omit<Dream, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  deleteDream: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const GoalsContext = createContext<GoalsContextType | undefined>(undefined);

export function GoalsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [shortGoals, setShortGoals] = useState<ShortGoal[]>([]);
  const [longGoals, setLongGoals] = useState<LongGoal[]>([]);
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [sg, lg, dr] = await Promise.all([
      goalsService.fetchShortGoals(user.id),
      goalsService.fetchLongGoals(user.id),
      goalsService.fetchDreams(user.id),
    ]);
    if (sg.data) setShortGoals(sg.data);
    if (lg.data) setLongGoals(lg.data);
    if (dr.data) setDreams(dr.data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) { load(); } else { setShortGoals([]); setLongGoals([]); setDreams([]); }
  }, [user, load]);

  const addShortGoal = async (input: Omit<ShortGoal, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return;
    const { data } = await goalsService.createShortGoal({ ...input, user_id: user.id });
    if (data) setShortGoals(prev => [data, ...prev]);
  };

  const updateShortGoal = async (id: string, updates: Partial<ShortGoal>) => {
    const { error } = await goalsService.updateShortGoal(id, updates);
    if (!error) setShortGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
  };

  const deleteShortGoal = async (id: string) => {
    const { error } = await goalsService.deleteShortGoal(id);
    if (!error) setShortGoals(prev => prev.filter(g => g.id !== id));
  };

  const addLongGoal = async (input: Omit<LongGoal, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return;
    const { data } = await goalsService.createLongGoal({ ...input, user_id: user.id });
    if (data) setLongGoals(prev => [data, ...prev]);
  };

  const updateLongGoal = async (id: string, updates: Partial<LongGoal>) => {
    const { error } = await goalsService.updateLongGoal(id, updates);
    if (!error) setLongGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
  };

  const deleteLongGoal = async (id: string) => {
    const { error } = await goalsService.deleteLongGoal(id);
    if (!error) setLongGoals(prev => prev.filter(g => g.id !== id));
  };

  const addDream = async (input: Omit<Dream, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return;
    const { data } = await goalsService.createDream({ ...input, user_id: user.id });
    if (data) setDreams(prev => [data, ...prev]);
  };

  const deleteDream = async (id: string) => {
    const { error } = await goalsService.deleteDream(id);
    if (!error) setDreams(prev => prev.filter(d => d.id !== id));
  };

  return (
    <GoalsContext.Provider value={{ shortGoals, longGoals, dreams, loading, addShortGoal, updateShortGoal, deleteShortGoal, addLongGoal, updateLongGoal, deleteLongGoal, addDream, deleteDream, refresh: load }}>
      {children}
    </GoalsContext.Provider>
  );
}
