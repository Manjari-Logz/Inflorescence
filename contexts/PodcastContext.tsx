import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { podcastService, Podcast } from '@/services/podcastService';

interface PodcastContextType {
  podcasts: Podcast[];
  loading: boolean;
  addPodcast: (input: Omit<Podcast, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  updatePodcast: (id: string, updates: Partial<Podcast>) => Promise<void>;
  removePodcast: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const PodcastContext = createContext<PodcastContextType | undefined>(undefined);

export function PodcastProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await podcastService.fetch(user.id);
    if (data) setPodcasts(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) load(); else setPodcasts([]);
  }, [user, load]);

  const addPodcast = async (input: Omit<Podcast, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return;
    const { data } = await podcastService.create({ ...input, user_id: user.id, playlist_order: podcasts.length });
    if (data) setPodcasts(prev => [...prev, data]);
  };

  const updatePodcast = async (id: string, updates: Partial<Podcast>) => {
    const { data } = await podcastService.update(id, updates);
    if (data) setPodcasts(prev => prev.map(p => p.id === id ? data : p));
  };

  const removePodcast = async (id: string) => {
    const { error } = await podcastService.remove(id);
    if (!error) setPodcasts(prev => prev.filter(p => p.id !== id));
  };

  return (
    <PodcastContext.Provider value={{ podcasts, loading, addPodcast, updatePodcast, removePodcast, refresh: load }}>
      {children}
    </PodcastContext.Provider>
  );
}
