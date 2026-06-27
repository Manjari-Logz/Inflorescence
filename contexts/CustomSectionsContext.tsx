import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { customSectionsService, CustomSection, CustomItem } from '@/services/customSectionsService';
import { useNotifications } from '@/hooks/useNotifications';

interface CustomSectionsContextType {
  sections: CustomSection[];
  loading: boolean;
  addSection: (name: string, color: string, icon: string) => Promise<void>;
  updateSection: (id: string, updates: { name?: string; color?: string; icon?: string }) => Promise<void>;
  removeSection: (id: string) => Promise<void>;
  addItem: (sectionId: string, input: Omit<CustomItem, 'id' | 'section_id' | 'user_id' | 'created_at'>) => Promise<void>;
  updateItem: (sectionId: string, itemId: string, updates: Partial<CustomItem>) => Promise<void>;
  removeItem: (sectionId: string, itemId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const CustomSectionsContext = createContext<CustomSectionsContextType | undefined>(undefined);

export function CustomSectionsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
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
    console.log('[CustomSectionsContext] Current User:', user);
    console.log('[CustomSectionsContext] User ID:', user?.id);
    if (!user) {
      console.error('[CustomSectionsContext] No authenticated user found');
      throw new Error('User not authenticated');
    }
    console.log('[CustomSectionsContext] Adding section:', { name, color, icon });
    const { data, error } = await customSectionsService.createSection({ user_id: user.id, name, color, icon });
    if (error) {
      console.error('[CustomSectionsContext] Failed to add section:', error);
      throw new Error(error);
    }
    if (data) {
      console.log('[CustomSectionsContext] Section added successfully:', data.id);
      await load();
      await addNotification('Custom Section Created', `Section "${name}" has been created successfully.`);
    }
  };

  const updateSection = async (id: string, updates: { name?: string; color?: string; icon?: string }) => {
    console.log('[CustomSectionsContext] Updating section:', id, updates);
    const { error } = await customSectionsService.updateSection(id, updates);
    if (error) {
      console.error('[CustomSectionsContext] Failed to update section:', error);
      throw new Error(error);
    }
    console.log('[CustomSectionsContext] Section updated successfully');
    await load();
  };

  const removeSection = async (id: string) => {
    console.log('[CustomSectionsContext] Removing section:', id);
    const section = sections.find(s => s.id === id);
    const { error } = await customSectionsService.removeSection(id);
    if (error) {
      console.error('[CustomSectionsContext] Failed to remove section:', error);
      throw new Error(error);
    }
    console.log('[CustomSectionsContext] Section removed successfully');
    await load();
    if (section) {
      await addNotification('Custom Section Deleted', `Section "${section.name}" has been deleted.`);
    }
  };

  const addItem = async (sectionId: string, input: Omit<CustomItem, 'id' | 'section_id' | 'user_id' | 'created_at'>) => {
    if (!user) return;
    console.log('[CustomSectionsContext] Adding item to section:', sectionId, input);
    const { data, error } = await customSectionsService.createItem({ ...input, section_id: sectionId, user_id: user.id });
    if (error) {
      console.error('[CustomSectionsContext] Failed to add item:', error);
      throw new Error(error);
    }
    if (data) {
      console.log('[CustomSectionsContext] Item added successfully:', data.id);
      setSections(prev => prev.map(s => s.id === sectionId ? { ...s, items: [...(s.items ?? []), data] } : s));
    }
  };

  const updateItem = async (sectionId: string, itemId: string, updates: Partial<CustomItem>) => {
    console.log('[CustomSectionsContext] Updating item:', itemId, updates);
    const { error } = await customSectionsService.updateItem(itemId, updates);
    if (error) {
      console.error('[CustomSectionsContext] Failed to update item:', error);
      throw new Error(error);
    }
    console.log('[CustomSectionsContext] Item updated successfully');
    setSections(prev => prev.map(s => s.id === sectionId ? {
      ...s, items: (s.items ?? []).map(i => i.id === itemId ? { ...i, ...updates } : i),
    } : s));
  };

  const removeItem = async (sectionId: string, itemId: string) => {
    console.log('[CustomSectionsContext] Removing item:', itemId);
    const { error } = await customSectionsService.removeItem(itemId);
    if (error) {
      console.error('[CustomSectionsContext] Failed to remove item:', error);
      throw new Error(error);
    }
    console.log('[CustomSectionsContext] Item removed successfully');
    setSections(prev => prev.map(s => s.id === sectionId ? {
      ...s, items: (s.items ?? []).filter(i => i.id !== itemId),
    } : s));
  };

  return (
    <CustomSectionsContext.Provider value={{ sections, loading, addSection, updateSection, removeSection, addItem, updateItem, removeItem, refresh: load }}>
      {children}
    </CustomSectionsContext.Provider>
  );
}
