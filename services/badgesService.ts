import supabase from '@/lib/supabase';

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
  reader: '📖',
  scholar: '🎓',
};

export const BADGE_IMAGES: Record<string, { gradient: [string, string]; icon: string }> = {
  bronze: { gradient: ['#CD7F32', '#8B4513'], icon: '🥉' },
  silver: { gradient: ['#C0C0C0', '#808080'], icon: '🥈' },
  gold: { gradient: ['#FFD700', '#FFA000'], icon: '🥇' },
  diamond: { gradient: ['#B9F2FF', '#0288D1'], icon: '💎' },
  master: { gradient: ['#FF69B4', '#E91E63'], icon: '👑' },
  legend: { gradient: ['#FF4500', '#FFD700'], icon: '🌟' },
  heart: { gradient: ['#FF6B9D', '#E91E63'], icon: '❤️' },
  focus: { gradient: ['#29B6F6', '#0288D1'], icon: '🎯' },
  health: { gradient: ['#4CAF50', '#2E7D32'], icon: '💪' },
  motivation: { gradient: ['#FFC107', '#FF9800'], icon: '🔥' },
  reader: { gradient: ['#7E57C2', '#5E35B1'], icon: '📖' },
  scholar: { gradient: ['#5C6BC0', '#3949AB'], icon: '🎓' },
};

export const badgesService = {
  async fetchBadges(userId: string) {
    const { data, error } = await supabase
      .from('badges')
      .select('*')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });
    return { data: data as Badge[] | null, error: error?.message ?? null };
  },

  async awardBadge(input: Omit<Badge, 'id' | 'earned_at'>) {
    
    const { data, error } = await supabase.from('badges').insert(input).select().single();
    return { data: data as Badge | null, error: error?.message ?? null };
  },

  async hasBadge(userId: string, type: string, module: string) {
    
    const { data } = await supabase.from('badges').select('id').eq('user_id', userId).eq('type', type).eq('module', module).maybeSingle();
    return !!data;
  },

  async awardIfNew(input: Omit<Badge, 'id' | 'earned_at'>) {
    const exists = await this.hasBadge(input.user_id, input.type, input.module ?? 'general');
    if (exists) return { awarded: false, type: input.type, name: input.name };
    const { data, error } = await this.awardBadge(input);
    return { awarded: !error && !!data, type: input.type, name: input.name, badge: data };
  },

  async checkAndAwardTaskBadge(userId: string, completedCount: number) {
    const milestone = BADGE_MILESTONES.find(m => m.count === completedCount);
    if (!milestone) return { awarded: false, type: '' };
    return this.awardIfNew({
      user_id: userId,
      type: milestone.type,
      name: milestone.name,
      description: milestone.description,
      module: 'tasks',
    });
  },

  async checkReadingBadge(userId: string, booksCompleted: number) {
    if (booksCompleted === 1) return this.awardIfNew({ user_id: userId, type: 'reader', name: 'First Book', description: 'Completed your first book!', module: 'books' });
    if (booksCompleted === 5) return this.awardIfNew({ user_id: userId, type: 'scholar', name: 'Scholar', description: 'Completed 5 books!', module: 'books' });
    return { awarded: false, type: '' };
  },

  async awardMoodBadge(userId: string) {
    return this.awardIfNew({ user_id: userId, type: 'heart', name: 'Heart Badge', description: 'Logged a happy mood!', module: 'mood' });
  },

  async awardFocusBadge(userId: string, pomodoroCount: number) {
    if (pomodoroCount >= 10) return this.awardIfNew({ user_id: userId, type: 'focus', name: 'Focus Master', description: '10 Pomodoro sessions!', module: 'pomodoro' });
    return { awarded: false, type: '' };
  },

  async awardHealthBadge(userId: string, exerciseCount: number) {
    if (exerciseCount >= 7) return this.awardIfNew({ user_id: userId, type: 'health', name: 'Fitness Streak', description: '7 exercise sessions!', module: 'exercise' });
    return { awarded: false, type: '' };
  },
};
