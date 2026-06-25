import { useContext } from 'react';
import { EventsContext } from '@/contexts/EventsContext';

export function useEvents() {
  const context = useContext(EventsContext);
  if (!context) {
    console.warn('[useEvents] must be used within EventsProvider. Returning fallback.');
    return {
      hackathons: [],
      loading: false,
      addHackathon: async () => null,
      updateHackathon: async () => {},
      deleteHackathon: async () => {},
      addRound: async () => {},
      updateRound: async () => {},
      deleteRound: async () => {},
      refresh: async () => {},
    };
  }
  return context;
}
