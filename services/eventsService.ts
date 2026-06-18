import { getSupabaseClient } from '@/template';

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
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('hackathons')
      .select('*, rounds:hackathon_rounds(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data: data as Hackathon[] | null, error: error?.message ?? null };
  },

  async createHackathon(input: Omit<Hackathon, 'id' | 'created_at' | 'rounds'>) {
    const client = getSupabaseClient();
    const { data, error } = await client.from('hackathons').insert(input).select().single();
    return { data: data as Hackathon | null, error: error?.message ?? null };
  },

  async deleteHackathon(id: string) {
    const client = getSupabaseClient();
    const { error } = await client.from('hackathons').delete().eq('id', id);
    return { error: error?.message ?? null };
  },

  async createRound(input: Omit<Round, 'id' | 'created_at'>) {
    const client = getSupabaseClient();
    const { data, error } = await client.from('hackathon_rounds').insert(input).select().single();
    return { data: data as Round | null, error: error?.message ?? null };
  },

  async updateRound(id: string, updates: Partial<Round>) {
    const client = getSupabaseClient();
    const { error } = await client.from('hackathon_rounds').update(updates).eq('id', id);
    return { error: error?.message ?? null };
  },

  async deleteRound(id: string) {
    const client = getSupabaseClient();
    const { error } = await client.from('hackathon_rounds').delete().eq('id', id);
    return { error: error?.message ?? null };
  },
};
