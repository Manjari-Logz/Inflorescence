import supabase from '@/lib/supabase';
import { Task } from '@/services/tasksService';
import { Book } from '@/services/booksService';
import { PlacementCompany } from '@/services/placementService';
import { MOOD_OPTIONS } from '@/services/moodService';

export interface AnalyticsData {
  study: { totalHours: number; totalSubjects: number; totalResources: number; domains: number };
  reading: { totalBooks: number; completed: number; pagesRead: number; progress: number };
  goals: { shortTotal: number; shortCompleted: number; longTotal: number; dreams: number };
  mood: { avgScore: number; entries: number; distribution: Record<string, number> };
  placement: { total: number; offers: number; responseRate: number };
  pomodoro: { sessions: number; totalMinutes: number };
}

export const analyticsService = {
  async fetchPomodoroStats(userId: string) {
    
    const { data } = await supabase.from('pomodoro_sessions').select('*').eq('user_id', userId);
    const sessions = data ?? [];
    const totalMinutes = sessions.reduce((a: number, s: { duration_minutes?: number }) => a + (s.duration_minutes ?? 0), 0);
    return { sessions: sessions.length, totalMinutes };
  },

  computeStudyAnalytics(domains: { subjects?: { study_hours?: number; resources?: unknown[] }[] }[]) {
    const totalSubjects = domains.reduce((a, d) => a + (d.subjects?.length ?? 0), 0);
    const totalResources = domains.reduce((a, d) => a + (d.subjects?.reduce((b, s) => b + (s.resources?.length ?? 0), 0) ?? 0), 0);
    const totalHours = domains.reduce((a, d) => a + (d.subjects?.reduce((b, s) => b + (s.study_hours ?? 0), 0) ?? 0), 0);
    return { totalHours, totalSubjects, totalResources, domains: domains.length };
  },

  computeMoodAnalytics(moods: { mood: string; score: number }[]) {
    const distribution: Record<string, number> = {};
    MOOD_OPTIONS.forEach(m => { distribution[m.label] = 0; });
    moods.forEach(m => { distribution[m.mood] = (distribution[m.mood] ?? 0) + 1; });
    const avgScore = moods.length > 0 ? moods.reduce((a, m) => a + m.score, 0) / moods.length : 0;
    return { avgScore: Math.round(avgScore * 10) / 10, entries: moods.length, distribution };
  },

  computeGoalAnalytics(shortGoals: { completed: boolean }[], longGoals: unknown[], dreams: unknown[]) {
    return {
      shortTotal: shortGoals.length,
      shortCompleted: shortGoals.filter(g => g.completed).length,
      longTotal: longGoals.length,
      dreams: dreams.length,
    };
  },

  computeReadingAnalytics(books: Book[]) {
    const completed = books.filter(b => b.status === 'completed').length;
    const pagesRead = books.reduce((a, b) => a + b.current_page, 0);
    const totalPages = books.reduce((a, b) => a + b.total_pages, 0);
    return { totalBooks: books.length, completed, pagesRead, progress: totalPages > 0 ? Math.round((pagesRead / totalPages) * 100) : 0 };
  },

  computePlacementAnalytics(companies: PlacementCompany[]) {
    const offers = companies.filter(c => c.stage === 'offer' || c.stage === 'accepted').length;
    return { total: companies.length, offers, responseRate: companies.length > 0 ? Math.round((offers / companies.length) * 100) : 0 };
  },
};
