import supabase from '@/lib/supabase';

export interface Hackathon {
  id: string;
  user_id: string;
  name: string;
  theme?: string;
  problem_statement?: string;
  organizer?: string;
  registration_link?: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
  rounds?: Round[];
}

export interface Round {
  id: string;
  hackathon_id: string;
  name: string;
  deadline?: string;
  requirements?: string;
  mode: string;
  location?: string;
  status: string;
  round_number: number;
  created_at: string;
}

export const eventsService = {
  async fetchHackathons(userId: string) {
    const { data, error } = await supabase
      .from('hackathons')
      .select('*, rounds:hackathon_rounds(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data: data as Hackathon[] | null, error: error?.message ?? null };
  },

  async createHackathon(input: Omit<Hackathon, 'id' | 'created_at' | 'rounds'>) {
    
    const { data, error } = await supabase.from('hackathons').insert(input).select().single();
    return { data: data as Hackathon | null, error: error?.message ?? null };
  },

  async updateHackathon(id: string, updates: Partial<Omit<Hackathon, 'id' | 'created_at' | 'rounds'>>) {
    
    const { error } = await supabase.from('hackathons').update(updates).eq('id', id);
    return { error: error?.message ?? null };
  },

  async deleteHackathon(id: string) {
    
    const { error } = await supabase.from('hackathons').delete().eq('id', id);
    return { error: error?.message ?? null };
  },

  async createRound(input: Omit<Round, 'id' | 'created_at'>) {
    
    const { data, error } = await supabase.from('hackathon_rounds').insert(input).select().single();
    return { data: data as Round | null, error: error?.message ?? null };
  },

  async updateRound(id: string, updates: Partial<Round>) {
    
    const { error } = await supabase.from('hackathon_rounds').update(updates).eq('id', id);
    return { error: error?.message ?? null };
  },

  async deleteRound(id: string) {
    
    const { error } = await supabase.from('hackathon_rounds').delete().eq('id', id);
    return { error: error?.message ?? null };
  },
};
