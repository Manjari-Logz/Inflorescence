import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from '@/template';
import { placementService, PlacementCompany } from '@/services/placementService';

interface PlacementContextType {
  companies: PlacementCompany[];
  loading: boolean;
  addCompany: (input: Omit<PlacementCompany, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateCompany: (id: string, updates: Partial<PlacementCompany>) => Promise<void>;
  removeCompany: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const PlacementContext = createContext<PlacementContextType | undefined>(undefined);

export function PlacementProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<PlacementCompany[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await placementService.fetch(user.id);
    if (data) setCompanies(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) load(); else setCompanies([]);
  }, [user, load]);

  const addCompany = async (input: Omit<PlacementCompany, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;
    const { data } = await placementService.create({ ...input, user_id: user.id });
    if (data) setCompanies(prev => [data, ...prev]);
  };

  const updateCompany = async (id: string, updates: Partial<PlacementCompany>) => {
    const { data } = await placementService.update(id, updates);
    if (data) setCompanies(prev => prev.map(c => c.id === id ? data : c));
  };

  const removeCompany = async (id: string) => {
    const { error } = await placementService.remove(id);
    if (!error) setCompanies(prev => prev.filter(c => c.id !== id));
  };

  return (
    <PlacementContext.Provider value={{ companies, loading, addCompany, updateCompany, removeCompany, refresh: load }}>
      {children}
    </PlacementContext.Provider>
  );
}
