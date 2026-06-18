import { getSupabaseClient } from '@/template';

export interface StudyDomain {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
  subjects?: StudySubject[];
}

export interface StudySubject {
  id: string;
  domain_id: string;
  user_id: string;
  name: string;
  study_hours: number;
  created_at: string;
  resources?: StudyResource[];
}

export interface StudyResource {
  id: string;
  subject_id: string;
  user_id: string;
  type: string;
  title: string;
  url?: string;
  created_at: string;
}

export const studyService = {
  async fetchDomains(userId: string) {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('study_domains')
      .select('*, subjects:study_subjects(*, resources:study_resources(*))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data: data as StudyDomain[] | null, error: error?.message ?? null };
  },

  async createDomain(input: { user_id: string; name: string; color: string }) {
    const client = getSupabaseClient();
    const { data, error } = await client.from('study_domains').insert(input).select().single();
    return { data: data as StudyDomain | null, error: error?.message ?? null };
  },

  async deleteDomain(id: string) {
    const client = getSupabaseClient();
    const { error } = await client.from('study_domains').delete().eq('id', id);
    return { error: error?.message ?? null };
  },

  async createSubject(input: { domain_id: string; user_id: string; name: string }) {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('study_subjects')
      .insert({ ...input, study_hours: 0 })
      .select()
      .single();
    return { data: data as StudySubject | null, error: error?.message ?? null };
  },

  async updateSubjectHours(id: string, hours: number) {
    const client = getSupabaseClient();
    const { error } = await client.from('study_subjects').update({ study_hours: hours }).eq('id', id);
    return { error: error?.message ?? null };
  },

  async deleteSubject(id: string) {
    const client = getSupabaseClient();
    const { error } = await client.from('study_subjects').delete().eq('id', id);
    return { error: error?.message ?? null };
  },

  async createResource(input: { subject_id: string; user_id: string; type: string; title: string; url?: string }) {
    const client = getSupabaseClient();
    const { data, error } = await client.from('study_resources').insert(input).select().single();
    return { data: data as StudyResource | null, error: error?.message ?? null };
  },

  async deleteResource(id: string) {
    const client = getSupabaseClient();
    const { error } = await client.from('study_resources').delete().eq('id', id);
    return { error: error?.message ?? null };
  },
};
