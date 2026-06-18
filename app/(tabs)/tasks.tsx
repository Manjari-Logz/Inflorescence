import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Modal,
  KeyboardAvoidingView, Platform, StatusBar, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAlert } from '@/template';
import { useTasks } from '@/hooks/useTasks';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { AppInput } from '@/components/ui/AppInput';
import { TaskCard } from '@/components/feature/TaskCard';
import { ProgressBar } from '@/components/ui/ProgressBar';

const PRIORITIES = ['All', 'Critical', 'High', 'Medium', 'Low'];
const PRIORITY_VALUES = ['Low', 'Medium', 'High', 'Critical'] as const;
const CATEGORIES = ['General', 'College', 'Placement', 'Coding', 'Research', 'Personal', 'Health', 'Other'];

export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const { tasks, loading, addTask, removeTask, completeTask } = useTasks();
  const { showAlert } = useAlert();

  const [filter, setFilter] = useState('All');
  const [showCompleted, setShowCompleted] = useState(false);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [category, setCategory] = useState('General');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');

  const filtered = useMemo(() => {
    return tasks.filter(t => {
      if (t.completed !== showCompleted) return false;
      if (filter === 'All') return true;
      return t.priority === filter;
    });
  }, [tasks, filter, showCompleted]);

  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;

  const resetForm = () => {
    setTitle(''); setDescription(''); setDeadline('');
    setCategory('General'); setPriority('Medium');
  };

  const handleAdd = async () => {
    if (!title.trim()) { showAlert('Missing Title', 'Please enter a task title.'); return; }
    setSaving(true);
    await addTask({
      title: title.trim(),
      description: description.trim() || undefined,
      deadline: deadline.trim() || undefined,
      category,
      priority,
      completed: false,
    });
    setSaving(false);
    setModal(false);
    resetForm();
  };

  const handleComplete = async (id: string) => {
    const result = await completeTask(id);
    if (result?.badge) {
      showAlert(`${result.badgeName} Earned! 🎉`, `You have unlocked the ${result.badgeName}! Keep going!`, [
        { text: 'Awesome!', style: 'default' },
      ]);
    }
  };

  const handleDelete = (id: string, title: string) => {
    showAlert('Delete Task', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeTask(id) },
    ]);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.screenTitle}>Smart Tasks</Text>
          <Text style={styles.screenSub}>{completedCount}/{totalCount} completed</Text>
        </View>
        <Pressable style={styles.addBtn} onPress={() => setModal(true)}>
          <MaterialIcons name="add" size={26} color="#fff" />
        </Pressable>
      </View>

      {/* Progress */}
      <View style={styles.progressRow}>
        <ProgressBar progress={totalCount > 0 ? (completedCount / totalCount) * 100 : 0} height={5} />
      </View>

      {/* Filter Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterBar}
      >
        {PRIORITIES.map(p => (
          <Pressable
            key={p}
            style={[styles.filterChip, filter === p && styles.filterChipActive, p !== 'All' && filter === p && { borderColor: Colors.priority[p] ?? Colors.accent }]}
            onPress={() => setFilter(p)}
          >
            <Text style={[styles.filterChipText, filter === p && styles.filterChipTextActive, p !== 'All' && filter === p && { color: Colors.priority[p] ?? Colors.accent }]}>
              {p}
            </Text>
          </Pressable>
        ))}
        <Pressable
          style={[styles.filterChip, showCompleted && styles.filterChipDone]}
          onPress={() => setShowCompleted(s => !s)}
        >
          <MaterialIcons name={showCompleted ? 'check-circle' : 'check-circle-outline'} size={14} color={showCompleted ? Colors.success : Colors.textMuted} />
          <Text style={[styles.filterChipText, showCompleted && { color: Colors.success }]}>Done</Text>
        </Pressable>
      </ScrollView>

      {/* Task List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>{showCompleted ? '🏆' : '✅'}</Text>
          <Text style={styles.emptyTitle}>{showCompleted ? 'No completed tasks yet' : 'No tasks here'}</Text>
          <Text style={styles.emptySubtitle}>
            {showCompleted ? 'Complete tasks to see them here' : 'Tap + to add a new task'}
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

      {/* Add Task Modal */}
      <Modal visible={modal} transparent animationType="slide" onRequestClose={() => setModal(false)}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setModal(false)} />
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>New Task</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <AppInput label="Title *" placeholder="What needs to be done?" value={title} onChangeText={setTitle} />
              <AppInput label="Description" placeholder="Optional details..." value={description} onChangeText={setDescription} multiline numberOfLines={2} />
              <AppInput label="Deadline (YYYY-MM-DD)" placeholder="e.g. 2025-12-31" value={deadline} onChangeText={setDeadline} />

              <Text style={styles.fieldLabel}>Priority</Text>
              <View style={styles.chipRow}>
                {PRIORITY_VALUES.map(p => (
                  <Pressable
                    key={p}
                    style={[styles.selectChip, priority === p && { borderColor: Colors.priority[p], backgroundColor: `${Colors.priority[p]}18` }]}
                    onPress={() => setPriority(p)}
                  >
                    <Text style={[styles.selectChipText, priority === p && { color: Colors.priority[p] }]}>{p}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.base }}>
                <View style={styles.chipRow}>
                  {CATEGORIES.map(c => (
                    <Pressable
                      key={c}
                      style={[styles.selectChip, category === c && styles.selectChipActive]}
                      onPress={() => setCategory(c)}
                    >
                      <Text style={[styles.selectChipText, category === c && styles.selectChipActiveText]}>{c}</Text>
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
  root: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md },
  screenTitle: { color: Colors.text, fontFamily: 'Arial', fontSize: Typography.sizes.xxl, fontWeight: '700' },
  screenSub: { color: Colors.textMuted, fontFamily: 'Arial', fontSize: Typography.sizes.sm, marginTop: 2 },
  addBtn: { width: 46, height: 46, borderRadius: 23, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
  progressRow: { paddingHorizontal: Spacing.base, marginBottom: Spacing.sm },
  filterBar: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, gap: Spacing.sm, flexDirection: 'row' },
  filterChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surfaceLight, flexDirection: 'row', alignItems: 'center', gap: 4 },
  filterChipActive: { borderColor: Colors.accent, backgroundColor: 'rgba(41,182,246,0.12)' },
  filterChipDone: { borderColor: Colors.success, backgroundColor: 'rgba(76,175,80,0.1)' },
  filterChipText: { color: Colors.textMuted, fontFamily: 'Arial', fontSize: Typography.sizes.sm, fontWeight: '600' },
  filterChipTextActive: { color: Colors.accent },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xxl },
  emptyEmoji: { fontSize: 64, marginBottom: Spacing.base },
  emptyTitle: { color: Colors.text, fontFamily: 'Arial', fontSize: Typography.sizes.xl, fontWeight: '700', textAlign: 'center', marginBottom: Spacing.sm },
  emptySubtitle: { color: Colors.textMuted, fontFamily: 'Arial', fontSize: Typography.sizes.base, textAlign: 'center' },
  list: { paddingHorizontal: Spacing.base, paddingTop: Spacing.sm },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: { backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, borderWidth: 1, borderColor: Colors.border, padding: Spacing.xl, maxHeight: '90%' },
  sheetHandle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.lg },
  sheetTitle: { color: Colors.text, fontFamily: 'Arial', fontSize: Typography.sizes.xl, fontWeight: '700', marginBottom: Spacing.lg },
  fieldLabel: { color: Colors.textSecondary, fontFamily: 'Arial', fontSize: Typography.sizes.sm, fontWeight: '600', marginBottom: Spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.base },
  selectChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surfaceLight },
  selectChipActive: { borderColor: Colors.accent, backgroundColor: 'rgba(41,182,246,0.12)' },
  selectChipText: { color: Colors.textMuted, fontFamily: 'Arial', fontSize: Typography.sizes.sm, fontWeight: '600' },
  selectChipActiveText: { color: Colors.accent },
});
