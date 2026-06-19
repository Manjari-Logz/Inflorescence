import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Modal,
  KeyboardAvoidingView, Platform, StatusBar, ActivityIndicator,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Plus, Search, CheckCircle2, Circle, Clock, Flag,
  Trash2, CheckSquare, X, Filter,
} from 'lucide-react-native';
import { useAlert } from '@/template';
import { useTasks } from '@/hooks/useTasks';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { AppInput } from '@/components/ui/AppInput';
import { TaskCard } from '@/components/feature/TaskCard';
import { ProgressBar } from '@/components/ui/ProgressBar';

const FILTERS = ['All', 'Today', 'Upcoming', 'Completed', 'High Priority'];
const PRIORITY_VALUES = ['Low', 'Medium', 'High', 'Critical'] as const;
const CATEGORIES = ['General', 'College', 'Placement', 'Coding', 'Research', 'Personal', 'Health', 'Other'];

export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { tasks, loading, addTask, removeTask, completeTask } = useTasks();
  const { showAlert } = useAlert();

  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [category, setCategory] = useState('General');
  const [priority, setPriority] = useState<typeof PRIORITY_VALUES[number]>('Medium');

  const today = new Date();

  const filtered = useMemo(() => {
    let list = tasks;
    if (searchQuery.trim()) {
      list = list.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    switch (filter) {
      case 'Today':
        return list.filter(t => !t.completed && t.deadline && new Date(t.deadline).toDateString() === today.toDateString());
      case 'Upcoming':
        return list.filter(t => !t.completed && t.deadline && new Date(t.deadline) > today);
      case 'Completed':
        return list.filter(t => t.completed);
      case 'High Priority':
        return list.filter(t => !t.completed && (t.priority === 'High' || t.priority === 'Critical'));
      default:
        return list.filter(t => !t.completed);
    }
  }, [tasks, filter, searchQuery]);

  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;

  const resetForm = () => { setTitle(''); setDescription(''); setDeadline(''); setCategory('General'); setPriority('Medium'); };

  const handleAdd = async () => {
    if (!title.trim()) { showAlert('Missing Title', 'Please enter a task title.'); return; }
    setSaving(true);
    await addTask({ title: title.trim(), description: description.trim() || undefined, deadline: deadline.trim() || undefined, category, priority, completed: false });
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

  const handleDelete = (id: string, title: string) => {
    showAlert('Delete Task', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeTask(id) },
    ]);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.text === '#F1F5F9' ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Tasks</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>{completedCount}/{totalCount} completed</Text>
        </View>
        <Pressable
          style={[styles.addBtn, { backgroundColor: colors.accent }]}
          onPress={() => setModal(true)}
        >
          <Plus size={22} color="#fff" strokeWidth={2.5} />
        </Pressable>
      </View>

      {/* Progress */}
      <View style={styles.progressRow}>
        <ProgressBar
          progress={totalCount > 0 ? (completedCount / totalCount) * 100 : 0}
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
          <Pressable onPress={() => setSearchQuery('')}>
            <X size={16} color={colors.textMuted} strokeWidth={2} />
          </Pressable>
        )}
      </View>

      {/* Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterBar}>
        {FILTERS.map(f => (
          <Pressable
            key={f}
            style={[
              styles.filterChip,
              { borderColor: colors.border, backgroundColor: colors.surfaceLight },
              filter === f && { borderColor: colors.accent, backgroundColor: colors.accent + '18' },
            ]}
            onPress={() => setFilter(f)}
          >
            <Text style={[
              styles.filterChipText,
              { color: colors.textMuted },
              filter === f && { color: colors.accent },
            ]}>{f}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Task List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <CheckSquare size={52} color={colors.textDim} strokeWidth={1.5} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {filter === 'Completed' ? 'No completed tasks yet' : 'No tasks here'}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
            {filter === 'Completed' ? 'Complete tasks to see them here' : 'Tap + to add a new task'}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]}
          showsVerticalScrollIndicator={false}
        >
          {filtered.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onComplete={() => handleComplete(task.id)}
              onDelete={() => handleDelete(task.id, task.title)}
            />
          ))}
        </ScrollView>
      )}

      {/* Add Task Sheet */}
      <Modal visible={modal} transparent animationType="slide" onRequestClose={() => { setModal(false); resetForm(); }}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => { setModal(false); resetForm(); }} />
          <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border, paddingBottom: insets.bottom + 16 }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>New Task</Text>
              <Pressable onPress={() => { setModal(false); resetForm(); }}>
                <X size={20} color={colors.textMuted} strokeWidth={2} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <AppInput label="Title *" placeholder="What needs to be done?" value={title} onChangeText={setTitle} />
              <AppInput label="Description" placeholder="Add details..." value={description} onChangeText={setDescription} multiline numberOfLines={2} />
              <AppInput label="Deadline (YYYY-MM-DD)" placeholder="2025-12-31" value={deadline} onChangeText={setDeadline} />

              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Priority</Text>
              <View style={styles.chipRow}>
                {PRIORITY_VALUES.map(p => (
                  <Pressable
                    key={p}
                    style={[styles.selectChip, { borderColor: colors.border, backgroundColor: colors.surfaceLight }, priority === p && { borderColor: Colors.priority[p], backgroundColor: Colors.priority[p] + '18' }]}
                    onPress={() => setPriority(p)}
                  >
                    <Text style={[styles.selectChipText, { color: colors.textMuted }, priority === p && { color: Colors.priority[p] }]}>{p}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.base }}>
                <View style={styles.chipRow}>
                  {CATEGORIES.map(c => (
                    <Pressable
                      key={c}
                      style={[styles.selectChip, { borderColor: colors.border, backgroundColor: colors.surfaceLight }, category === c && { borderColor: colors.accent, backgroundColor: colors.accent + '18' }]}
                      onPress={() => setCategory(c)}
                    >
                      <Text style={[styles.selectChipText, { color: colors.textMuted }, category === c && { color: colors.accent }]}>{c}</Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>

              <PrimaryButton title="Add Task" onPress={handleAdd} loading={saving} />
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
  progressRow: { paddingHorizontal: Spacing.base, marginBottom: Spacing.md },
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
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: { borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, borderWidth: 1, padding: Spacing.xl, maxHeight: '90%' },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.base },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  sheetTitle: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold },
  fieldLabel: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, marginBottom: Spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.base },
  selectChip: { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1 },
  selectChipText: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold },
});
