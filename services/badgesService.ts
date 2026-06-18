import { getSupabaseClient } from '@/template';

export interface Badge {
  id: string;
  user_id: string;
  type: string;
  name: string;
  description?: string;
  module?: string;
  earned_at: string;
}

export const BADGE_MILESTONES = [
  { count: 10, type: 'bronze', name: 'Bronze Badge', description: '10 tasks completed!' },
  { count: 50, type: 'silver', name: 'Silver Badge', description: '50 tasks completed!' },
  { count: 100, type: 'gold', name: 'Gold Badge', description: '100 tasks completed!' },
  { count: 250, type: 'diamond', name: 'Diamond Badge', description: '250 tasks completed!' },
  { count: 500, type: 'master', name: 'Master Badge', description: '500 tasks completed!' },
  { count: 1000, type: 'legend', name: 'Legend Badge', description: '1000 tasks completed!' },
];

export const BADGE_EMOJIS: Record<string, string> = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  diamond: '💎',
  master: '👑',
  legend: '🌟',
  heart: '❤️',
  focus: '🎯',
  health: '💪',
  motivation: '🔥',
};

export const badgesService = {
  async fetchBadges(userId: string) {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('badges')
      .select('*')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });
    return { data: data as Badge[] | null, error: error?.message ?? null };
  },

  async awardBadge(input: Omit<Badge, 'id' | 'earned_at'>) {
    const client = getSupabaseClient();
    const { data, error } = await client.from('badges').insert(input).select().single();
    return { data: data as Badge | null, error: error?.message ?? null };
  },

  async checkAndAwardTaskBadge(userId: string, completedCount: number) {
    const milestone = BADGE_MILESTONES.find(m => m.count === completedCount);
    if (!milestone) return { awarded: false, type: '' };
    const client = getSupabaseClient();
    const { error } = await client.from('badges').insert({
      user_id: userId,
      type: milestone.type,
      name: milestone.name,
      description: milestone.description,
      module: 'tasks',
    });
    return { awarded: !error, type: milestone.type, name: milestone.name };
  },
};
