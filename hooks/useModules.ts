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
  if (!ctx) {
    console.warn('[useBooks] must be used within BooksProvider. Returning fallback.');
    return {
      books: [],
      loading: false,
      addBook: async () => {},
      updateBook: async () => {},
      removeBook: async () => {},
      refresh: async () => {},
    };
  }
  return ctx;
}

export function usePodcasts() {
  const ctx = useContext(PodcastContext);
  if (!ctx) {
    console.warn('[usePodcasts] must be used within PodcastProvider. Returning fallback.');
    return {
      podcasts: [],
      loading: false,
      addPodcast: async () => {},
      updatePodcast: async () => {},
      removePodcast: async () => {},
      refresh: async () => {},
    };
  }
  return ctx;
}

export function usePlacement() {
  const ctx = useContext(PlacementContext);
  if (!ctx) {
    console.warn('[usePlacement] must be used within PlacementProvider. Returning fallback.');
    return {
      companies: [],
      loading: false,
      addCompany: async () => {},
      updateCompany: async () => {},
      removeCompany: async () => {},
      refresh: async () => {},
    };
  }
  return ctx;
}

export function useCustomSections() {
  const ctx = useContext(CustomSectionsContext);
  if (!ctx) {
    console.warn('[useCustomSections] must be used within CustomSectionsProvider. Returning fallback.');
    return {
      sections: [],
      loading: false,
      addSection: async () => {},
      removeSection: async () => {},
      addItem: async () => {},
      updateItem: async () => {},
      removeItem: async () => {},
      refresh: async () => {},
    };
  }
  return ctx;
}

export function useExercise() {
  const ctx = useContext(ExerciseContext);
  if (!ctx) {
    console.warn('[useExercise] must be used within ExerciseProvider. Returning fallback.');
    return {
      logs: [],
      loading: false,
      addLog: async () => {},
      updateLog: async () => {},
      removeLog: async () => {},
      refresh: async () => {},
    };
  }
  return ctx;
}

export function useReflection() {
  const ctx = useContext(ReflectionContext);
  if (!ctx) {
    console.warn('[useReflection] must be used within ReflectionProvider. Returning fallback.');
    return {
      reflections: [],
      loading: false,
      todayReflection: null,
      saveReflection: async () => {},
      removeReflection: async () => {},
      refresh: async () => {},
    };
  }
  return ctx;
}

export function useMoneyVault() {
  const ctx = useContext(MoneyVaultContext);
  if (!ctx) {
    console.warn('[useMoneyVault] must be used within MoneyVaultProvider. Returning fallback.');
    return {
      expenses: [],
      settings: {
        cash_in_hand: 0, wallet_balance: 0, bank_balance: 0,
        savings_goal: 0, emergency_fund: 0, monthly_budget: 0,
      },
      loading: false,
      addExpense: async () => {},
      updateExpense: async () => {},
      removeExpense: async () => {},
      saveSettings: async () => {},
      refresh: async () => {},
    };
  }
  return ctx;
}
