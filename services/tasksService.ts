import { getSupabaseClient } from '@/template';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  deadline?: string;
  category: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  estimated_time?: number;
  progress: number;
  notes?: string;
  completed: boolean;
  completed_at?: string;
  archived?: boolean;
  created_at: string;
}

export const tasksService = {
  async fetch(userId: string) {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data: data as Task[] | null, error: error?.message ?? null };
  },

  async create(input: Omit<Task, 'id' | 'created_at'>) {
    const client = getSupabaseClient();
    const { data, error } = await client.from('tasks').insert(input).select().single();
    return { data: data as Task | null, error: error?.message ?? null };
  },

  async update(id: string, updates: Partial<Task>) {
    const client = getSupabaseClient();
    const { error } = await client.from('tasks').update(updates).eq('id', id);
    return { error: error?.message ?? null };
  },

  async remove(id: string) {
    const client = getSupabaseClient();
    const { error } = await client.from('tasks').delete().eq('id', id);
    return { error: error?.message ?? null };
  },
};
