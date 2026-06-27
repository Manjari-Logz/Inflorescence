import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Modal,
  KeyboardAvoidingView, Platform, StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Target, Telescope, Star, Plus, Trash2, CheckSquare,
  Square, CheckCircle2, Circle, X, ChevronRight, Menu,
} from 'lucide-react-native';
import { useAlert } from '@/hooks/useAlert';
import { useGoals } from '@/hooks/useGoals';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useDrawer } from '@/contexts/DrawerContext';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { AppInput } from '@/components/ui/AppInput';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ChecklistItem, Milestone } from '@/services/goalsService';

const TABS = [
  { label: 'Short Term', icon: Target },
  { label: 'Long Term', icon: Telescope },
  { label: 'Dreams', icon: Star },
];
const DREAM_CATEGORIES = ['Life', 'Career', 'Travel', 'Business', 'Health', 'Education', 'Creative', 'Other'];

function genId() { return Math.random().toString(36).slice(2); }

export default function GoalsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { openDrawer } = useDrawer();
  const { shortGoals, longGoals, dreams, loading, addShortGoal, updateShortGoal, deleteShortGoal, addLongGoal, updateLongGoal, deleteLongGoal, addDream, deleteDream } = useGoals();
  const { showAlert } = useAlert();
  const [activeTab, setActiveTab] = useState(0);
  const [modal, setModal] = useState<'short' | 'long' | 'dream' | null>(null);
  const [saving, setSaving] = useState(false);

  const [sgTitle, setSgTitle] = useState('');
  const [sgDue, setSgDue] = useState('');
  const [sgChecklist, setSgChecklist] = useState<ChecklistItem[]>([]);
  const [sgCheckInput, setSgCheckInput] = useState('');

  const [lgVision, setLgVision] = useState('');
  const [lgTimeline, setLgTimeline] = useState('');
  const [lgMilestones, setLgMilestones] = useState<Milestone[]>([]);
  const [lgMsInput, setLgMsInput] = useState('');

  const [dTitle, setDTitle] = useState('');
  const [dCategory, setDCategory] = useState('Life');
  const [dNotes, setDNotes] = useState('');
  const [dYear, setDYear] = useState('');

  const resetForms = () => {
    setSgTitle(''); setSgDue(''); setSgChecklist([]); setSgCheckInput('');
    setLgVision(''); setLgTimeline(''); setLgMilestones([]); setLgMsInput('');
    setDTitle(''); setDCategory('Life'); setDNotes(''); setDYear('');
  };

  const handleAddShortGoal = async () => {
    if (!sgTitle.trim()) { showAlert('Required', 'Enter a goal title.'); return; }
    setSaving(true);
    await addShortGoal({ title: sgTitle.trim(), due_date: sgDue.trim() || undefined, progress: 0, checklist: sgChecklist, completed: false });
    setSaving(false); setModal(null); resetForms();
  };

  const handleAddLongGoal = async () => {
    if (!lgVision.trim()) { showAlert('Required', 'Enter your vision.'); return; }
    setSaving(true);
    await addLongGoal({ vision: lgVision.trim(), milestones: lgMilestones, timeline: lgTimeline.trim() || undefined, progress: 0 });
    setSaving(false); setModal(null); resetForms();
  };

  const handleAddDream = async () => {
    if (!dTitle.trim()) { showAlert('Required', 'Enter your dream.'); return; }
    setSaving(true);
    await addDream({ title: dTitle.trim(), category: dCategory, notes: dNotes.trim() || undefined, target_year: dYear ? parseInt(dYear) : undefined });
    setSaving(false); setModal(null); resetForms();
  };

  const toggleChecklistItem = async (goalId: string, items: ChecklistItem[], itemId: string) => {
    const updated = items.map(i => i.id === itemId ? { ...i, done: !i.done } : i);
    const doneCount = updated.filter(i => i.done).length;
    const progress = items.length > 0 ? Math.round((doneCount / items.length) * 100) : 0;
    await updateShortGoal(goalId, { checklist: updated, progress, completed: progress === 100 });
  };

  const toggleMilestone = async (goalId: string, milestones: Milestone[], msId: string) => {
    const updated = milestones.map(m => m.id === msId ? { ...m, done: !m.done } : m);
    const progress = milestones.length > 0 ? Math.round((updated.filter(m => m.done).length / milestones.length) * 100) : 0;
    await updateLongGoal(goalId, { milestones: updated, progress });
  };

  const modalType = activeTab === 0 ? 'short' : activeTab === 1 ? 'long' : 'dream';

  return (
    <View style={[styles.root, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.text === '#F1F5F9' ? 'light-content' : 'dark-content'} />

      <View style={styles.header}>
        <Pressable
          style={[styles.menuBtn, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}
          onPress={openDrawer}
        >
          <Menu size={18} color={colors.textMuted} strokeWidth={2} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>Goals & Dreams</Text>
        <Pressable style={[styles.addBtn, { backgroundColor: colors.accent }]} onPress={() => { resetForms(); setModal(modalType); }}>
          <Plus size={22} color="#fff" strokeWidth={2.5} />
        </Pressable>
      </View>

      {/* Tabs */}
      <View style={[styles.tabRow, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
        {TABS.map((t, i) => (
          <Pressable key={t.label} style={[styles.tab, activeTab === i && { backgroundColor: colors.surface, borderColor: colors.accent }]} onPress={() => setActiveTab(i)}>
            <t.icon size={14} color={activeTab === i ? colors.accent : colors.textMuted} strokeWidth={2} />
            <Text style={[styles.tabText, { color: activeTab === i ? colors.accent : colors.textMuted }]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.accent} size="large" /></View>
      ) : (
        <ScrollView contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]} showsVerticalScrollIndicator={false}>
          {/* SHORT GOALS */}
          {activeTab === 0 && (
            shortGoals.length === 0 ? (
              <View style={styles.empty}>
                <Target size={52} color={colors.textDim} strokeWidth={1.5} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>Set Short-Term Goals</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>Break your goals into actionable checklists</Text>
              </View>
            ) : shortGoals.map(g => (
              <GlassCard key={g.id} style={[styles.goalCard, { backgroundColor: colors.surface, borderColor: g.completed ? Colors.success : colors.border }]}>
                <View style={styles.goalHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.goalTitle, { color: colors.text }, g.completed && styles.strikethrough]} numberOfLines={2}>{g.title}</Text>
                    {g.due_date && <Text style={[styles.goalMeta, { color: Colors.warning }]}>Due {g.due_date}</Text>}
                  </View>
                  <Pressable hitSlop={8} onPress={() => Alert.alert('Delete Goal', `Delete "${g.title}"?`, [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => deleteShortGoal(g.id) },
                  ])}>
                    <Trash2 size={16} color={colors.textDim} strokeWidth={2} />
                  </Pressable>
                </View>
                <View style={styles.progressRow}>
                  <ProgressBar progress={g.progress} color={g.completed ? Colors.success : colors.accent} height={5} backgroundColor={colors.surfaceLight} />
                  <Text style={[styles.progressLabel, { color: colors.textMuted }]}>{g.progress}%</Text>
                </View>
                {(g.checklist ?? []).map(item => (
                  <Pressable key={item.id} style={styles.checkRow} onPress={() => toggleChecklistItem(g.id, g.checklist, item.id)}>
                    {item.done ? <CheckSquare size={18} color={Colors.success} strokeWidth={2} /> : <Square size={18} color={colors.textMuted} strokeWidth={2} />}
                    <Text style={[styles.checkText, { color: item.done ? colors.textMuted : colors.textSecondary }, item.done && styles.strikethrough]}>{item.text}</Text>
                  </Pressable>
                ))}
              </GlassCard>
            ))
          )}

          {/* LONG GOALS */}
          {activeTab === 1 && (
            longGoals.length === 0 ? (
              <View style={styles.empty}>
                <Telescope size={52} color={colors.textDim} strokeWidth={1.5} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>Define Long-Term Goals</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>Set your vision with milestones and timeline</Text>
              </View>
            ) : longGoals.map(g => (
              <GlassCard key={g.id} style={[styles.goalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.goalHeader}>
                  <Text style={[styles.goalTitle, { color: colors.text, flex: 1 }]} numberOfLines={3}>{g.vision}</Text>
                  <Pressable hitSlop={8} onPress={() => Alert.alert('Delete', 'Delete this long-term goal?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => deleteLongGoal(g.id) },
                  ])}>
                    <Trash2 size={16} color={colors.textDim} strokeWidth={2} />
                  </Pressable>
                </View>
                {g.timeline && <Text style={[styles.goalMeta, { color: colors.textMuted }]}>{g.timeline}</Text>}
                <View style={styles.progressRow}>
                  <ProgressBar progress={g.progress} color={colors.primaryLight} height={5} backgroundColor={colors.surfaceLight} />
                  <Text style={[styles.progressLabel, { color: colors.textMuted }]}>{g.progress}%</Text>
                </View>
                {(g.milestones ?? []).map(m => (
                  <Pressable key={m.id} style={styles.checkRow} onPress={() => toggleMilestone(g.id, g.milestones, m.id)}>
                    {m.done ? <CheckCircle2 size={18} color={Colors.success} strokeWidth={2} /> : <Circle size={18} color={colors.textMuted} strokeWidth={2} />}
                    <Text style={[styles.checkText, { color: m.done ? colors.textMuted : colors.textSecondary }, m.done && styles.strikethrough]}>{m.text}</Text>
                  </Pressable>
                ))}
              </GlassCard>
            ))
          )}

          {/* DREAMS */}
          {activeTab === 2 && (
            dreams.length === 0 ? (
              <View style={styles.empty}>
                <Star size={52} color={colors.textDim} strokeWidth={1.5} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>Capture Your Dreams</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>Store your life, career, and travel dreams</Text>
              </View>
            ) : dreams.map(d => (
              <GlassCard key={d.id} style={[styles.dreamCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.dreamHeader}>
                  <View style={[styles.categoryBadge, { backgroundColor: colors.accent + '18', borderColor: colors.accent + '40' }]}>
                    <Text style={[styles.categoryText, { color: colors.accent }]}>{d.category}</Text>
                  </View>
                  <Pressable hitSlop={8} onPress={() => deleteDream(d.id)}>
                    <X size={16} color={colors.textDim} strokeWidth={2} />
                  </Pressable>
                </View>
                <Text style={[styles.dreamTitle, { color: colors.text }]}>{d.title}</Text>
                {d.notes && <Text style={[styles.dreamNotes, { color: colors.textMuted }]} numberOfLines={2}>{d.notes}</Text>}
                {d.target_year && <Text style={[styles.dreamYear, { color: colors.accent }]}>{d.target_year}</Text>}
              </GlassCard>
            ))
          )}
        </ScrollView>
      )}

      {/* Short Goal Modal */}
      <Modal visible={modal === 'short'} transparent animationType="slide" onRequestClose={() => setModal(null)}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setModal(null)} />
          <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border, paddingBottom: insets.bottom + 16 }]}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>New Short-Term Goal</Text>
              <Pressable onPress={() => setModal(null)}><X size={20} color={colors.textMuted} strokeWidth={2} /></Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <AppInput label="Goal Title *" placeholder="What do you want to achieve?" value={sgTitle} onChangeText={setSgTitle} />
              <AppInput label="Due Date (YYYY-MM-DD)" placeholder="2025-12-31" value={sgDue} onChangeText={setSgDue} />
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Checklist Items</Text>
              <View style={styles.checklistInput}>
                <View style={{ flex: 1 }}>
                  <AppInput placeholder="Add checklist item..." value={sgCheckInput} onChangeText={setSgCheckInput} />
                </View>
                <Pressable style={[styles.addCheckBtn, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]} onPress={() => {
                  if (sgCheckInput.trim()) { setSgChecklist(prev => [...prev, { id: genId(), text: sgCheckInput.trim(), done: false }]); setSgCheckInput(''); }
                }}>
                  <Plus size={18} color={colors.accent} strokeWidth={2.5} />
                </Pressable>
              </View>
              {sgChecklist.map(item => (
                <View key={item.id} style={styles.previewRow}>
                  <Square size={14} color={colors.textMuted} strokeWidth={2} />
                  <Text style={[styles.previewText, { color: colors.textSecondary }]}>{item.text}</Text>
                  <Pressable hitSlop={8} onPress={() => setSgChecklist(prev => prev.filter(i => i.id !== item.id))}>
                    <X size={14} color={colors.textDim} strokeWidth={2} />
                  </Pressable>
                </View>
              ))}
              <PrimaryButton title="Create Goal" onPress={handleAddShortGoal} loading={saving} style={{ marginTop: Spacing.md }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Long Goal Modal */}
      <Modal visible={modal === 'long'} transparent animationType="slide" onRequestClose={() => setModal(null)}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setModal(null)} />
          <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border, paddingBottom: insets.bottom + 16 }]}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>New Long-Term Goal</Text>
              <Pressable onPress={() => setModal(null)}><X size={20} color={colors.textMuted} strokeWidth={2} /></Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <AppInput label="Vision *" placeholder="Describe your big goal..." value={lgVision} onChangeText={setLgVision} multiline numberOfLines={3} />
              <AppInput label="Timeline" placeholder="e.g. 2 years, By 2027" value={lgTimeline} onChangeText={setLgTimeline} />
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Milestones</Text>
              <View style={styles.checklistInput}>
                <View style={{ flex: 1 }}>
                  <AppInput placeholder="Add milestone..." value={lgMsInput} onChangeText={setLgMsInput} />
                </View>
                <Pressable style={[styles.addCheckBtn, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]} onPress={() => {
                  if (lgMsInput.trim()) { setLgMilestones(prev => [...prev, { id: genId(), text: lgMsInput.trim(), done: false }]); setLgMsInput(''); }
                }}>
                  <Plus size={18} color={colors.accent} strokeWidth={2.5} />
                </Pressable>
              </View>
              {lgMilestones.map(m => (
                <View key={m.id} style={styles.previewRow}>
                  <Circle size={14} color={colors.textMuted} strokeWidth={2} />
                  <Text style={[styles.previewText, { color: colors.textSecondary }]}>{m.text}</Text>
                  <Pressable hitSlop={8} onPress={() => setLgMilestones(prev => prev.filter(i => i.id !== m.id))}>
                    <X size={14} color={colors.textDim} strokeWidth={2} />
                  </Pressable>
                </View>
              ))}
              <PrimaryButton title="Create Goal" onPress={handleAddLongGoal} loading={saving} style={{ marginTop: Spacing.md }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Dream Modal */}
      <Modal visible={modal === 'dream'} transparent animationType="slide" onRequestClose={() => setModal(null)}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setModal(null)} />
          <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border, paddingBottom: insets.bottom + 16 }]}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>Add a Dream</Text>
              <Pressable onPress={() => setModal(null)}><X size={20} color={colors.textMuted} strokeWidth={2} /></Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <AppInput label="Dream *" placeholder="Describe your dream..." value={dTitle} onChangeText={setDTitle} />
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.base }}>
                <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                  {DREAM_CATEGORIES.map(c => (
                    <Pressable key={c} style={[styles.selectChip, { borderColor: colors.border, backgroundColor: colors.surfaceLight }, dCategory === c && { borderColor: colors.accent, backgroundColor: colors.accent + '18' }]} onPress={() => setDCategory(c)}>
                      <Text style={[styles.selectChipText, { color: dCategory === c ? colors.accent : colors.textMuted }]}>{c}</Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
              <AppInput label="Notes" placeholder="Why is this your dream?" value={dNotes} onChangeText={setDNotes} multiline numberOfLines={3} />
              <AppInput label="Target Year" placeholder="2028" value={dYear} onChangeText={setDYear} keyboardType="numeric" />
              <PrimaryButton title="Add Dream" onPress={handleAddDream} loading={saving} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.base, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  menuBtn: { width: 40, height: 40, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginRight: Spacing.sm },
  title: { fontSize: Typography.sizes.xxl, fontWeight: Typography.weights.bold },
  addBtn: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  tabRow: { flexDirection: 'row', marginHorizontal: Spacing.base, marginBottom: Spacing.base, borderRadius: Radius.lg, borderWidth: 1, padding: 4, gap: 4 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: Spacing.sm, borderRadius: Radius.md, borderWidth: 1, borderColor: 'transparent' },
  tabText: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: Spacing.xxxl, gap: Spacing.md },
  emptyTitle: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, textAlign: 'center' },
  emptySubtitle: { fontSize: Typography.sizes.base, textAlign: 'center' },
  list: { paddingHorizontal: Spacing.base, paddingTop: Spacing.sm },
  goalCard: { marginBottom: Spacing.md, gap: Spacing.sm },
  goalHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  goalTitle: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.semibold },
  strikethrough: { textDecorationLine: 'line-through' },
  goalMeta: { fontSize: Typography.sizes.xs, marginTop: 2 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  progressLabel: { fontSize: Typography.sizes.xs, width: 32, textAlign: 'right' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 5 },
  checkText: { flex: 1, fontSize: Typography.sizes.sm },
  dreamCard: { marginBottom: Spacing.md, gap: Spacing.sm },
  dreamHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full, borderWidth: 1 },
  categoryText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.semibold },
  dreamTitle: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.semibold },
  dreamNotes: { fontSize: Typography.sizes.sm },
  dreamYear: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.65)' },
  sheet: { borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, borderWidth: 1, padding: Spacing.xl, maxHeight: '90%' },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.base },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  sheetTitle: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold },
  fieldLabel: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, marginBottom: Spacing.sm },
  checklistInput: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  addCheckBtn: { width: 48, height: 48, borderRadius: Radius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 5 },
  previewText: { flex: 1, fontSize: Typography.sizes.sm },
  selectChip: { paddingHorizontal: Spacing.md, paddingVertical: 7, borderRadius: Radius.full, borderWidth: 1 },
  selectChipText: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold },
});
