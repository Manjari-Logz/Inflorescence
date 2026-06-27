import supabase from '@/lib/supabase';

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
    console.log('[customSectionsService] Fetching sections for user:', userId);
    const { data, error } = await supabase
      .from('custom_sections')
      .select('id, user_id, name, color, icon, created_at, items:custom_items(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[customSectionsService] Fetch sections failed. Full error:', error);
      return { data: null, error: error.message };
    }
    return { data: data as CustomSection[] | null, error: null };
  },

  async createSection(input: Omit<CustomSection, 'id' | 'created_at' | 'items' | 'order'>) {
    console.log('[customSectionsService] Creating section with input:', input);
    
    // Check for duplicate names
    const { data: existing, error: dupError } = await supabase
      .from('custom_sections')
      .select('id')
      .eq('user_id', input.user_id)
      .eq('name', input.name)
      .limit(1);

    if (dupError) {
      console.warn('[customSectionsService] Duplicate check warning. Full error:', dupError);
    }
    
    if (existing && existing.length > 0) {
      console.error('[customSectionsService] Duplicate section name:', input.name);
      return { data: null, error: 'A section with this name already exists' };
    }
    
    // Insert first without returning columns to avoid postgrest schema cache validation issues
    const { error: insertError } = await supabase
      .from('custom_sections')
      .insert(input);
    
    if (insertError) {
      console.error('[customSectionsService] Insert section failed. Full error:', insertError);
      return { data: null, error: insertError.message };
    }

    // Select the newly created section explicitly specifying known valid fields
    const { data, error: selectError } = await supabase
      .from('custom_sections')
      .select('id, user_id, name, color, icon, created_at')
      .eq('user_id', input.user_id)
      .eq('name', input.name)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (selectError) {
      console.error('[customSectionsService] Select after insert failed. Full error:', selectError);
      return { data: null, error: selectError.message };
    }

    console.log('[customSectionsService] Section created successfully:', data);
    return { data: data as CustomSection | null, error: null };
  },

  async updateSection(id: string, updates: Partial<CustomSection>) {
    console.log('[customSectionsService] Updating section:', id, updates);
    // Strip order field updates if passing through to avoid schema cache validation
    const { order, ...allowedUpdates } = updates;
    const { error } = await supabase.from('custom_sections').update(allowedUpdates).eq('id', id);
    if (error) {
      console.error('[customSectionsService] Update section failed. Full error:', error);
    }
    return { error: error?.message ?? null };
  },

  async removeSection(id: string) {
    console.log('[customSectionsService] Removing section:', id);
    const { error } = await supabase.from('custom_sections').delete().eq('id', id);
    if (error) {
      console.error('[customSectionsService] Remove section failed. Full error:', error);
    }
    return { error: error?.message ?? null };
  },

  async createItem(input: Omit<CustomItem, 'id' | 'created_at'>) {
    
    const { data, error } = await supabase.from('custom_items').insert(input).select().single();
    return { data: data as CustomItem | null, error: error?.message ?? null };
  },

  async updateItem(id: string, updates: Partial<CustomItem>) {
    
    const { error } = await supabase.from('custom_items').update(updates).eq('id', id);
    return { error: error?.message ?? null };
  },

  async removeItem(id: string) {
    
    const { error } = await supabase.from('custom_items').delete().eq('id', id);
    return { error: error?.message ?? null };
  },
};
