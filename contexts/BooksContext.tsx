import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from '@/template';
import { booksService, Book } from '@/services/booksService';

interface BooksContextType {
  books: Book[];
  loading: boolean;
  addBook: (input: Omit<Book, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateBook: (id: string, updates: Partial<Book>) => Promise<void>;
  removeBook: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const BooksContext = createContext<BooksContextType | undefined>(undefined);

export function BooksProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await booksService.fetch(user.id);
    if (data) setBooks(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) load(); else setBooks([]);
  }, [user, load]);

  const addBook = async (input: Omit<Book, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;
    const tempId = `temp_${Date.now()}`;
    const optimistic: Book = { ...input, id: tempId, user_id: user.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    setBooks(prev => [optimistic, ...prev]);
    const { data } = await booksService.create({ ...input, user_id: user.id });
    if (data) {
      setBooks(prev => prev.map(b => b.id === tempId ? data : b));
    } else {
      setBooks(prev => prev.filter(b => b.id !== tempId));
    }
  };

  const updateBook = async (id: string, updates: Partial<Book>) => {
    setBooks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    const { error } = await booksService.update(id, updates);
    if (error) await load();
  };

  const removeBook = async (id: string) => {
    setBooks(prev => prev.filter(b => b.id !== id));
    const { error } = await booksService.remove(id);
    if (error) await load();
  };

  return (
    <BooksContext.Provider value={{ books, loading, addBook, updateBook, removeBook, refresh: load }}>
      {children}
    </BooksContext.Provider>
  );
}
