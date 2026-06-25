import { useContext } from 'react';
import { BadgesContext } from '@/contexts/BadgesContext';

export function useBadges() {
  const context = useContext(BadgesContext);
  if (!context) {
    console.warn('[useBadges] must be used within BadgesProvider. Returning fallback.');
    return {
      badges: [],
      loading: false,
      awardBadge: async () => {},
      refresh: async () => {},
    };
  }
  return context;
}
