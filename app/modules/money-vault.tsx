import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Modal,
  KeyboardAvoidingView, Platform, ActivityIndicator, StatusBar, TextInput, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Plus, Wallet, TrendingDown, Target, PiggyBank, Trash2,
  X, DollarSign, ShoppingBag, Utensils, Car, BookOpen,
  Zap, Heart, Music, MoreHorizontal, Settings, ChevronRight,
} from 'lucide-react-native';
import { useAlert } from '@/hooks/useAlert';
import { useMoneyVault } from '@/hooks/useModules';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Typography, Spacing, Radius, Colors } from '@/constants/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import { AppInput } from '@/components/ui/AppInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { moneyVaultService, ExpenseCategory, PaymentMethod } from '@/services/moneyVaultService';

const CATEGORIES: { key: ExpenseCategory; icon: any; color: string }[] = [
  { key: 'Food', icon: Utensils, color: '#F59E0B' },
  { key: 'Travel', icon: Car, color: '#3B82F6' },
  { key: 'Shopping', icon: ShoppingBag, color: '#EC4899' },
  { key: 'Education', icon: BookOpen, color: '#8B5CF6' },
  { key: 'Bills', icon: Zap, color: '#F97316' },
  { key: 'Health', icon: Heart, color: '#22C55E' },
  { key: 'Entertainment', icon: Music, color: '#06B6D4' },
  { key: 'Other', icon: MoreHorizontal, color: '#64748B' },
];
const PAYMENT_METHODS: PaymentMethod[] = ['Cash', 'UPI', 'Card', 'Net Banking', 'Other'];

export default function MoneyVaultScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { showAlert } = useAlert();
  const { expenses, settings, loading, addExpense, updateExpense, removeExpense, saveSettings } = useMoneyVault();

  const [expenseModal, setExpenseModal] = useState(false);
  const [settingsModal, setSettingsModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Expense form
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Food');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);

  // Settings form
  const [cash, setCash] = useState(String(settings.cash_in_hand));
  const [wallet, setWallet] = useState(String(settings.wallet_balance));
  const [bank, setBank] = useState(String(settings.bank_balance));
  const [savingsGoal, setSavingsGoal] = useState(String(settings.savings_goal));
  const [emergency, setEmergency] = useState(String(settings.emergency_fund));
  const [budget, setBudget] = useState(String(settings.monthly_budget));

  const stats = useMemo(() => moneyVaultService.getStats(expenses, settings.monthly_budget), [expenses, settings.monthly_budget]);
  const budgetPct = settings.monthly_budget > 0 ? Math.min(100, (stats.monthSpend / settings.monthly_budget) * 100) : 0;
  const totalBalance = settings.cash_in_hand + settings.wallet_balance + settings.bank_balance;

  const openSettings = () => {
    setCash(String(settings.cash_in_hand));
    setWallet(String(settings.wallet_balance));
    setBank(String(settings.bank_balance));
    setSavingsGoal(String(settings.savings_goal));
    setEmergency(String(settings.emergency_fund));
    setBudget(String(settings.monthly_budget));
    setSettingsModal(true);
  };

  const openEditExpense = (exp: any) => {
    setEditId(exp.id);
    setAmount(String(exp.amount));
    setCategory(exp.category);
    setDescription(exp.description ?? '');
    setPaymentMethod(exp.payment_method);
    setExpDate(exp.date);
    setExpenseModal(true);
  };

  const resetExpenseForm = () => {
    setEditId(null);
    setAmount(''); setDescription(''); setCategory('Food'); setPaymentMethod('UPI');
    setExpDate(new Date().toISOString().split('T')[0]);
  };

  const handleAddExpense = async () => {
    if (!amount.trim() || isNaN(Number(amount))) {
      showAlert('Required', 'Enter a valid amount.'); return;
    }
    setSaving(true);
    if (editId) {
      await updateExpense(editId, { amount: parseFloat(amount), category, description: description.trim() || undefined, payment_method: paymentMethod, date: expDate });
    } else {
      await addExpense({ amount: parseFloat(amount), category, description: description.trim() || undefined, payment_method: paymentMethod, date: expDate });
    }
    setSaving(false); setExpenseModal(false);
    resetExpenseForm();
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    await saveSettings({
      cash_in_hand: parseFloat(cash) || 0,
      wallet_balance: parseFloat(wallet) || 0,
      bank_balance: parseFloat(bank) || 0,
      savings_goal: parseFloat(savingsGoal) || 0,
      emergency_fund: parseFloat(emergency) || 0,
      monthly_budget: parseFloat(budget) || 0,
    });
    setSaving(false); setSettingsModal(false);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <StatusBar barStyle={colors.text === '#F1F5F9' ? 'light-content' : 'dark-content'} />
      <ScreenHeader
        title="Money Vault"
        subtitle={`₹${totalBalance.toLocaleString()} total`}
        rightAction={
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <Pressable onPress={openSettings} style={[styles.iconBtn, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
              <Settings size={18} color={colors.textMuted} strokeWidth={2} />
            </Pressable>
            <Pressable onPress={() => { resetExpenseForm(); setExpenseModal(true); }} style={[styles.addBtn, { backgroundColor: colors.accent }]}>
              <Plus size={20} color="#fff" strokeWidth={2.5} />
            </Pressable>
          </View>
        }
      />

      <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.base, paddingBottom: insets.bottom + 40, gap: Spacing.md }}>
        {/* Balance Cards */}
        <View style={styles.balanceRow}>
          {[
            { label: 'Cash', value: settings.cash_in_hand, color: Colors.success },
            { label: 'Wallet', value: settings.wallet_balance, color: colors.accent },
            { label: 'Bank', value: settings.bank_balance, color: '#8B5CF6' },
          ].map((b, i) => (
            <GlassCard key={i} style={[styles.balanceCard, { backgroundColor: colors.surface, borderColor: colors.border }]} padding={14}>
              <Text style={[styles.balanceValue, { color: b.color }]}>₹{b.value.toLocaleString()}</Text>
              <Text style={[styles.balanceLabel, { color: colors.textMuted }]}>{b.label}</Text>
            </GlassCard>
          ))}
        </View>

        {/* Spending Overview */}
        <GlassCard style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          <View style={styles.rowBetween}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Monthly Budget</Text>
            <Text style={[styles.budgetPct, { color: budgetPct > 80 ? Colors.error : Colors.success }]}>{budgetPct.toFixed(0)}%</Text>
          </View>
          <ProgressBar progress={budgetPct} color={budgetPct > 80 ? Colors.error : colors.accent} height={6} backgroundColor={colors.surfaceLight} />
          <View style={styles.rowBetween}>
            <Text style={[styles.spendText, { color: colors.textMuted }]}>Spent: ₹{stats.monthSpend.toLocaleString()}</Text>
            <Text style={[styles.spendText, { color: Colors.success }]}>Left: ₹{stats.remaining.toLocaleString()}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.rowBetween}>
            <View>
              <Text style={[styles.todayLabel, { color: colors.textMuted }]}>Today</Text>
              <Text style={[styles.todayValue, { color: Colors.error }]}>₹{stats.todaySpend.toLocaleString()}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.todayLabel, { color: colors.textMuted }]}>Savings Goal</Text>
              <Text style={[styles.todayValue, { color: Colors.success }]}>₹{settings.savings_goal.toLocaleString()}</Text>
            </View>
          </View>
        </GlassCard>

        {/* Category Breakdown */}
        {Object.keys(stats.byCategory).length > 0 && (
          <GlassCard style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: Spacing.md }]}>This Month</Text>
            {CATEGORIES.filter(c => stats.byCategory[c.key] > 0).map(c => {
              const spent = stats.byCategory[c.key] ?? 0;
              const pct = stats.monthSpend > 0 ? (spent / stats.monthSpend) * 100 : 0;
              return (
                <View key={c.key} style={{ marginBottom: Spacing.sm }}>
                  <View style={styles.rowBetween}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                      <View style={[styles.catIcon, { backgroundColor: c.color + '18' }]}>
                        <c.icon size={14} color={c.color} strokeWidth={2} />
                      </View>
                      <Text style={[styles.catLabel, { color: colors.textSecondary }]}>{c.key}</Text>
                    </View>
                    <Text style={[styles.catAmount, { color: colors.text }]}>₹{spent.toLocaleString()}</Text>
                  </View>
                  <ProgressBar progress={pct} color={c.color} height={3} backgroundColor={colors.surfaceLight} />
                </View>
              );
            })}
          </GlassCard>
        )}

        {/* Recent Expenses */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Expenses</Text>
        {loading ? (
          <ActivityIndicator color={colors.accent} />
        ) : expenses.length === 0 ? (
          <GlassCard style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
            <View style={styles.emptyState}>
              <Wallet size={40} color={colors.textDim} strokeWidth={1.5} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>No expenses logged yet</Text>
              <PrimaryButton title="Log First Expense" onPress={() => setExpenseModal(true)} style={{ marginTop: Spacing.sm }} />
            </View>
          </GlassCard>
        ) : expenses.slice(0, 30).map(exp => {
          const cat = CATEGORIES.find(c => c.key === exp.category);
          return (
            <GlassCard key={exp.id} style={[styles.expenseCard, { backgroundColor: colors.surface, borderColor: colors.border }]} padding={0}>
              <View style={styles.expenseRow}>
                <View style={[styles.expCatIcon, { backgroundColor: (cat?.color ?? colors.accent) + '18' }]}>
                  {cat ? <cat.icon size={18} color={cat.color} strokeWidth={2} /> : <DollarSign size={18} color={colors.accent} strokeWidth={2} />}
                </View>
                <Pressable style={{ flex: 1 }} onPress={() => openEditExpense(exp)}>
                  <Text style={[styles.expDesc, { color: colors.text }]}>{exp.description || exp.category}</Text>
                  <Text style={[styles.expMeta, { color: colors.textMuted }]}>{exp.date} · {exp.payment_method}</Text>
                </Pressable>
                <Text style={[styles.expAmount, { color: Colors.error }]}>-₹{exp.amount.toLocaleString()}</Text>
                <Pressable hitSlop={8} onPress={() => Alert.alert('Delete', 'Remove this expense?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => removeExpense(exp.id) },
                ])}>
                  <Trash2 size={14} color={colors.textDim} strokeWidth={2} />
                </Pressable>
              </View>
            </GlassCard>
          );
        })}
      </ScrollView>

      {/* Add Expense Modal */}
      <Modal visible={expenseModal} transparent animationType="slide" onRequestClose={() => setExpenseModal(false)}>
        <KeyboardAvoidingView style={[styles.overlay, { backgroundColor: colors.overlay }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setExpenseModal(false)} />
          <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border, paddingBottom: insets.bottom + 16 }]}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>{editId ? 'Edit Expense' : 'Log Expense'}</Text>
              <Pressable onPress={() => { setExpenseModal(false); resetExpenseForm(); }}><X size={20} color={colors.textMuted} strokeWidth={2} /></Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <AppInput label="Amount (₹) *" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0.00" />
              <AppInput label="Description" value={description} onChangeText={setDescription} placeholder="What did you spend on?" />
              <AppInput label="Date (YYYY-MM-DD)" value={expDate} onChangeText={setExpDate} placeholder="2025-01-01" />
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Category</Text>
              <View style={styles.catGrid}>
                {CATEGORIES.map(c => (
                  <Pressable key={c.key} style={[styles.catChip, { borderColor: category === c.key ? c.color : colors.border, backgroundColor: category === c.key ? c.color + '18' : colors.surfaceLight }]} onPress={() => setCategory(c.key)}>
                    <c.icon size={14} color={category === c.key ? c.color : colors.textMuted} strokeWidth={2} />
                    <Text style={[styles.catChipText, { color: category === c.key ? c.color : colors.textMuted }]}>{c.key}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Payment Method</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.base }}>
                <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                  {PAYMENT_METHODS.map(m => (
                    <Pressable key={m} style={[styles.methodChip, { borderColor: paymentMethod === m ? colors.accent : colors.border, backgroundColor: paymentMethod === m ? colors.accent + '18' : colors.surfaceLight }]} onPress={() => setPaymentMethod(m)}>
                      <Text style={[styles.methodText, { color: paymentMethod === m ? colors.accent : colors.textMuted }]}>{m}</Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
              <PrimaryButton title={editId ? 'Save Changes' : 'Log Expense'} onPress={handleAddExpense} loading={saving} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Settings Modal */}
      <Modal visible={settingsModal} transparent animationType="slide" onRequestClose={() => setSettingsModal(false)}>
        <KeyboardAvoidingView style={[styles.overlay, { backgroundColor: colors.overlay }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSettingsModal(false)} />
          <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border, paddingBottom: insets.bottom + 16 }]}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>Vault Settings</Text>
              <Pressable onPress={() => setSettingsModal(false)}><X size={20} color={colors.textMuted} strokeWidth={2} /></Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <AppInput label="Cash in Hand (₹)" value={cash} onChangeText={setCash} keyboardType="decimal-pad" placeholder="0" />
              <AppInput label="Wallet Balance (₹)" value={wallet} onChangeText={setWallet} keyboardType="decimal-pad" placeholder="0" />
              <AppInput label="Bank Balance (₹)" value={bank} onChangeText={setBank} keyboardType="decimal-pad" placeholder="0" />
              <AppInput label="Monthly Budget (₹)" value={budget} onChangeText={setBudget} keyboardType="decimal-pad" placeholder="10000" />
              <AppInput label="Savings Goal (₹)" value={savingsGoal} onChangeText={setSavingsGoal} keyboardType="decimal-pad" placeholder="50000" />
              <AppInput label="Emergency Fund (₹)" value={emergency} onChangeText={setEmergency} keyboardType="decimal-pad" placeholder="20000" />
              <PrimaryButton title="Save Settings" onPress={handleSaveSettings} loading={saving} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  iconBtn: { width: 38, height: 38, borderRadius: Radius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  addBtn: { width: 38, height: 38, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  balanceRow: { flexDirection: 'row', gap: Spacing.sm },
  balanceCard: { flex: 1, alignItems: 'center', gap: 3 },
  balanceValue: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold },
  balanceLabel: { fontSize: Typography.sizes.xs },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold },
  budgetPct: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold },
  spendText: { fontSize: Typography.sizes.xs, marginTop: 4 },
  divider: { height: 1, marginVertical: Spacing.sm },
  todayLabel: { fontSize: Typography.sizes.xs },
  todayValue: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold },
  catIcon: { width: 28, height: 28, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  catLabel: { fontSize: Typography.sizes.sm },
  catAmount: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold },
  emptyState: { alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.xl },
  emptyText: { fontSize: Typography.sizes.base },
  expenseCard: { marginBottom: Spacing.xs, overflow: 'hidden' },
  expenseRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.base },
  expCatIcon: { width: 38, height: 38, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  expDesc: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.medium },
  expMeta: { fontSize: Typography.sizes.xs, marginTop: 2 },
  expAmount: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, borderWidth: 1, padding: Spacing.xl, maxHeight: '92%' },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.base },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  sheetTitle: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold },
  fieldLabel: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, marginBottom: Spacing.sm },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.base },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.md, paddingVertical: 7, borderRadius: Radius.full, borderWidth: 1 },
  catChipText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.semibold },
  methodChip: { paddingHorizontal: Spacing.md, paddingVertical: 7, borderRadius: Radius.full, borderWidth: 1 },
  methodText: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold },
});
