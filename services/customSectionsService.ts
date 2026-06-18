import { getSupabaseClient } from '@/template';

export interface CustomSection {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string;
  created_at: string;
  items?: CustomItem[];
}

export interface CustomItem {
  id: string;
  section_id: string;
  user_id: string;
  title: string;
  requirements?: string;
  deadline?: string;
  attachment_url?: string;
  completed: boolean;
  created_at: string;
}

export const customSectionsService = {
  async fetchSections(userId: string) {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('custom_sections')
      .select('*, items:custom_items(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data: data as CustomSection[] | null, error: error?.message ?? null };
  },

  async createSection(input: Omit<CustomSection, 'id' | 'created_at' | 'items'>) {
    const client = getSupabaseClient();
    const { data, error } = await client.from('custom_sections').insert(input).select().single();
    return { data: data as CustomSection | null, error: error?.message ?? null };
  },

  async updateSection(id: string, updates: Partial<CustomSection>) {
    const client = getSupabaseClient();
    const { error } = await client.from('custom_sections').update(updates).eq('id', id);
    return { error: error?.message ?? null };
  },

  async removeSection(id: string) {
    const client = getSupabaseClient();
    const { error } = await client.from('custom_sections').delete().eq('id', id);
    return { error: error?.message ?? null };
  },

  async createItem(input: Omit<CustomItem, 'id' | 'created_at'>) {
    const client = getSupabaseClient();
    const { data, error } = await client.from('custom_items').insert(input).select().single();
    return { data: data as CustomItem | null, error: error?.message ?? null };
  },

  async updateItem(id: string, updates: Partial<CustomItem>) {
    const client = getSupabaseClient();
    const { error } = await client.from('custom_items').update(updates).eq('id', id);
    return { error: error?.message ?? null };
  },

  async removeItem(id: string) {
    const client = getSupabaseClient();
    const { error } = await client.from('custom_items').delete().eq('id', id);
    return { error: error?.message ?? null };
  },
};
