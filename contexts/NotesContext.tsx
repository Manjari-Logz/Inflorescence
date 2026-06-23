import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from '@/template';
import { notesService, Note } from '@/services/notesService';

interface NotesContextType {
  notes: Note[];
  loading: boolean;
  addNote: (title: string, content?: string) => Promise<Note | null>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const NotesContext = createContext<NotesContextType | undefined>(undefined);

export function NotesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await notesService.fetch(user.id);
    if (data) setNotes(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) { load(); } else { setNotes([]); }
  }, [user, load]);

  const addNote = async (title: string, content?: string): Promise<Note | null> => {
    if (!user) return null;
    const { data } = await notesService.create({ user_id: user.id, title, content });
    if (data) {
      setNotes(prev => [data, ...prev]);
      return data;
    }
    return null;
  };

  const updateNote = async (id: string, updates: Partial<Note>) => {
    const { data } = await notesService.update(id, updates);
    if (data) {
      setNotes(prev => prev.map(n => n.id === id ? data : n));
    }
  };

  const deleteNote = async (id: string) => {
    const error = await notesService.remove(id);
    if (!error) setNotes(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotesContext.Provider value={{ notes, loading, addNote, updateNote, deleteNote, refresh: load }}>
      {children}
    </NotesContext.Provider>
  );
}
