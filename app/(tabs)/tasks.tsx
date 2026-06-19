import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Modal,
  KeyboardAvoidingView, Platform, StatusBar, ActivityIndicator,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Plus, Search, CheckCircle2, Circle, Clock, Flag,
  Trash2, CheckSquare, X, Edit2, Archive, RotateCcw,
} from 'lucide-react-native';
import { useAlert } from '@/template';
import { useTasks } from '@/hooks/useTasks';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { AppInput } from '@/components/ui/AppInput';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Task } from '@/services/tasksService';

const FILTERS = ['All', 'Today', 'Upcoming', 'Completed', 'High Priority', 'Archived'];
const PRIORITY_VALUES = ['Low', 'Medium', 'High', 'Critical'] as const;
const DIFFICULTY_VALUES = ['Easy', 'Medium', 'Hard'] as const;
const CATEGORIES = ['General', 'College', 'Placement', 'Coding', 'Research', 'Personal', 'Health', 'Other'];

const PRIORITY_COLORS: Record<string, string> = {
  Low: '#22C55E', Medium: '#3B82F6', High: '#F59E0B', Critical: '#EF4444',
};

export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { tasks, loading, addTask, updateTask, removeTask, completeTask, archiveTask, restoreTask } = useTasks();
  const { showAlert } = useAlert();

  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [category, setCategory] = useState('General');
  const [priority, setPriority] = useState<typeof PRIORITY_VALUES[number]>('Medium');
  const [difficulty, setDifficulty] = useState<typeof DIFFICULTY_VALUES[number]>('Medium');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [progress, setProgress] = useState('0');

  const today = new Date();

  const filtered = useMemo(() => {
    let list = tasks;
    if (searchQuery.trim()) {
      list = list.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    switch (filter) {
      case 'Today':
        return list.filter(t => !t.completed && !t.archived && t.deadline && new Date(t.deadline).toDateString() === today.toDateString());
      case 'Upcoming':
        return list.filter(t => !t.completed && !t.archived && t.deadline && new Date(t.deadline) > today);
      case 'Completed':
        return list.filter(t => t.completed && !t.archived);
      case 'High Priority':
        return list.filter(t => !t.completed && !t.archived && (t.priority === 'High' || t.priority === 'Critical'));
      case 'Archived':
        return list.filter(t => t.archived);
      default:
        return list.filter(t => !t.completed && !t.archived);
    }
  }, [tasks, filter, searchQuery]);

  const completedCount = tasks.filter(t => t.completed).length;
  const totalActive = tasks.filter(t => !t.completed && !t.archived).length;

  const resetForm = () => {
    setEditId(null); setTitle(''); setDescription(''); setDeadline('');
    setCategory('General'); setPriority('Medium'); setDifficulty('Medium');
    setEstimatedTime(''); setNotes(''); setProgress('0');
  };

  const openEdit = (task: Task) => {
    setEditId(task.id);
    setTitle(task.title);
    setDescription(task.description ?? '');
    setDeadline(task.deadline ?? '');
    setCategory(task.category);
    setPriority(task.priority);
    setDifficulty(task.difficulty ?? 'Medium');
    setEstimatedTime(task.estimated_time ? String(task.estimated_time) : '');
    setNotes(task.notes ?? '');
    setProgress(String(task.progress ?? 0));
    setModal(true);
  };

  const handleSave = async () => {
    if (!title.trim()) { showAlert('Missing Title', 'Please enter a task title.'); return; }
    setSaving(true);
    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      deadline: deadline.trim() || undefined,
      category,
      priority,
      difficulty,
      estimated_time: estimatedTime ? parseInt(estimatedTime, 10) : undefined,
      notes: notes.trim() || undefined,
      progress: parseInt(progress, 10) || 0,
      completed: false,
    };
    if (editId) {
      await updateTask(editId, payload);
    } else {
      await addTask(payload);
    }
    setSaving(false);
    setModal(false);
    resetForm();
  };

  const handleComplete = async (id: string) => {
    const result = await completeTask(id);
    if (result?.badge) {
      showAlert('Badge Earned!', `You unlocked the ${result.badgeName}! Keep going!`, [{ text: 'Awesome!', style: 'default' }]);
    }
  };

  const handleDelete = (id: string, taskTitle: string) => {
    showAlert('Delete Task', `Delete "${taskTitle}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeTask(id) },
    ]);
  };

  const isOverdue = (deadline?: string) => {
    if (!deadline) return false;
    return new Date(deadline) < today;
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.text === '#F1F5F9' ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Tasks</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>{completedCount} done · {totalActive} active</Text>
        </View>
        <Pressable style={[styles.addBtn, { backgroundColor: colors.accent }]} onPress={() => { resetForm(); setModal(true); }}>
          <Plus size={22} color="#fff" strokeWidth={2.5} />
        </Pressable>
      </View>

      {/* Overall Progress */}
      <View style={{ paddingHorizontal: Spacing.base, marginBottom: Spacing.sm }}>
        <ProgressBar
          progress={tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0}
          height={4}
          color={colors.accent}
          backgroundColor={colors.surfaceLight}
        />
      </View>

      {/* Search */}
      <View style={[styles.searchBar, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
        <Search size={16} color={colors.textMuted} strokeWidth={2} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search tasks..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
            <X size={16} color={colors.textMuted} strokeWidth={2} />
          </Pressable>
        )}
      </View>

      {/* Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterBar}>
        {FILTERS.map(f => (
          <Pressable
            key={f}
            style={[styles.filterChip, { borderColor: colors.border, backgroundColor: colors.surfaceLight }, filter === f && { borderColor: colors.accent, backgroundColor: colors.accent + '18' }]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterChipText, { color: filter === f ? colors.accent : colors.textMuted }]}>{f}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Task List */}
      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.accent} size="large" /></View>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <CheckSquare size={52} color={colors.textDim} strokeWidth={1.5} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {filter === 'Completed' ? 'No completed tasks' : filter === 'Archived' ? 'No archived tasks' : 'No tasks here'}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
            {filter === 'All' ? 'Tap + to add your first task' : `Switch filters to see other tasks`}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 90 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {filtered.map(task => {
            const pColor = PRIORITY_COLORS[task.priority] ?? colors.accent;
            const overdue = isOverdue(task.deadline) && !task.completed;
            return (
              <View key={task.id} style={[styles.taskCard, { backgroundColor: colors.surface, borderColor: task.completed ? Colors.success + '40' : overdue ? Colors.error + '40' : colors.border }]}>
                {/* Priority bar */}
                <View style={[styles.priorityBar, { backgroundColor: pColor }]} />
                <View style={styles.taskBody}>
                  <View style={styles.taskTop}>
                    <Pressable onPress={() => !task.completed && handleComplete(task.id)} style={styles.checkBtn}>
                      {task.completed
                        ? <CheckCircle2 size={22} color={Colors.success} strokeWidth={2} />
                        : <Circle size={22} color={colors.textDim} strokeWidth={2} />}
                    </Pressable>
                    <View style={styles.taskContent}>
                      <Text style={[styles.taskTitle, { color: task.completed ? colors.textMuted : colors.text }, task.completed && styles.strikethrough]} numberOfLines={2}>
                        {task.title}
                      </Text>
                      {task.description ? (
                        <Text style={[styles.taskDesc, { color: colors.textMuted }]} numberOfLines={1}>{task.description}</Text>
                      ) : null}
                      <View style={styles.taskMeta}>
                        {task.deadline && (
                          <View style={styles.metaItem}>
                            <Clock size={11} color={overdue ? Colors.error : colors.textMuted} strokeWidth={2} />
                            <Text style={[styles.metaText, { color: overdue ? Colors.error : colors.textMuted }]}>{task.deadline}</Text>
                          </View>
                        )}
                        <View style={[styles.priorityBadge, { borderColor: pColor }]}>
                          <Text style={[styles.priorityBadgeText, { color: pColor }]}>{task.priority}</Text>
                        </View>
                        {task.category !== 'General' && (
                          <View style={[styles.catBadge, { backgroundColor: colors.surfaceLight }]}>
                            <Text style={[styles.catBadgeText, { color: colors.textMuted }]}>{task.category}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <View style={styles.taskActions}>
                      {!task.archived && !task.completed && (
                        <Pressable onPress={() => openEdit(task)} hitSlop={8}>
                          <Edit2 size={15} color={colors.textMuted} strokeWidth={2} />
                        </Pressable>
                      )}
                      {!task.archived ? (
                        <Pressable onPress={() => archiveTask(task.id)} hitSlop={8}>
                          <Archive size={15} color={colors.textMuted} strokeWidth={2} />
                        </Pressable>
                      ) : (
                        <Pressable onPress={() => restoreTask(task.id)} hitSlop={8}>
                          <RotateCcw size={15} color={Colors.success} strokeWidth={2} />
                        </Pressable>
                      )}
                      <Pressable onPress={() => handleDelete(task.id, task.title)} hitSlop={8}>
                        <Trash2 size={15} color={Colors.error} strokeWidth={2} />
                      </Pressable>
                    </View>
                  </View>
                  {/* Progress bar for task */}
                  {(task.progress ?? 0) > 0 && !task.completed && (
                    <View style={styles.taskProgressRow}>
                      <ProgressBar progress={task.progress ?? 0} height={3} color={pColor} backgroundColor={colors.surfaceLight} />
                      <Text style={[styles.progressPct, { color: colors.textDim }]}>{task.progress}%</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Add / Edit Task Modal */}
      <Modal visible={modal} transparent animationType="slide" onRequestClose={() => { setModal(false); resetForm(); }}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => { setModal(false); resetForm(); }} />
          <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border, paddingBottom: insets.bottom + 16 }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>{editId ? 'Edit Task' : 'New Task'}</Text>
              <Pressable onPress={() => { setModal(false); resetForm(); }}>
                <X size={20} color={colors.textMuted} strokeWidth={2} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <AppInput label="Title *" placeholder="What needs to be done?" value={title} onChangeText={setTitle} />
              <AppInput label="Description" placeholder="Add details..." value={description} onChangeText={setDescription} multiline numberOfLines={2} />
              <AppInput label="Deadline (YYYY-MM-DD)" placeholder="2025-12-31" value={deadline} onChangeText={setDeadline} />
              <AppInput label="Estimated Time (minutes)" placeholder="60" value={estimatedTime} onChangeText={setEstimatedTime} keyboardType="number-pad" />
              {editId && (
                <AppInput label="Progress (%)" placeholder="0-100" value={progress} onChangeText={setProgress} keyboardType="number-pad" />
              )}
              <AppInput label="Notes" placeholder="Additional notes..." value={notes} onChangeText={setNotes} multiline numberOfLines={2} />

              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Priority</Text>
              <View style={styles.chipRow}>
                {PRIORITY_VALUES.map(p => (
                  <Pressable key={p} style={[styles.chip, { borderColor: colors.border, backgroundColor: colors.surfaceLight }, priority === p && { borderColor: PRIORITY_COLORS[p], backgroundColor: PRIORITY_COLORS[p] + '18' }]} onPress={() => setPriority(p)}>
                    <Text style={[styles.chipText, { color: priority === p ? PRIORITY_COLORS[p] : colors.textMuted }]}>{p}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Difficulty</Text>
              <View style={styles.chipRow}>
                {DIFFICULTY_VALUES.map(d => (
                  <Pressable key={d} style={[styles.chip, { borderColor: colors.border, backgroundColor: colors.surfaceLight }, difficulty === d && { borderColor: colors.accent, backgroundColor: colors.accent + '18' }]} onPress={() => setDifficulty(d)}>
                    <Text style={[styles.chipText, { color: difficulty === d ? colors.accent : colors.textMuted }]}>{d}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.base }}>
                <View style={styles.chipRow}>
                  {CATEGORIES.map(c => (
                    <Pressable key={c} style={[styles.chip, { borderColor: colors.border, backgroundColor: colors.surfaceLight }, category === c && { borderColor: colors.accent, backgroundColor: colors.accent + '18' }]} onPress={() => setCategory(c)}>
                      <Text style={[styles.chipText, { color: category === c ? colors.accent : colors.textMuted }]}>{c}</Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>

              <PrimaryButton title={editId ? 'Save Changes' : 'Add Task'} onPress={handleSave} loading={saving} />
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
  title: { fontSize: Typography.sizes.xxl, fontWeight: Typography.weights.bold },
  subtitle: { fontSize: Typography.sizes.sm, marginTop: 2 },
  addBtn: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  searchBar: { flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing.base, paddingHorizontal: Spacing.md, paddingVertical: 10, borderRadius: Radius.md, borderWidth: 1, gap: Spacing.sm, marginBottom: Spacing.sm },
  searchInput: { flex: 1, fontSize: Typography.sizes.base, padding: 0 },
  filterBar: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, gap: Spacing.sm, flexDirection: 'row' },
  filterChip: { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1 },
  filterChipText: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xxl, gap: Spacing.md },
  emptyTitle: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, textAlign: 'center' },
  emptySubtitle: { fontSize: Typography.sizes.base, textAlign: 'center' },
  list: { paddingHorizontal: Spacing.base, paddingTop: Spacing.sm },
  taskCard: { flexDirection: 'row', borderRadius: Radius.lg, borderWidth: 1, marginBottom: Spacing.sm, overflow: 'hidden' },
  priorityBar: { width: 4 },
  taskBody: { flex: 1, padding: Spacing.md, gap: Spacing.xs },
  taskTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  checkBtn: { marginTop: 2 },
  taskContent: { flex: 1, gap: 3 },
  taskTitle: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.semibold },
  strikethrough: { textDecorationLine: 'line-through' },
  taskDesc: { fontSize: Typography.sizes.sm },
  taskMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, alignItems: 'center', marginTop: 2 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: Typography.sizes.xs },
  priorityBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.full, borderWidth: 1 },
  priorityBadgeText: { fontSize: 10, fontWeight: '700' },
  catBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.full },
  catBadgeText: { fontSize: 10, fontWeight: '600' },
  taskActions: { flexDirection: 'column', gap: Spacing.sm, alignItems: 'center', justifyContent: 'flex-start' },
  taskProgressRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 4 },
  progressPct: { fontSize: Typography.sizes.xs, width: 28, textAlign: 'right' },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: { borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, borderWidth: 1, padding: Spacing.xl, maxHeight: '92%' },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.base },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  sheetTitle: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold },
  fieldLabel: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, marginBottom: Spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.base },
  chip: { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1 },
  chipText: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold },
});
