import { getSupabaseClient } from '@/template';

export type ExpenseCategory = 'Food' | 'Travel' | 'Shopping' | 'Education' | 'Bills' | 'Health' | 'Entertainment' | 'Other';
export type PaymentMethod = 'Cash' | 'UPI' | 'Card' | 'Net Banking' | 'Other';

export interface Expense {
  id: string;
  user_id: string;
  amount: number;
  category: ExpenseCategory;
  description?: string;
  payment_method: PaymentMethod;
  date: string;
  created_at: string;
}

export interface MoneyVaultSettings {
  cash_in_hand: number;
  wallet_balance: number;
  bank_balance: number;
  savings_goal: number;
  emergency_fund: number;
  monthly_budget: number;
}

export const moneyVaultService = {
  async fetchExpenses(userId: string) {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    return { data: data as Expense[] | null, error: error?.message ?? null };
  },

  async createExpense(input: Omit<Expense, 'id' | 'created_at'>) {
    const client = getSupabaseClient();
    const { data, error } = await client.from('expenses').insert(input).select().single();
    return { data: data as Expense | null, error: error?.message ?? null };
  },

  async updateExpense(id: string, updates: Partial<Expense>) {
    const client = getSupabaseClient();
    const { error } = await client.from('expenses').update(updates).eq('id', id);
    return { error: error?.message ?? null };
  },

  async deleteExpense(id: string) {
    const client = getSupabaseClient();
    const { error } = await client.from('expenses').delete().eq('id', id);
    return { error: error?.message ?? null };
  },

  async fetchSettings(userId: string): Promise<MoneyVaultSettings> {
    const client = getSupabaseClient();
    const { data } = await client.from('money_vault_settings').select('*').eq('user_id', userId).single();
    return data ?? { cash_in_hand: 0, wallet_balance: 0, bank_balance: 0, savings_goal: 0, emergency_fund: 0, monthly_budget: 0 };
  },

  async upsertSettings(userId: string, settings: MoneyVaultSettings) {
    const client = getSupabaseClient();
    const { error } = await client.from('money_vault_settings').upsert({ user_id: userId, ...settings }, { onConflict: 'user_id' });
    return { error: error?.message ?? null };
  },

  getStats(expenses: Expense[], budget: number) {
    const today = new Date().toISOString().split('T')[0];
    const monthStart = new Date();
    monthStart.setDate(1);
    const monthStr = monthStart.toISOString().split('T')[0];

    const todaySpend = expenses.filter(e => e.date === today).reduce((s, e) => s + e.amount, 0);
    const monthSpend = expenses.filter(e => e.date >= monthStr).reduce((s, e) => s + e.amount, 0);
    const remaining = Math.max(0, budget - monthSpend);

    const byCategory: Record<string, number> = {};
    expenses.filter(e => e.date >= monthStr).forEach(e => {
      byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount;
    });

    return { todaySpend, monthSpend, remaining, byCategory };
  },
};
