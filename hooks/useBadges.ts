import { useContext } from 'react';
import { BadgesContext } from '@/contexts/BadgesContext';

export function useBadges() {
  const context = useContext(BadgesContext);
  if (!context) throw new Error('useBadges must be used within BadgesProvider');
  return context;
}
