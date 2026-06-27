import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { reflectionService, Reflection } from '@/services/reflectionService';

interface ReflectionContextType {
  reflections: Reflection[];
  loading: boolean;
  todayReflection: Reflection | null;
  saveReflection: (content: string, prompt: string, date: string) => Promise<void>;
  removeReflection: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const ReflectionContext = createContext<ReflectionContextType | undefined>(undefined);

export function ReflectionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [todayReflection, setTodayReflection] = useState<Reflection | null>(null);
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data }, todayData] = await Promise.all([
      reflectionService.fetch(user.id),
      reflectionService.getToday(user.id, today),
    ]);
    if (data) setReflections(data);
    setTodayReflection(todayData);
    setLoading(false);
  }, [user, today]);

  useEffect(() => {
    if (user) load(); else { setReflections([]); setTodayReflection(null); }
  }, [user, load]);

  const saveReflection = async (content: string, prompt: string, date: string) => {
    if (!user) return;
    if (todayReflection) {
      const { data } = await reflectionService.update(todayReflection.id, { content, prompt });
      if (data) {
        setTodayReflection(data);
        setReflections(prev => prev.map(r => r.id === data.id ? data : r));
      }
    } else {
      const { data } = await reflectionService.create({ user_id: user.id, content, prompt, date });
      if (data) {
        setTodayReflection(data);
        setReflections(prev => [data, ...prev]);
      }
    }
  };

  const removeReflection = async (id: string) => {
    const { error } = await reflectionService.remove(id);
    if (!error) {
      setReflections(prev => prev.filter(r => r.id !== id));
      if (todayReflection?.id === id) setTodayReflection(null);
    }
  };

  return (
    <ReflectionContext.Provider value={{ reflections, loading, todayReflection, saveReflection, removeReflection, refresh: load }}>
      {children}
    </ReflectionContext.Provider>
  );
}
