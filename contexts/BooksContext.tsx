import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from '@/template';
import { booksService, Book } from '@/services/booksService';

interface BooksContextType {
  books: Book[];
  loading: boolean;
  addBook: (input: Omit<Book, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateBook: (id: string, updates: Partial<Book>) => Promise<void>;
  removeBook: (id: string) => Promise<void>;
  updatePage: (id: string, delta: number) => Promise<void>;
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
    const { data } = await booksService.create({ ...input, user_id: user.id });
    if (data) setBooks(prev => [data, ...prev]);
  };

  const updateBook = async (id: string, updates: Partial<Book>) => {
    const { data } = await booksService.update(id, updates);
    if (data) setBooks(prev => prev.map(b => b.id === id ? data : b));
  };

  const removeBook = async (id: string) => {
    const { error } = await booksService.remove(id);
    if (!error) setBooks(prev => prev.filter(b => b.id !== id));
  };

  const updatePage = async (id: string, delta: number) => {
    const book = books.find(b => b.id === id);
    if (!book) return;
    const next = Math.max(0, Math.min(book.total_pages, book.current_page + delta));
    const status = next >= book.total_pages && book.total_pages > 0 ? 'completed' : book.status;
    await updateBook(id, { current_page: next, status });
  };

  return (
    <BooksContext.Provider value={{ books, loading, addBook, updateBook, removeBook, updatePage, refresh: load }}>
      {children}
    </BooksContext.Provider>
  );
}
