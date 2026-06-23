import { getSupabaseClient } from '@/template';

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content?: string;
  created_at: string;
  updated_at: string;
}

export const notesService = {
  async fetch(userId: string) {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    return { data: data as Note[] | null, error: error?.message ?? null };
  },

  async create(input: Omit<Note, 'id' | 'created_at' | 'updated_at'>) {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('notes')
      .insert(input)
      .select()
      .single();
    return { data: data as Note | null, error: error?.message ?? null };
  },

  async update(id: string, updates: Partial<Note>) {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('notes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    return { data: data as Note | null, error: error?.message ?? null };
  },

  async remove(id: string) {
    const client = getSupabaseClient();
    const { error } = await client.from('notes').delete().eq('id', id);
    return { error: error?.message ?? null };
  },
};
