import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
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
        style={({ pressed }) => [styles.check, task.completed && styles.checkDone, pressed && { opacity: 0.7 }]}
        onPress={onComplete}
        disabled={task.completed}
        hitSlop={8}
      >
        {task.completed ? <MaterialIcons name="check-circle" size={22} color={Colors.success} /> : <MaterialIcons name="radio-button-unchecked" size={22} color={Colors.textMuted} />}
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
            <Text style={[styles.deadline, isOverdue ? styles.overdue : null]}>
              <MaterialIcons name="access-time" size={11} color={isOverdue ? Colors.error : Colors.textMuted} /> {deadlineStr}
            </Text>
          ) : null}
        </View>
      </View>
      <Pressable onPress={onDelete} hitSlop={8} style={({ pressed }) => [pressed && { opacity: 0.5 }]}>
        <MaterialIcons name="delete-outline" size={20} color={Colors.textDim} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.glass,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
    paddingRight: Spacing.md,
    overflow: 'hidden',
    gap: Spacing.md,
  },
  completed: {
    opacity: 0.55,
  },
  priorityBar: {
    width: 4,
    alignSelf: 'stretch',
    borderTopLeftRadius: Radius.md,
    borderBottomLeftRadius: Radius.md,
  },
  check: {
    padding: Spacing.sm,
  },
  checkDone: {},
  content: {
    flex: 1,
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  title: {
    color: Colors.text,
    fontSize: Typography.sizes.base,
    fontFamily: Typography.fontFamily,
    fontWeight: Typography.weights.medium,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  desc: {
    color: Colors.textMuted,
    fontSize: Typography.sizes.sm,
    fontFamily: Typography.fontFamily,
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
    fontFamily: Typography.fontFamily,
    fontWeight: Typography.weights.semibold,
  },
  category: {
    color: Colors.textMuted,
    fontSize: Typography.sizes.xs,
    fontFamily: Typography.fontFamily,
  },
  deadline: {
    color: Colors.textMuted,
    fontSize: Typography.sizes.xs,
    fontFamily: Typography.fontFamily,
  },
  overdue: {
    color: Colors.error,
  },
});
