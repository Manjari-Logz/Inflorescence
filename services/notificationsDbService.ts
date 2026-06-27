import supabase from '@/lib/supabase';

export interface DbNotification {
  id: string;
  user_id: string;
  title: string;
  body?: string;
  trigger_at?: string;
  delivered: boolean;
  is_read: boolean;
  created_at: string;
}

export const notificationsDbService = {
  async fetch(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data: data as DbNotification[] | null, error: error?.message ?? null };
  },

  async create(userId: string, title: string, body?: string) {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        body,
        is_read: false,
        delivered: true,
        trigger_at: new Date().toISOString(),
      })
      .select()
      .single();
    return { data: data as DbNotification | null, error: error?.message ?? null };
  },

  async markRead(id: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
    return { error: error?.message ?? null };
  },

  async markAllRead(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId);
    return { error: error?.message ?? null };
  },

  async remove(id: string) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);
    return { error: error?.message ?? null };
  },

  async clearAll(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);
    return { error: error?.message ?? null };
  },
};
