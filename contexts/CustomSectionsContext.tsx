import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from '@/template';
import { customSectionsService, CustomSection, CustomItem } from '@/services/customSectionsService';

interface CustomSectionsContextType {
  sections: CustomSection[];
  loading: boolean;
  addSection: (name: string, color: string, icon: string) => Promise<void>;
  removeSection: (id: string) => Promise<void>;
  addItem: (sectionId: string, input: Omit<CustomItem, 'id' | 'section_id' | 'user_id' | 'created_at'>) => Promise<void>;
  updateItem: (sectionId: string, itemId: string, updates: Partial<CustomItem>) => Promise<void>;
  removeItem: (sectionId: string, itemId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const CustomSectionsContext = createContext<CustomSectionsContextType | undefined>(undefined);

export function CustomSectionsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [sections, setSections] = useState<CustomSection[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await customSectionsService.fetchSections(user.id);
    if (data) setSections(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) load(); else setSections([]);
  }, [user, load]);

  const addSection = async (name: string, color: string, icon: string) => {
    if (!user) return;
    const { data } = await customSectionsService.createSection({ user_id: user.id, name, color, icon });
    if (data) setSections(prev => [{ ...data, items: [] }, ...prev]);
  };

  const removeSection = async (id: string) => {
    const { error } = await customSectionsService.removeSection(id);
    if (!error) setSections(prev => prev.filter(s => s.id !== id));
  };

  const addItem = async (sectionId: string, input: Omit<CustomItem, 'id' | 'section_id' | 'user_id' | 'created_at'>) => {
    if (!user) return;
    const { data } = await customSectionsService.createItem({ ...input, section_id: sectionId, user_id: user.id });
    if (data) setSections(prev => prev.map(s => s.id === sectionId ? { ...s, items: [...(s.items ?? []), data] } : s));
  };

  const updateItem = async (sectionId: string, itemId: string, updates: Partial<CustomItem>) => {
    const { error } = await customSectionsService.updateItem(itemId, updates);
    if (!error) setSections(prev => prev.map(s => s.id === sectionId ? {
      ...s, items: (s.items ?? []).map(i => i.id === itemId ? { ...i, ...updates } : i),
    } : s));
  };

  const removeItem = async (sectionId: string, itemId: string) => {
    const { error } = await customSectionsService.removeItem(itemId);
    if (!error) setSections(prev => prev.map(s => s.id === sectionId ? {
      ...s, items: (s.items ?? []).filter(i => i.id !== itemId),
    } : s));
  };

  return (
    <CustomSectionsContext.Provider value={{ sections, loading, addSection, removeSection, addItem, updateItem, removeItem, refresh: load }}>
      {children}
    </CustomSectionsContext.Provider>
  );
}
