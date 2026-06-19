import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from '@/template';
import { moneyVaultService, Expense, MoneyVaultSettings } from '@/services/moneyVaultService';

interface MoneyVaultContextType {
  expenses: Expense[];
  settings: MoneyVaultSettings;
  loading: boolean;
  addExpense: (input: Omit<Expense, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  removeExpense: (id: string) => Promise<void>;
  saveSettings: (s: MoneyVaultSettings) => Promise<void>;
  refresh: () => Promise<void>;
}

const DEFAULT_SETTINGS: MoneyVaultSettings = {
  cash_in_hand: 0, wallet_balance: 0, bank_balance: 0,
  savings_goal: 0, emergency_fund: 0, monthly_budget: 0,
};

export const MoneyVaultContext = createContext<MoneyVaultContextType | undefined>(undefined);

export function MoneyVaultProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settings, setSettings] = useState<MoneyVaultSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data }, s] = await Promise.all([
      moneyVaultService.fetchExpenses(user.id),
      moneyVaultService.fetchSettings(user.id),
    ]);
    if (data) setExpenses(data);
    setSettings(s);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) load(); else { setExpenses([]); setSettings(DEFAULT_SETTINGS); }
  }, [user, load]);

  const addExpense = async (input: Omit<Expense, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return;
    const { data } = await moneyVaultService.createExpense({ ...input, user_id: user.id });
    if (data) setExpenses(prev => [data, ...prev]);
  };

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    const { error } = await moneyVaultService.updateExpense(id, updates);
    if (!error) setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const removeExpense = async (id: string) => {
    const { error } = await moneyVaultService.deleteExpense(id);
    if (!error) setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const saveSettings = async (s: MoneyVaultSettings) => {
    if (!user) return;
    setSettings(s);
    await moneyVaultService.upsertSettings(user.id, s);
  };

  return (
    <MoneyVaultContext.Provider value={{ expenses, settings, loading, addExpense, updateExpense, removeExpense, saveSettings, refresh: load }}>
      {children}
    </MoneyVaultContext.Provider>
  );
}
