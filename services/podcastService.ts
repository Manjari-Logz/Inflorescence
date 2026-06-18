import { getSupabaseClient } from '@/template';

export interface Podcast {
  id: string;
  user_id: string;
  title: string;
  host?: string;
  platform: 'youtube' | 'spotify' | 'other';
  url?: string;
  thumbnail_url?: string;
  duration_minutes: number;
  playlist_order: number;
  completed: boolean;
  created_at: string;
}

export function detectPlatform(url: string): Podcast['platform'] {
  if (url.includes('spotify.com') || url.includes('open.spotify.com')) return 'spotify';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  return 'other';
}

export function getEmbedUrl(url: string, platform: Podcast['platform']): string | null {
  if (!url) return null;
  if (platform === 'youtube') {
    const match = url.match(/(?:v=|youtu\.be\/)([\w-]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  }
  if (platform === 'spotify') {
    const match = url.match(/episode\/([\w\d]+)|track\/([\w\d]+)|show\/([\w\d]+)/);
    const id = match?.[1] ?? match?.[2] ?? match?.[3];
    const type = url.includes('episode') ? 'episode' : url.includes('track') ? 'track' : 'show';
    return id ? `https://open.spotify.com/embed/${type}/${id}` : null;
  }
  return url;
}

export const podcastService = {
  async fetch(userId: string) {
    const client = getSupabaseClient();
    const { data, error } = await client.from('podcasts').select('*').eq('user_id', userId).order('playlist_order', { ascending: true });
    return { data: data as Podcast[] | null, error: error?.message ?? null };
  },

  async create(input: Omit<Podcast, 'id' | 'created_at'>) {
    const client = getSupabaseClient();
    const { data, error } = await client.from('podcasts').insert(input).select().single();
    return { data: data as Podcast | null, error: error?.message ?? null };
  },

  async update(id: string, updates: Partial<Podcast>) {
    const client = getSupabaseClient();
    const { data, error } = await client.from('podcasts').update(updates).eq('id', id).select().single();
    return { data: data as Podcast | null, error: error?.message ?? null };
  },

  async remove(id: string) {
    const client = getSupabaseClient();
    const { error } = await client.from('podcasts').delete().eq('id', id);
    return { error: error?.message ?? null };
  },
};
