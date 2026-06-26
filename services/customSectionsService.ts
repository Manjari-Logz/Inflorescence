import { getSupabaseClient } from '@/template';

export interface CustomSection {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string;
  order: number;
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
      .order('order', { ascending: true })
      .order('created_at', { ascending: false });
    return { data: data as CustomSection[] | null, error: error?.message ?? null };
  },

  async createSection(input: Omit<CustomSection, 'id' | 'created_at' | 'items' | 'order'>) {
    const client = getSupabaseClient();
    
    // Runtime verification logging
    console.log('[customSectionsService] === CLIENT VERIFICATION ===');
    console.log('[customSectionsService] Client constructor name:', client.constructor.name);
    console.log('[customSectionsService] Is Offline Client:', client.constructor.name === 'OfflineSupabaseClient');
    console.log('[customSectionsService] Offline Mode:', (global as any).isOfflineMode);
    console.log('[customSectionsService] Supabase URL:', process.env.EXPO_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING');
    console.log('[customSectionsService] Anon Key Exists:', !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
    
    // Check auth session
    try {
      const session = await (client as any).auth?.getSession();
      console.log('[customSectionsService] Current Session:', session);
    } catch (e) {
      console.log('[customSectionsService] Session check failed:', e);
    }
    
    console.log('[customSectionsService] === END VERIFICATION ===');
    console.log('[customSectionsService] Creating section with input:', input);
    
    // Check for duplicate names
    const { data: existing, error: existingError } = await client
      .from('custom_sections')
      .select('id')
      .eq('user_id', input.user_id)
      .eq('name', input.name)
      .single();
    
    console.log('[customSectionsService] Duplicate check result:', { existing, existingError });
    
    if (existing) {
      console.error('[customSectionsService] Duplicate section name:', input.name);
      return { data: null, error: 'A section with this name already exists' };
    }
    
    // Get the highest order number for this user
    const { data: maxOrderData, error: orderError } = await client
      .from('custom_sections')
      .select('order')
      .eq('user_id', input.user_id)
      .order('order', { ascending: false })
      .limit(1)
      .single();
    
    console.log('[customSectionsService] Max order result:', { maxOrderData, orderError });
    
    const nextOrder = maxOrderData?.order ? maxOrderData.order + 1 : 0;
    console.log('[customSectionsService] Next order value:', nextOrder);
    
    const insertData = { ...input, order: nextOrder };
    console.log('[customSectionsService] Inserting data:', insertData);
    
    const { data, error } = await client
      .from('custom_sections')
      .insert(insertData)
      .select()
      .single();
      
    console.log('[customSectionsService] Insert complete error object:', JSON.stringify(error, null, 2));
    console.log('[customSectionsService] Insert result data:', data);
    
    if (error) {
      console.error('[customSectionsService] Supabase Error:', error);
      console.error('[customSectionsService] Error Message:', error.message);
      console.error('[customSectionsService] Error Code:', error.code);
      console.error('[customSectionsService] Error Details:', error.details);
      console.error('[customSectionsService] Error Hint:', error.hint);
    }
    
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
