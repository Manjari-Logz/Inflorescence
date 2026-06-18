import { getSupabaseClient } from '@/template';

export type PlacementStage = 'applied' | 'screening' | 'interview' | 'offer' | 'rejected' | 'accepted';

export interface PlacementCompany {
  id: string;
  user_id: string;
  name: string;
  role?: string;
  package_amount?: string;
  resume_url?: string;
  stage: PlacementStage;
  notes?: string;
  deadline?: string;
  created_at: string;
  updated_at: string;
}

export const PLACEMENT_STAGES: { key: PlacementStage; label: string; color: string }[] = [
  { key: 'applied', label: 'Applied', color: '#29B6F6' },
  { key: 'screening', label: 'Screening', color: '#7E57C2' },
  { key: 'interview', label: 'Interview', color: '#FF9800' },
  { key: 'offer', label: 'Offer', color: '#4CAF50' },
  { key: 'accepted', label: 'Accepted', color: '#00BCD4' },
  { key: 'rejected', label: 'Rejected', color: '#EF5350' },
];

export const placementService = {
  async fetch(userId: string) {
    const client = getSupabaseClient();
    const { data, error } = await client.from('placement_companies').select('*').eq('user_id', userId).order('updated_at', { ascending: false });
    return { data: data as PlacementCompany[] | null, error: error?.message ?? null };
  },

  async create(input: Omit<PlacementCompany, 'id' | 'created_at' | 'updated_at'>) {
    const client = getSupabaseClient();
    const { data, error } = await client.from('placement_companies').insert(input).select().single();
    return { data: data as PlacementCompany | null, error: error?.message ?? null };
  },

  async update(id: string, updates: Partial<PlacementCompany>) {
    const client = getSupabaseClient();
    const { data, error } = await client.from('placement_companies').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    return { data: data as PlacementCompany | null, error: error?.message ?? null };
  },

  async remove(id: string) {
    const client = getSupabaseClient();
    const { error } = await client.from('placement_companies').delete().eq('id', id);
    return { error: error?.message ?? null };
  },

  getAnalytics(companies: PlacementCompany[]) {
    const byStage: Record<string, number> = {};
    PLACEMENT_STAGES.forEach(s => { byStage[s.key] = 0; });
    companies.forEach(c => { byStage[c.stage] = (byStage[c.stage] ?? 0) + 1; });
    const offers = companies.filter(c => c.stage === 'offer' || c.stage === 'accepted').length;
    return { total: companies.length, byStage, offers, responseRate: companies.length > 0 ? Math.round((offers / companies.length) * 100) : 0 };
  },
};
