import { getSupabaseClient } from '@/template';

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Milestone {
  id: string;
  text: string;
  done: boolean;
}

export interface ShortGoal {
  id: string;
  user_id: string;
  title: string;
  due_date?: string;
  progress: number;
  checklist: ChecklistItem[];
  completed: boolean;
  created_at: string;
}

export interface LongGoal {
  id: string;
  user_id: string;
  vision: string;
  milestones: Milestone[];
  timeline?: string;
  resources?: string;
  notes?: string;
  progress: number;
  created_at: string;
}

export interface Dream {
  id: string;
  user_id: string;
  category: string;
  title: string;
  notes?: string;
  target_year?: number;
  created_at: string;
}

export const goalsService = {
  async fetchShortGoals(userId: string) {
    const client = getSupabaseClient();
    const { data, error } = await client.from('short_goals').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    return { data: data as ShortGoal[] | null, error: error?.message ?? null };
  },
  async createShortGoal(input: Omit<ShortGoal, 'id' | 'created_at'>) {
    const client = getSupabaseClient();
    const { data, error } = await client.from('short_goals').insert(input).select().single();
    return { data: data as ShortGoal | null, error: error?.message ?? null };
  },
  async updateShortGoal(id: string, updates: Partial<ShortGoal>) {
    const client = getSupabaseClient();
    const { error } = await client.from('short_goals').update(updates).eq('id', id);
    return { error: error?.message ?? null };
  },
  async deleteShortGoal(id: string) {
    const client = getSupabaseClient();
    const { error } = await client.from('short_goals').delete().eq('id', id);
    return { error: error?.message ?? null };
  },

  async fetchLongGoals(userId: string) {
    const client = getSupabaseClient();
    const { data, error } = await client.from('long_goals').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    return { data: data as LongGoal[] | null, error: error?.message ?? null };
  },
  async createLongGoal(input: Omit<LongGoal, 'id' | 'created_at'>) {
    const client = getSupabaseClient();
    const { data, error } = await client.from('long_goals').insert(input).select().single();
    return { data: data as LongGoal | null, error: error?.message ?? null };
  },
  async updateLongGoal(id: string, updates: Partial<LongGoal>) {
    const client = getSupabaseClient();
    const { error } = await client.from('long_goals').update(updates).eq('id', id);
    return { error: error?.message ?? null };
  },
  async deleteLongGoal(id: string) {
    const client = getSupabaseClient();
    const { error } = await client.from('long_goals').delete().eq('id', id);
    return { error: error?.message ?? null };
  },

  async fetchDreams(userId: string) {
    const client = getSupabaseClient();
    const { data, error } = await client.from('dreams').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    return { data: data as Dream[] | null, error: error?.message ?? null };
  },
  async createDream(input: Omit<Dream, 'id' | 'created_at'>) {
    const client = getSupabaseClient();
    const { data, error } = await client.from('dreams').insert(input).select().single();
    return { data: data as Dream | null, error: error?.message ?? null };
  },
  async deleteDream(id: string) {
    const client = getSupabaseClient();
    const { error } = await client.from('dreams').delete().eq('id', id);
    return { error: error?.message ?? null };
  },
};
