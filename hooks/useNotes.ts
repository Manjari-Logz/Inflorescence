import { useContext } from 'react';
import { NotesContext, NotesContextType } from '@/contexts/NotesContext';

export function useNotes(): NotesContextType {
  const ctx = useContext(NotesContext);
  if (!ctx) {
    console.warn('[useNotes] must be used within NotesProvider. Returning fallback.');
    return {
      notes: [],
      loading: false,
      addNote: async () => null,
      updateNote: async () => {},
      deleteNote: async () => {},
      togglePin: async () => {},
      addTag: async () => {},
      removeTag: async () => {},
      changeColor: async () => {},
      attachFile: async () => {},
      setReminder: async () => {},
      setChecklist: async () => {},
      searchNotes: () => [],
      filterNotes: () => [],
      processQueue: async () => {},
      refresh: async () => {},
    };
  }
  return ctx;
}
