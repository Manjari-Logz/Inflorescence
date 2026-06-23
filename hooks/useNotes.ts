import { useContext } from 'react';
import { NotesContext } from '@/contexts/NotesContext';

export function useNotes() {
  const ctx = useContext(NotesContext);
  if (!ctx) throw new Error('useNotes must be used within NotesProvider');
  return ctx;
}
