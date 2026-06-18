import { useContext } from 'react';
import { MoodContext } from '@/contexts/MoodContext';

export function useMood() {
  const context = useContext(MoodContext);
  if (!context) throw new Error('useMood must be used within MoodProvider');
  return context;
}
