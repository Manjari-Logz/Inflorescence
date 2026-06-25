import { useContext } from 'react';
import { StudyContext } from '@/contexts/StudyContext';

export function useStudy() {
  const context = useContext(StudyContext);
  if (!context) {
    console.warn('[useStudy] must be used within StudyProvider. Returning fallback.');
    return {
      domains: [],
      loading: false,
      addDomain: async () => {},
      deleteDomain: async () => {},
      addSubject: async () => {},
      deleteSubject: async () => {},
      addResource: async () => {},
      deleteResource: async () => {},
      updateSubjectHours: async () => {},
      refresh: async () => {},
    };
  }
  return context;
}
