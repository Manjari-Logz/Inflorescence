import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from '@/template';
import { studyService, StudyDomain } from '@/services/studyService';

interface StudyContextType {
  domains: StudyDomain[];
  loading: boolean;
  addDomain: (name: string, color: string) => Promise<void>;
  deleteDomain: (id: string) => Promise<void>;
  addSubject: (domainId: string, name: string) => Promise<void>;
  deleteSubject: (id: string, domainId: string) => Promise<void>;
  addResource: (subjectId: string, domainId: string, type: string, title: string, url?: string) => Promise<void>;
  deleteResource: (id: string, subjectId: string, domainId: string) => Promise<void>;
  updateSubjectHours: (subjectId: string, domainId: string, hours: number) => Promise<void>;
  refresh: () => Promise<void>;
}

export const StudyContext = createContext<StudyContextType | undefined>(undefined);

export function StudyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [domains, setDomains] = useState<StudyDomain[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await studyService.fetchDomains(user.id);
    if (data) setDomains(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) { load(); } else { setDomains([]); }
  }, [user, load]);

  const addDomain = async (name: string, color: string) => {
    if (!user) return;
    const { data } = await studyService.createDomain({ user_id: user.id, name, color });
    if (data) setDomains(prev => [{ ...data, subjects: [] }, ...prev]);
  };

  const deleteDomain = async (id: string) => {
    const { error } = await studyService.deleteDomain(id);
    if (!error) setDomains(prev => prev.filter(d => d.id !== id));
  };

  const addSubject = async (domainId: string, name: string) => {
    if (!user) return;
    const { data } = await studyService.createSubject({ domain_id: domainId, user_id: user.id, name });
    if (data) {
      setDomains(prev => prev.map(d =>
        d.id === domainId
          ? { ...d, subjects: [...(d.subjects || []), { ...data, resources: [] }] }
          : d
      ));
    }
  };

  const deleteSubject = async (id: string, domainId: string) => {
    const { error } = await studyService.deleteSubject(id);
    if (!error) {
      setDomains(prev => prev.map(d =>
        d.id === domainId ? { ...d, subjects: d.subjects?.filter(s => s.id !== id) } : d
      ));
    }
  };

  const addResource = async (subjectId: string, domainId: string, type: string, title: string, url?: string) => {
    if (!user) return;
    const { data } = await studyService.createResource({ subject_id: subjectId, user_id: user.id, type, title, url });
    if (data) {
      setDomains(prev => prev.map(d =>
        d.id === domainId
          ? {
              ...d,
              subjects: d.subjects?.map(s =>
                s.id === subjectId ? { ...s, resources: [...(s.resources || []), data] } : s
              ),
            }
          : d
      ));
    }
  };

  const deleteResource = async (id: string, subjectId: string, domainId: string) => {
    const { error } = await studyService.deleteResource(id);
    if (!error) {
      setDomains(prev => prev.map(d =>
        d.id === domainId
          ? {
              ...d,
              subjects: d.subjects?.map(s =>
                s.id === subjectId ? { ...s, resources: s.resources?.filter(r => r.id !== id) } : s
              ),
            }
          : d
      ));
    }
  };

  const updateSubjectHours = async (subjectId: string, domainId: string, hours: number) => {
    const { error } = await studyService.updateSubjectHours(subjectId, hours);
    if (!error) {
      setDomains(prev => prev.map(d =>
        d.id === domainId
          ? { ...d, subjects: d.subjects?.map(s => s.id === subjectId ? { ...s, study_hours: hours } : s) }
          : d
      ));
    }
  };

  return (
    <StudyContext.Provider value={{ domains, loading, addDomain, deleteDomain, addSubject, deleteSubject, addResource, deleteResource, updateSubjectHours, refresh: load }}>
      {children}
    </StudyContext.Provider>
  );
}
