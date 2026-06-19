import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { CheckCircle2, Circle, Trash2, Clock } from 'lucide-react-native';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { Task } from '@/services/tasksService';

interface TaskCardProps {
  task: Task;
  onComplete: () => void;
  onDelete: () => void;
}

export function TaskCard({ task, onComplete, onDelete }: TaskCardProps) {
  const priorityColor = Colors.priority[task.priority] ?? Colors.accent;
  const deadlineStr = task.deadline
    ? new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null;
  const isOverdue = task.deadline && !task.completed && new Date(task.deadline) < new Date();

  return (
    <View style={[styles.card, task.completed && styles.completed]}>
      <View style={[styles.priorityBar, { backgroundColor: priorityColor }]} />
      <Pressable
        style={({ pressed }) => [styles.check, pressed && { opacity: 0.6 }]}
        onPress={onComplete}
        disabled={task.completed}
        hitSlop={8}
      >
        {task.completed
          ? <CheckCircle2 size={22} color={Colors.success} />
          : <Circle size={22} color={Colors.textMuted} />}
      </Pressable>
      <View style={styles.content}>
        <Text style={[styles.title, task.completed && styles.strikethrough]} numberOfLines={1}>{task.title}</Text>
        {task.description ? <Text style={styles.desc} numberOfLines={1}>{task.description}</Text> : null}
        <View style={styles.meta}>
          <View style={[styles.priorityTag, { borderColor: priorityColor }]}>
            <Text style={[styles.priorityText, { color: priorityColor }]}>{task.priority}</Text>
          </View>
          <Text style={styles.category}>{task.category}</Text>
          {deadlineStr ? (
            <View style={styles.deadlineRow}>
              <Clock size={11} color={isOverdue ? Colors.error : Colors.textMuted} />
              <Text style={[styles.deadline, isOverdue && styles.overdue]}>{deadlineStr}</Text>
            </View>
          ) : null}
        </View>
      </View>
      <Pressable onPress={onDelete} hitSlop={8} style={({ pressed }) => [pressed && { opacity: 0.5 }]}>
        <Trash2 size={18} color={Colors.textDim} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
    paddingRight: Spacing.md,
    overflow: 'hidden',
    gap: Spacing.md,
    ...({ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1 }),
  },
  completed: { opacity: 0.5 },
  priorityBar: {
    width: 3,
    alignSelf: 'stretch',
  },
  check: { padding: Spacing.sm },
  content: {
    flex: 1,
    paddingVertical: Spacing.md,
    gap: 4,
  },
  title: {
    color: Colors.text,
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  desc: {
    color: Colors.textMuted,
    fontSize: Typography.sizes.sm,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  priorityTag: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  priorityText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
  },
  category: {
    color: Colors.textMuted,
    fontSize: Typography.sizes.xs,
  },
  deadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  deadline: {
    color: Colors.textMuted,
    fontSize: Typography.sizes.xs,
  },
  overdue: { color: Colors.error },
});
