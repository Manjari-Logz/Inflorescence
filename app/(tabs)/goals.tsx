import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Modal,
  KeyboardAvoidingView, Platform, StatusBar, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAlert } from '@/template';
import { useGoals } from '@/hooks/useGoals';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { AppInput } from '@/components/ui/AppInput';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ChecklistItem, Milestone } from '@/services/goalsService';

const TABS = ['Short Goals', 'Long Goals', 'Dreams'];
const DREAM_CATEGORIES = ['Life', 'Career', 'Travel', 'Business', 'Health', 'Education', 'Creative', 'Other'];

function genId() { return Math.random().toString(36).slice(2); }

export default function GoalsScreen() {
  const insets = useSafeAreaInsets();
  const { shortGoals, longGoals, dreams, loading, addShortGoal, updateShortGoal, deleteShortGoal, addLongGoal, updateLongGoal, deleteLongGoal, addDream, deleteDream } = useGoals();
  const { showAlert } = useAlert();
  const [activeTab, setActiveTab] = useState(0);
  const [modal, setModal] = useState<'short' | 'long' | 'dream' | null>(null);
  const [saving, setSaving] = useState(false);

  // Short goal form
  const [sgTitle, setSgTitle] = useState('');
  const [sgDue, setSgDue] = useState('');
  const [sgChecklist, setSgChecklist] = useState<ChecklistItem[]>([]);
  const [sgCheckInput, setSgCheckInput] = useState('');

  // Long goal form
  const [lgVision, setLgVision] = useState('');
  const [lgTimeline, setLgTimeline] = useState('');
  const [lgResources, setLgResources] = useState('');
  const [lgNotes, setLgNotes] = useState('');
  const [lgMilestones, setLgMilestones] = useState<Milestone[]>([]);
  const [lgMsInput, setLgMsInput] = useState('');

  // Dream form
  const [dTitle, setDTitle] = useState('');
  const [dCategory, setDCategory] = useState('Life');
  const [dNotes, setDNotes] = useState('');
  const [dYear, setDYear] = useState('');

  const resetForms = () => {
    setSgTitle(''); setSgDue(''); setSgChecklist([]); setSgCheckInput('');
    setLgVision(''); setLgTimeline(''); setLgResources(''); setLgNotes(''); setLgMilestones([]); setLgMsInput('');
    setDTitle(''); setDCategory('Life'); setDNotes(''); setDYear('');
  };

  const handleAddShortGoal = async () => {
    if (!sgTitle.trim()) { showAlert('Required', 'Enter a goal title.'); return; }
    setSaving(true);
    await addShortGoal({ title: sgTitle.trim(), due_date: sgDue.trim() || undefined, progress: 0, checklist: sgChecklist, completed: false, user_id: '' });
    setSaving(false); setModal(null); resetForms();
  };

  const handleAddLongGoal = async () => {
    if (!lgVision.trim()) { showAlert('Required', 'Enter your vision.'); return; }
    setSaving(true);
    await addLongGoal({ vision: lgVision.trim(), milestones: lgMilestones, timeline: lgTimeline.trim() || undefined, resources: lgResources.trim() || undefined, notes: lgNotes.trim() || undefined, progress: 0, user_id: '' });
    setSaving(false); setModal(null); resetForms();
  };

  const handleAddDream = async () => {
    if (!dTitle.trim()) { showAlert('Required', 'Enter your dream.'); return; }
    setSaving(true);
    await addDream({ title: dTitle.trim(), category: dCategory, notes: dNotes.trim() || undefined, target_year: dYear ? parseInt(dYear) : undefined, user_id: '' });
    setSaving(false); setModal(null); resetForms();
  };

  const toggleChecklistItem = async (goalId: string, items: ChecklistItem[], itemId: string) => {
    const updated = items.map(i => i.id === itemId ? { ...i, done: !i.done } : i);
    const doneCount = updated.filter(i => i.done).length;
    const progress = items.length > 0 ? Math.round((doneCount / items.length) * 100) : 0;
    const completed = progress === 100;
    await updateShortGoal(goalId, { checklist: updated, progress, completed });
  };

  const toggleMilestone = async (goalId: string, milestones: Milestone[], msId: string) => {
    const updated = milestones.map(m => m.id === msId ? { ...m, done: !m.done } : m);
    const progress = milestones.length > 0 ? Math.round((updated.filter(m => m.done).length / milestones.length) * 100) : 0;
    await updateLongGoal(goalId, { milestones: updated, progress });
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Goals & Dreams</Text>
        <Pressable style={styles.addBtn} onPress={() => { resetForms(); setModal(activeTab === 0 ? 'short' : activeTab === 1 ? 'long' : 'dream'); }}>
          <MaterialIcons name="add" size={26} color="#fff" />
        </Pressable>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {TABS.map((t, i) => (
          <Pressable key={t} style={[styles.tab, activeTab === i && styles.tabActive]} onPress={() => setActiveTab(i)}>
            <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>{t}</Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.accent} size="large" /></View>
      ) : (
        <ScrollView contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]} showsVerticalScrollIndicator={false}>
          {/* SHORT GOALS */}
          {activeTab === 0 && (
            shortGoals.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>🎯</Text>
                <Text style={styles.emptyTitle}>Set Short-Term Goals</Text>
                <Text style={styles.emptySubtitle}>Break your goals into actionable checklists</Text>
              </View>
            ) : shortGoals.map(g => (
              <GlassCard key={g.id} style={[styles.goalCard, g.completed && styles.doneCard]}>
                <View style={styles.goalHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.goalTitle, g.completed && styles.strikethrough]}>{g.title}</Text>
                    {g.due_date ? <Text style={styles.goalDue}>Due: {g.due_date}</Text> : null}
                  </View>
                  <Pressable hitSlop={8} onPress={() => showAlert('Delete Goal', `Delete "${g.title}"?`, [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => deleteShortGoal(g.id) },
                  ])}>
                    <MaterialIcons name="delete-outline" size={18} color={Colors.textDim} />
                  </Pressable>
                </View>
                <View style={styles.progressRow}>
                  <ProgressBar progress={g.progress} color={g.completed ? Colors.success : Colors.accent} height={6} />
                  <Text style={styles.progressLabel}>{g.progress}%</Text>
                </View>
                {(g.checklist ?? []).map(item => (
                  <Pressable key={item.id} style={styles.checkRow} onPress={() => toggleChecklistItem(g.id, g.checklist, item.id)}>
                    <MaterialIcons name={item.done ? 'check-box' : 'check-box-outline-blank'} size={20} color={item.done ? Colors.success : Colors.textMuted} />
                    <Text style={[styles.checkText, item.done && styles.checkDone]}>{item.text}</Text>
                  </Pressable>
                ))}
              </GlassCard>
            ))
          )}

          {/* LONG GOALS */}
          {activeTab === 1 && (
            longGoals.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>🌄</Text>
                <Text style={styles.emptyTitle}>Define Long-Term Goals</Text>
                <Text style={styles.emptySubtitle}>Set your vision with milestones and timeline</Text>
              </View>
            ) : longGoals.map(g => (
              <GlassCard key={g.id} style={styles.goalCard}>
                <View style={styles.goalHeader}>
                  <Text style={styles.goalTitle} numberOfLines={2}>{g.vision}</Text>
                  <Pressable hitSlop={8} onPress={() => showAlert('Delete Goal', 'Delete this long-term goal?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => deleteLongGoal(g.id) },
                  ])}>
                    <MaterialIcons name="delete-outline" size={18} color={Colors.textDim} />
                  </Pressable>
                </View>
                {g.timeline ? <Text style={styles.goalMeta}>⏱ {g.timeline}</Text> : null}
                <View style={styles.progressRow}>
                  <ProgressBar progress={g.progress} color={Colors.primaryLight} height={6} />
                  <Text style={styles.progressLabel}>{g.progress}%</Text>
                </View>
                {(g.milestones ?? []).length > 0 ? (
                  <View style={styles.milestonesSection}>
                    <Text style={styles.milestonesLabel}>Milestones</Text>
                    {g.milestones.map(m => (
                      <Pressable key={m.id} style={styles.checkRow} onPress={() => toggleMilestone(g.id, g.milestones, m.id)}>
                        <MaterialIcons name={m.done ? 'check-circle' : 'radio-button-unchecked'} size={18} color={m.done ? Colors.success : Colors.textMuted} />
                        <Text style={[styles.checkText, m.done && styles.checkDone]}>{m.text}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
                {g.notes ? <Text style={styles.goalNotes}>{g.notes}</Text> : null}
              </GlassCard>
            ))
          )}

          {/* DREAMS */}
          {activeTab === 2 && (
            dreams.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>✨</Text>
                <Text style={styles.emptyTitle}>Capture Your Dreams</Text>
                <Text style={styles.emptySubtitle}>Store your life, career and travel dreams here</Text>
              </View>
            ) : (
              <View style={styles.dreamGrid}>
                {dreams.map(d => (
                  <GlassCard key={d.id} style={styles.dreamCard} glow>
                    <View style={styles.dreamHeader}>
                      <View style={styles.dreamCategoryBadge}>
                        <Text style={styles.dreamCategory}>{d.category}</Text>
                      </View>
                      <Pressable hitSlop={8} onPress={() => deleteDream(d.id)}>
                        <MaterialIcons name="close" size={16} color={Colors.textDim} />
                      </Pressable>
                    </View>
                    <Text style={styles.dreamTitle}>{d.title}</Text>
                    {d.notes ? <Text style={styles.dreamNotes} numberOfLines={2}>{d.notes}</Text> : null}
                    {d.target_year ? <Text style={styles.dreamYear}>🎯 {d.target_year}</Text> : null}
                  </GlassCard>
                ))}
              </View>
            )
          )}
        </ScrollView>
      )}

      {/* Short Goal Modal */}
      <Modal visible={modal === 'short'} transparent animationType="slide" onRequestClose={() => setModal(null)}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setModal(null)} />
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>New Short-Term Goal</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <AppInput label="Goal Title *" placeholder="What do you want to achieve?" value={sgTitle} onChangeText={setSgTitle} />
              <AppInput label="Due Date (YYYY-MM-DD)" placeholder="2025-12-31" value={sgDue} onChangeText={setSgDue} />
              <Text style={styles.fieldLabel}>Checklist Items</Text>
              <View style={styles.checklistInput}>
                <AppInput placeholder="Add checklist item..." value={sgCheckInput} onChangeText={setSgCheckInput} style={{ flex: 1 }} />
                <Pressable style={styles.addCheckBtn} onPress={() => {
                  if (sgCheckInput.trim()) {
                    setSgChecklist(prev => [...prev, { id: genId(), text: sgCheckInput.trim(), done: false }]);
                    setSgCheckInput('');
                  }
                }}>
                  <MaterialIcons name="add" size={20} color={Colors.accent} />
                </Pressable>
              </View>
              {sgChecklist.map((item, idx) => (
                <View key={item.id} style={styles.checkPreviewRow}>
                  <MaterialIcons name="check-box-outline-blank" size={16} color={Colors.textMuted} />
                  <Text style={styles.checkPreviewText}>{item.text}</Text>
                  <Pressable hitSlop={8} onPress={() => setSgChecklist(prev => prev.filter(i => i.id !== item.id))}>
                    <MaterialIcons name="close" size={14} color={Colors.textDim} />
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
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>New Long-Term Goal</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <AppInput label="Vision *" placeholder="Describe your big goal..." value={lgVision} onChangeText={setLgVision} multiline numberOfLines={3} />
              <AppInput label="Timeline" placeholder="e.g. 2 years, By 2027" value={lgTimeline} onChangeText={setLgTimeline} />
              <AppInput label="Resources Needed" placeholder="Skills, tools, mentors..." value={lgResources} onChangeText={setLgResources} />
              <AppInput label="Notes" placeholder="Additional thoughts..." value={lgNotes} onChangeText={setLgNotes} multiline numberOfLines={2} />
              <Text style={styles.fieldLabel}>Milestones</Text>
              <View style={styles.checklistInput}>
                <AppInput placeholder="Add milestone..." value={lgMsInput} onChangeText={setLgMsInput} style={{ flex: 1 }} />
                <Pressable style={styles.addCheckBtn} onPress={() => {
                  if (lgMsInput.trim()) {
                    setLgMilestones(prev => [...prev, { id: genId(), text: lgMsInput.trim(), done: false }]);
                    setLgMsInput('');
                  }
                }}>
                  <MaterialIcons name="add" size={20} color={Colors.accent} />
                </Pressable>
              </View>
              {lgMilestones.map(m => (
                <View key={m.id} style={styles.checkPreviewRow}>
                  <MaterialIcons name="radio-button-unchecked" size={16} color={Colors.textMuted} />
                  <Text style={styles.checkPreviewText}>{m.text}</Text>
                  <Pressable hitSlop={8} onPress={() => setLgMilestones(prev => prev.filter(i => i.id !== m.id))}>
                    <MaterialIcons name="close" size={14} color={Colors.textDim} />
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
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Add a Dream ✨</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <AppInput label="Dream *" placeholder="Describe your dream..." value={dTitle} onChangeText={setDTitle} />
              <Text style={styles.fieldLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.base }}>
                <View style={styles.catRow}>
                  {DREAM_CATEGORIES.map(c => (
                    <Pressable key={c} style={[styles.catChip, dCategory === c && styles.catChipActive]} onPress={() => setDCategory(c)}>
                      <Text style={[styles.catChipText, dCategory === c && styles.catChipActiveText]}>{c}</Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
              <AppInput label="Notes" placeholder="Why is this your dream?" value={dNotes} onChangeText={setDNotes} multiline numberOfLines={3} />
              <AppInput label="Target Year" placeholder="e.g. 2028" value={dYear} onChangeText={setDYear} keyboardType="numeric" />
              <PrimaryButton title="Add Dream" onPress={handleAddDream} loading={saving} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md },
  screenTitle: { color: Colors.text, fontFamily: 'Arial', fontSize: Typography.sizes.xxl, fontWeight: '700' },
  addBtn: { width: 46, height: 46, borderRadius: 23, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
  tabRow: { flexDirection: 'row', paddingHorizontal: Spacing.base, gap: Spacing.sm, marginBottom: Spacing.sm },
  tab: { flex: 1, paddingVertical: Spacing.sm, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', backgroundColor: Colors.surfaceLight },
  tabActive: { borderColor: Colors.accent, backgroundColor: 'rgba(41,182,246,0.12)' },
  tabText: { color: Colors.textMuted, fontFamily: 'Arial', fontSize: Typography.sizes.sm, fontWeight: '600' },
  tabTextActive: { color: Colors.accent },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xxl, paddingTop: Spacing.xxxl },
  emptyEmoji: { fontSize: 64, marginBottom: Spacing.base },
  emptyTitle: { color: Colors.text, fontFamily: 'Arial', fontSize: Typography.sizes.xl, fontWeight: '700', textAlign: 'center', marginBottom: Spacing.sm },
  emptySubtitle: { color: Colors.textMuted, fontFamily: 'Arial', fontSize: Typography.sizes.base, textAlign: 'center' },
  list: { paddingHorizontal: Spacing.base, paddingTop: Spacing.sm },
  goalCard: { marginBottom: Spacing.md, gap: Spacing.sm },
  doneCard: { opacity: 0.7, borderColor: Colors.success },
  goalHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  goalTitle: { flex: 1, color: Colors.text, fontFamily: 'Arial', fontSize: Typography.sizes.lg, fontWeight: '700' },
  strikethrough: { textDecorationLine: 'line-through', color: Colors.textMuted },
  goalDue: { color: Colors.warning, fontFamily: 'Arial', fontSize: Typography.sizes.sm, marginTop: 2 },
  goalMeta: { color: Colors.textMuted, fontFamily: 'Arial', fontSize: Typography.sizes.sm },
  goalNotes: { color: Colors.textMuted, fontFamily: 'Arial', fontSize: Typography.sizes.sm, fontStyle: 'italic' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  progressLabel: { color: Colors.textMuted, fontFamily: 'Arial', fontSize: Typography.sizes.xs, width: 32, textAlign: 'right' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xs },
  checkText: { flex: 1, color: Colors.textSecondary, fontFamily: 'Arial', fontSize: Typography.sizes.base },
  checkDone: { textDecorationLine: 'line-through', color: Colors.textMuted },
  milestonesSection: { gap: Spacing.xs, marginTop: Spacing.xs },
  milestonesLabel: { color: Colors.textMuted, fontFamily: 'Arial', fontSize: Typography.sizes.sm, fontWeight: '600' },
  dreamGrid: { gap: Spacing.md },
  dreamCard: { gap: Spacing.sm },
  dreamHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dreamCategoryBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full, backgroundColor: 'rgba(41,182,246,0.12)', borderWidth: 1, borderColor: Colors.border },
  dreamCategory: { color: Colors.accent, fontFamily: 'Arial', fontSize: Typography.sizes.xs, fontWeight: '600' },
  dreamTitle: { color: Colors.text, fontFamily: 'Arial', fontSize: Typography.sizes.lg, fontWeight: '700' },
  dreamNotes: { color: Colors.textMuted, fontFamily: 'Arial', fontSize: Typography.sizes.sm },
  dreamYear: { color: Colors.primaryLight, fontFamily: 'Arial', fontSize: Typography.sizes.sm, fontWeight: '600' },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.65)' },
  sheet: { backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, borderWidth: 1, borderColor: Colors.border, padding: Spacing.xl, maxHeight: '90%' },
  handle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.lg },
  sheetTitle: { color: Colors.text, fontFamily: 'Arial', fontSize: Typography.sizes.xl, fontWeight: '700', marginBottom: Spacing.lg },
  fieldLabel: { color: Colors.textSecondary, fontFamily: 'Arial', fontSize: Typography.sizes.sm, fontWeight: '600', marginBottom: Spacing.sm },
  checklistInput: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  addCheckBtn: { width: 48, height: 48, borderRadius: Radius.md, backgroundColor: Colors.surfaceLighter, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', marginTop: 0 },
  checkPreviewRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xs },
  checkPreviewText: { flex: 1, color: Colors.textSecondary, fontFamily: 'Arial', fontSize: Typography.sizes.sm },
  catRow: { flexDirection: 'row', gap: Spacing.sm },
  catChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surfaceLight },
  catChipActive: { borderColor: Colors.accent, backgroundColor: 'rgba(41,182,246,0.12)' },
  catChipText: { color: Colors.textMuted, fontFamily: 'Arial', fontSize: Typography.sizes.sm },
  catChipActiveText: { color: Colors.accent, fontWeight: '600' },
});
