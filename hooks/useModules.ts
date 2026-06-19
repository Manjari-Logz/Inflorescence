import { useContext } from 'react';
import { BooksContext } from '@/contexts/BooksContext';
import { PodcastContext } from '@/contexts/PodcastContext';
import { PlacementContext } from '@/contexts/PlacementContext';
import { CustomSectionsContext } from '@/contexts/CustomSectionsContext';
import { ExerciseContext } from '@/contexts/ExerciseContext';
import { ReflectionContext } from '@/contexts/ReflectionContext';
import { MoneyVaultContext } from '@/contexts/MoneyVaultContext';

export function useBooks() {
  const ctx = useContext(BooksContext);
  if (!ctx) throw new Error('useBooks must be used within BooksProvider');
  return ctx;
}

export function usePodcasts() {
  const ctx = useContext(PodcastContext);
  if (!ctx) throw new Error('usePodcasts must be used within PodcastProvider');
  return ctx;
}

export function usePlacement() {
  const ctx = useContext(PlacementContext);
  if (!ctx) throw new Error('usePlacement must be used within PlacementProvider');
  return ctx;
}

export function useCustomSections() {
  const ctx = useContext(CustomSectionsContext);
  if (!ctx) throw new Error('useCustomSections must be used within CustomSectionsProvider');
  return ctx;
}

export function useExercise() {
  const ctx = useContext(ExerciseContext);
  if (!ctx) throw new Error('useExercise must be used within ExerciseProvider');
  return ctx;
}

export function useReflection() {
  const ctx = useContext(ReflectionContext);
  if (!ctx) throw new Error('useReflection must be used within ReflectionProvider');
  return ctx;
}

export function useMoneyVault() {
  const ctx = useContext(MoneyVaultContext);
  if (!ctx) throw new Error('useMoneyVault must be used within MoneyVaultProvider');
  return ctx;
}
