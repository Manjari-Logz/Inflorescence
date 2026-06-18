import { useContext } from 'react';
import { StudyContext } from '@/contexts/StudyContext';

export function useStudy() {
  const context = useContext(StudyContext);
  if (!context) throw new Error('useStudy must be used within StudyProvider');
  return context;
}
