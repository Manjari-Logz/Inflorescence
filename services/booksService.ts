import { getSupabaseClient } from '@/template';

export interface Book {
  id: string;
  user_id: string;
  title: string;
  author?: string;
  total_pages: number;
  current_page: number;
  cover_url?: string;
  pdf_url?: string;
  status: 'reading' | 'completed' | 'paused';
  created_at: string;
  updated_at: string;
}

export const booksService = {
  async fetch(userId: string) {
    const client = getSupabaseClient();
    const { data, error } = await client.from('books').select('*').eq('user_id', userId).order('updated_at', { ascending: false });
    return { data: data as Book[] | null, error: error?.message ?? null };
  },

  async create(input: Omit<Book, 'id' | 'created_at' | 'updated_at'>) {
    const client = getSupabaseClient();
    const { data, error } = await client.from('books').insert(input).select().single();
    return { data: data as Book | null, error: error?.message ?? null };
  },

  async update(id: string, updates: Partial<Book>) {
    const client = getSupabaseClient();
    const { data, error } = await client.from('books').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    return { data: data as Book | null, error: error?.message ?? null };
  },

  async remove(id: string) {
    const client = getSupabaseClient();
    const { error } = await client.from('books').delete().eq('id', id);
    return { error: error?.message ?? null };
  },

  getReadingStats(books: Book[]) {
    const total = books.length;
    const completed = books.filter(b => b.status === 'completed').length;
    const pagesRead = books.reduce((a, b) => a + b.current_page, 0);
    const totalPages = books.reduce((a, b) => a + b.total_pages, 0);
    const progress = totalPages > 0 ? Math.round((pagesRead / totalPages) * 100) : 0;
    return { total, completed, pagesRead, totalPages, progress };
  },
};
