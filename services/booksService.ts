import supabase from '@/lib/supabase';

export interface Book {
  id: string;
  user_id: string;
  title: string;
  author?: string;
  genre?: string;
  total_pages: number;
  current_page: number;
  cover_url?: string;
  pdf_url?: string;
  start_date?: string;
  target_date?: string;
  status: 'reading' | 'completed' | 'paused';
  created_at: string;
  updated_at: string;
}

export const booksService = {
  async fetch(userId: string) {
    
    const { data, error } = await supabase.from('books').select('*').eq('user_id', userId).order('updated_at', { ascending: false });
    return { data: data as Book[] | null, error: error?.message ?? null };
  },

  async create(input: Omit<Book, 'id' | 'created_at' | 'updated_at'>) {
    
    const { data, error } = await supabase.from('books').insert(input).select().single();
    return { data: data as Book | null, error: error?.message ?? null };
  },

  async update(id: string, updates: Partial<Book>) {
    
    const { data, error } = await supabase.from('books').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    return { data: data as Book | null, error: error?.message ?? null };
  },

  async remove(id: string) {
    
    const { error } = await supabase.from('books').delete().eq('id', id);
    return { error: error?.message ?? null };
  },

  getReadingStats(books: Book[]) {
    const completed = books.filter(b => b.status === 'completed').length;
    const pagesRead = books.reduce((a, b) => a + b.current_page, 0);
    const totalPages = books.reduce((a, b) => a + b.total_pages, 0);
    return { total: books.length, completed, pagesRead, totalPages, progress: totalPages > 0 ? Math.round((pagesRead / totalPages) * 100) : 0 };
  },
};
