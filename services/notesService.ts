import supabase from '@/lib/supabase';

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content?: string;
  /** Optional parent entity for attaching notes */
  parent_type?: string; // e.g., 'task', 'study_chamber', 'resource'
  parent_id?: string;
  /** Optional tags array */
  tags?: string[];
  /** Optional color label in hex */
  color?: string;
  /** Pin flag */
  pinned?: boolean;
  created_at: string;
  updated_at: string;
}

export const notesService = {
  async fetch(userId: string) {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    return { data: data as Note[] | null, error: error?.message ?? null };
  },

  async create(input: Omit<Note, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('notes')
      .insert({ ...input, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .select()
      .single();
    return { data: data as Note | null, error: error?.message ?? null };
  },

  async update(id: string, updates: Partial<Note>) {
    const { data, error } = await supabase
      .from('notes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    return { data: data as Note | null, error: error?.message ?? null };
  },

  async remove(id: string) {
    
    const { error } = await supabase.from('notes').delete().eq('id', id);
    return { error: error?.message ?? null };
  },
};
