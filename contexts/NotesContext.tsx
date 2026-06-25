import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from '@/template';
import { notesService, Note } from '@/services/notesService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

interface NotesContextType {
  notes: Note[];
  loading: boolean;
  addNote: (title: string, content?: string, meta?: Partial<Pick<Note, 'parent_type' | 'parent_id'>>) => Promise<Note | null>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  addTag: (id: string, tag: string) => Promise<void>;
  removeTag: (id: string, tag: string) => Promise<void>;
  changeColor: (id: string, color: string) => Promise<void>;
  attachFile: (id: string, file: { uri: string; name: string }) => Promise<void>;
  setReminder: (id: string, datetime: string) => Promise<void>;
  setChecklist: (id: string, items: { text: string; completed: boolean }[]) => Promise<void>;
  searchNotes: (query: string) => Note[];
  filterNotes: (criteria: Partial<{
    pinned: boolean;
    color: string;
    tag: string;
    parentType: string;
    hasAttachment: boolean;
    hasReminder: boolean;
    hasChecklist: boolean;
  }>) => Note[];
  processQueue: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const NotesContext = createContext<NotesContextType | undefined>(undefined);

export function NotesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [offlineQueue, setOfflineQueue] = useState<Array<any>>([]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await notesService.fetch(user.id);
    if (data) setNotes(data);
    setLoading(false);
  }, [user]);

  const togglePin = async (id: string) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    const updates = { pinned: !note.pinned };
    await updateNote(id, updates);
  };

  // monitor network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
    });
    return () => unsubscribe();
  }, []);

  const addTag = async (id: string, tag: string) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    const newTags = Array.isArray(note.tags) ? [...note.tags, tag] : [tag];
    await updateNote(id, { tags: newTags });
  };

  // load persisted queue on mount
  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem('notes_offline_queue');
      if (stored) setOfflineQueue(JSON.parse(stored));
    })();
  }, []);

  // persist queue when it changes
  useEffect(() => {
    AsyncStorage.setItem('notes_offline_queue', JSON.stringify(offlineQueue));
  }, [offlineQueue]);

  // when connection restored, process queued ops
  useEffect(() => {
    if (isOnline && offlineQueue.length > 0) {
      processQueue();
    }
  }, [isOnline, offlineQueue]);

  const processQueue = async () => {
    const newQueue = [];
    for (const op of offlineQueue) {
      try {
        if (op.type === 'create') {
          await notesService.create(op.payload);
        } else if (op.type === 'update') {
          await notesService.update(op.id, op.payload);
        } else if (op.type === 'delete') {
          await notesService.remove(op.id);
        }
      } catch (e) {
        // keep the operation for later retry
        newQueue.push(op);
      }
    }
    setOfflineQueue(newQueue);
    // refresh after sync
    if (newQueue.length !== offlineQueue.length) load();
  };

  useEffect(() => {
    if (user) { load(); } else { setNotes([]); }
  }, [user, load]);

  const addNote = async (title: string, content?: string, meta?: Partial<Pick<Note, 'parent_type' | 'parent_id'>>): Promise<Note | null> => {
    if (!user) return null;
    const payload: Partial<Note> = { user_id: user.id, title, content, ...meta };
    if (isOnline) {
      const { data } = await notesService.create(payload as any);
      if (data) setNotes(prev => [data, ...prev]);
      return data ?? null;
    } else {
      // optimistic UI with temporary id
      const tempId = `temp-${Date.now()}`;
      const tempNote: Note = {
        id: tempId,
        user_id: user.id,
        title,
        content,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...meta,
      } as Note;
      setNotes(prev => [tempNote, ...prev]);
      setOfflineQueue(q => [...q, { type: 'create', payload }]);
      return tempNote;
    }
  };

  const updateNote = async (id: string, updates: Partial<Note>) => {
    // optimistic UI
    setNotes(prev => prev.map(n => (n.id === id ? { ...n, ...updates } : n)));
    if (isOnline) {
      const { data } = await notesService.update(id, updates);
      if (data) setNotes(prev => prev.map(n => (n.id === id ? data : n)));
    } else {
      setOfflineQueue(q => [...q, { type: 'update', id, payload: updates }]);
    }
  };

  const deleteNote = async (id: string) => {
    // optimistic removal
    setNotes(prev => prev.filter(n => n.id !== id));
    if (isOnline) {
      await notesService.remove(id);
    } else {
      setOfflineQueue(q => [...q, { type: 'delete', id }]);
    }
  };

  const value: NotesContextType = {
    notes,
    loading,
    addNote,
    updateNote,
    deleteNote,
    togglePin,
    addTag,
    removeTag,
    changeColor,
    attachFile,
    setReminder,
    setChecklist,
    searchNotes,
    filterNotes,
    processQueue,
    refresh: load,
  };

  return (
    <NotesContext.Provider value={value}>
      {children}
    </NotesContext.Provider>
  );
}
