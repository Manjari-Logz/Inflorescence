import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTasks } from '@/hooks/useTasks';
import { useGoals } from '@/hooks/useGoals';
import { useHabits } from '@/hooks/useHabits';
import { useNotes } from '@/hooks/useNotes';
import { useCustomSections } from '@/hooks/useModules';

const RECENT_SEARCHES_KEY = '@inflorescence_recent_searches';

export interface SearchResultItem {
  id: string;
  type: 'task' | 'goal' | 'habit' | 'note' | 'section';
  title: string;
  subtitle?: string;
  route: string;
  completed?: boolean;
}

interface SearchContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  results: SearchResultItem[];
  recentSearches: string[];
  addRecentSearch: (query: string) => Promise<void>;
  clearRecentSearches: () => Promise<void>;
  isSearchVisible: boolean;
  openSearch: () => void;
  closeSearch: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  const { tasks } = useTasks();
  const { shortGoals, longGoals, dreams } = useGoals();
  const { habits } = useHabits();
  const { notes } = useNotes();
  const { sections } = useCustomSections();

  // Load recent searches
  useEffect(() => {
    AsyncStorage.getItem(RECENT_SEARCHES_KEY).then(val => {
      if (val) setRecentSearches(JSON.parse(val));
    });
  }, []);

  const openSearch = () => setIsSearchVisible(true);
  const closeSearch = () => {
    setIsSearchVisible(false);
    setSearchQuery('');
  };

  const addRecentSearch = async (query: string) => {
    if (!query.trim()) return;
    const clean = query.trim();
    const updated = [clean, ...recentSearches.filter(q => q !== clean)].slice(0, 5);
    setRecentSearches(updated);
    await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  const clearRecentSearches = async () => {
    setRecentSearches([]);
    await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  // Perform search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    const q = searchQuery.toLowerCase();
    const list: SearchResultItem[] = [];

    // 1. Search Tasks
    tasks.forEach(t => {
      if (t.title.toLowerCase().includes(q) || (t.description?.toLowerCase() ?? '').includes(q)) {
        list.push({
          id: t.id,
          type: 'task',
          title: t.title,
          subtitle: t.description || undefined,
          route: '/(tabs)/tasks',
          completed: t.completed,
        });
      }
    });

    // 2. Search Goals
    shortGoals.forEach(g => {
      if (g.title.toLowerCase().includes(q)) {
        list.push({
          id: g.id,
          type: 'goal',
          title: g.title,
          subtitle: 'Short Term Goal',
          route: '/(tabs)/goals',
          completed: g.completed,
        });
      }
    });

    longGoals.forEach(g => {
      if (g.vision.toLowerCase().includes(q)) {
        list.push({
          id: g.id,
          type: 'goal',
          title: g.vision,
          subtitle: 'Long Term Goal',
          route: '/(tabs)/goals',
        });
      }
    });

    dreams.forEach(d => {
      if (d.title.toLowerCase().includes(q) || (d.notes?.toLowerCase() ?? '').includes(q)) {
        list.push({
          id: d.id,
          type: 'goal',
          title: d.title,
          subtitle: `Dream · ${d.category}`,
          route: '/(tabs)/goals',
        });
      }
    });

    // 3. Search Habits
    habits.forEach(h => {
      if (h.name.toLowerCase().includes(q) || (h.description?.toLowerCase() ?? '').includes(q)) {
        list.push({
          id: h.id,
          type: 'habit',
          title: h.name,
          subtitle: h.description || `Streak: ${h.streak} days`,
          route: '/(tabs)/habits',
        });
      }
    });

    // 4. Search Notes
    notes.forEach(n => {
      if (n.title.toLowerCase().includes(q) || (n.content?.toLowerCase() ?? '').includes(q)) {
        list.push({
          id: n.id,
          type: 'note',
          title: n.title,
          subtitle: n.content ? n.content.substring(0, 60) : undefined,
          route: '/modules/notes',
        });
      }
    });

    // 5. Search Sections
    sections.forEach(s => {
      if (s.name.toLowerCase().includes(q)) {
        list.push({
          id: s.id,
          type: 'section',
          title: s.name,
          subtitle: 'Custom Section',
          route: '/modules/custom-sections',
        });
      }
    });

    setResults(list.slice(0, 15));
  }, [searchQuery, tasks, shortGoals, longGoals, dreams, habits, notes, sections]);

  return (
    <SearchContext.Provider
      value={{
        searchQuery,
        setSearchQuery,
        results,
        recentSearches,
        addRecentSearch,
        clearRecentSearches,
        isSearchVisible,
        openSearch,
        closeSearch,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error('useSearch must be used within SearchProvider');
  return ctx;
}
