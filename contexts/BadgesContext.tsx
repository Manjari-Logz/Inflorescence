import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from '@/template';
import { badgesService, Badge } from '@/services/badgesService';

interface BadgesContextType {
  badges: Badge[];
  loading: boolean;
  awardBadge: (type: string, name: string, description: string, module: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const BadgesContext = createContext<BadgesContextType | undefined>(undefined);

export function BadgesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await badgesService.fetchBadges(user.id);
    if (data) setBadges(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) { load(); } else { setBadges([]); }
  }, [user, load]);

  const awardBadge = async (type: string, name: string, description: string, module: string) => {
    if (!user) return;
    const { data } = await badgesService.awardBadge({ user_id: user.id, type, name, description, module });
    if (data) setBadges(prev => [data, ...prev]);
  };

  return (
    <BadgesContext.Provider value={{ badges, loading, awardBadge, refresh: load }}>
      {children}
    </BadgesContext.Provider>
  );
}
