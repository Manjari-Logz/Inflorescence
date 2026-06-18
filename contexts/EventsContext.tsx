import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from '@/template';
import { eventsService, Hackathon, Round } from '@/services/eventsService';

interface EventsContextType {
  hackathons: Hackathon[];
  loading: boolean;
  addHackathon: (input: Omit<Hackathon, 'id' | 'user_id' | 'created_at' | 'rounds'>) => Promise<Hackathon | null>;
  deleteHackathon: (id: string) => Promise<void>;
  addRound: (input: Omit<Round, 'id' | 'created_at'>) => Promise<void>;
  updateRound: (id: string, updates: Partial<Round>) => Promise<void>;
  deleteRound: (id: string, hackathonId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const EventsContext = createContext<EventsContextType | undefined>(undefined);

export function EventsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await eventsService.fetchHackathons(user.id);
    if (data) setHackathons(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) { load(); } else { setHackathons([]); }
  }, [user, load]);

  const addHackathon = async (input: Omit<Hackathon, 'id' | 'user_id' | 'created_at' | 'rounds'>) => {
    if (!user) return null;
    const { data } = await eventsService.createHackathon({ ...input, user_id: user.id });
    if (data) {
      const newH = { ...data, rounds: [] };
      setHackathons(prev => [newH, ...prev]);
      return newH;
    }
    return null;
  };

  const deleteHackathon = async (id: string) => {
    const { error } = await eventsService.deleteHackathon(id);
    if (!error) setHackathons(prev => prev.filter(h => h.id !== id));
  };

  const addRound = async (input: Omit<Round, 'id' | 'created_at'>) => {
    const { data } = await eventsService.createRound(input);
    if (data) {
      setHackathons(prev => prev.map(h =>
        h.id === input.hackathon_id
          ? { ...h, rounds: [...(h.rounds || []), data].sort((a, b) => a.round_number - b.round_number) }
          : h
      ));
    }
  };

  const updateRound = async (id: string, updates: Partial<Round>) => {
    const { error } = await eventsService.updateRound(id, updates);
    if (!error) {
      setHackathons(prev => prev.map(h => ({
        ...h,
        rounds: h.rounds?.map(r => r.id === id ? { ...r, ...updates } : r),
      })));
    }
  };

  const deleteRound = async (id: string, hackathonId: string) => {
    const { error } = await eventsService.deleteRound(id);
    if (!error) {
      setHackathons(prev => prev.map(h =>
        h.id === hackathonId
          ? { ...h, rounds: h.rounds?.filter(r => r.id !== id) }
          : h
      ));
    }
  };

  return (
    <EventsContext.Provider value={{ hackathons, loading, addHackathon, deleteHackathon, addRound, updateRound, deleteRound, refresh: load }}>
      {children}
    </EventsContext.Provider>
  );
}
