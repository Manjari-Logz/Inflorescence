import { getSupabaseClient } from '@/template';

export interface HistoryRecord {
  id: string;
  task_id?: string;
  user_id: string;
  task_title: string;
  description?: string;
  project_id?: string;
  project_name?: string;
  category: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  tags: string[];
  notes?: string;
  estimated_time: number;
  actual_time: number;
  completed_at: string;
  created_at: string;
  archived: boolean;
  completed_by?: string;
}

export const historyService = {
  async fetch(userId: string) {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('history')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });
    
    // Parse tags JSON array if stringified
    const parsedData = (data || []).map((item: any) => ({
      ...item,
      tags: Array.isArray(item.tags)
        ? item.tags
        : typeof item.tags === 'string'
        ? JSON.parse(item.tags)
        : [],
    }));

    return { data: parsedData as HistoryRecord[] | null, error: error?.message ?? null };
  },

  async create(input: Omit<HistoryRecord, 'id' | 'created_at'>) {
    const client = getSupabaseClient();
    const payload = {
      ...input,
      tags: Array.isArray(input.tags) ? input.tags : [],
      completed_at: input.completed_at || new Date().toISOString(),
    };
    const { data, error } = await client
      .from('history')
      .insert(payload)
      .select()
      .single();

    if (data) {
      data.tags = Array.isArray(data.tags)
        ? data.tags
        : typeof data.tags === 'string'
        ? JSON.parse(data.tags)
        : [];
    }

    return { data: data as HistoryRecord | null, error: error?.message ?? null };
  },

  async removeByTaskId(taskId: string) {
    const client = getSupabaseClient();
    const { error } = await client
      .from('history')
      .delete()
      .eq('task_id', taskId);
    return { error: error?.message ?? null };
  },

  async remove(id: string) {
    const client = getSupabaseClient();
    const { error } = await client
      .from('history')
      .delete()
      .eq('id', id);
    return { error: error?.message ?? null };
  },

  async clearAll(userId: string) {
    const client = getSupabaseClient();
    const { error } = await client
      .from('history')
      .delete()
      .eq('user_id', userId);
    return { error: error?.message ?? null };
  },
};
