import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, Animated, PanResponder,
  LayoutAnimation, UIManager, Platform, Dimensions,
} from 'react-native';
import {
  CheckCircle2, Circle, Clock, Trash2, Edit2, Archive, RotateCcw,
  ChevronDown, ChevronUp, AlertCircle, Hourglass, FileText,
} from 'lucide-react-native';
import { Spacing, Radius } from '@/constants/theme';
import { ProgressBar } from '@/components/ui/ProgressBar';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

const PRIORITY_COLORS: Record<string, string> = {
  Low: '#4CAF50', Medium: '#7AA2E3', High: '#FFB74D', Critical: '#EF5350',
};

interface TaskCardProps {
  task: any;
  colors: any;
  onComplete: (id: string) => void;
  onDelete: (id: string, title: string) => void;
  onEdit: (task: any) => void;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
}

export function TaskCard({
  task,
  colors,
  onComplete,
  onDelete,
  onEdit,
  onArchive,
  onRestore,
}: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);
  const pan = useRef(new Animated.ValueXY()).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (task.completed && gestureState.dx > 0) {
          pan.setValue({ x: gestureState.dx * 0.2, y: 0 });
        } else {
          pan.setValue({ x: gestureState.dx, y: 0 });
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (!task.completed && gestureState.dx > SWIPE_THRESHOLD) {
          Animated.timing(pan, {
            toValue: { x: SCREEN_WIDTH, y: 0 },
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            onComplete(task.id);
            Animated.spring(pan, {
              toValue: { x: 0, y: 0 },
              useNativeDriver: true,
            }).start();
          });
        } else if (gestureState.dx < -SWIPE_THRESHOLD) {
          Animated.timing(pan, {
            toValue: { x: -SCREEN_WIDTH, y: 0 },
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            onDelete(task.id, task.title);
            Animated.spring(pan, {
              toValue: { x: 0, y: 0 },
              useNativeDriver: true,
            }).start();
          });
        } else {
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            friction: 5,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const pColor = PRIORITY_COLORS[task.priority] ?? colors.accent;
  const overdue = task.deadline && new Date(task.deadline) < new Date() && !task.completed;

  const renderBackgrounds = () => {
    const translateX = pan.x;
    return (
      <View style={StyleSheet.absoluteFill}>
        <Animated.View
          style={[
            styles.swipeBg,
            styles.swipeComplete,
            {
              opacity: translateX.interpolate({
                inputRange: [0, SWIPE_THRESHOLD],
                outputRange: [0, 1],
                extrapolate: 'clamp',
              }),
            },
          ]}
        >
          <CheckCircle2 size={24} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.swipeText}>Complete</Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.swipeBg,
            styles.swipeDelete,
            {
              opacity: translateX.interpolate({
                inputRange: [-SWIPE_THRESHOLD, 0],
                outputRange: [1, 0],
                extrapolate: 'clamp',
              }),
            },
          ]}
        >
          <Text style={styles.swipeText}>Delete</Text>
          <Trash2 size={24} color="#FFFFFF" strokeWidth={2.5} />
        </Animated.View>
      </View>
    );
  };

  return (
    <View style={styles.cardWrapper}>
      {renderBackgrounds()}

      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: task.completed ? 'rgba(76, 175, 80, 0.2)' : colors.border,
            transform: [{ translateX: pan.x }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <Pressable onPress={toggleExpand} style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Pressable
              onPress={() => !task.completed && onComplete(task.id)}
              style={styles.checkbox}
              hitSlop={12}
            >
              {task.completed ? (
                <CheckCircle2 size={22} color="#4CAF50" strokeWidth={2.5} />
              ) : (
                <Circle size={22} color={colors.textDim} strokeWidth={2} />
              )}
            </Pressable>

            <View style={styles.taskTitleContainer}>
              <Text
                style={[
                  styles.title,
                  { color: task.completed ? colors.textMuted : colors.text },
                  task.completed && styles.strikethrough,
                ]}
                numberOfLines={expanded ? undefined : 1}
              >
                {task.title}
              </Text>
              
              {!expanded && task.description ? (
                <Text style={[styles.desc, { color: colors.textMuted }]} numberOfLines={1}>
                  {task.description}
                </Text>
              ) : null}
            </View>

            <View style={styles.chevron}>
              {expanded ? (
                <ChevronUp size={18} color={colors.textDim} />
              ) : (
                <ChevronDown size={18} color={colors.textDim} />
              )}
            </View>
          </View>

          {!expanded && (
            <View style={styles.badgeRow}>
              {task.deadline && (
                <View style={[styles.badge, overdue && styles.overdueBadge]}>
                  <Clock size={11} color={overdue ? colors.error : colors.textMuted} />
                  <Text style={[styles.badgeText, { color: overdue ? colors.error : colors.textMuted }]}>
                    {task.deadline}
                  </Text>
                </View>
              )}
              <View style={[styles.badge, { borderColor: pColor + '30', backgroundColor: pColor + '10' }]}>
                <AlertCircle size={11} color={pColor} />
                <Text style={[styles.badgeText, { color: pColor }]}>{task.priority}</Text>
              </View>
              {task.category && task.category !== 'General' && (
                <View style={styles.badge}>
                  <Text style={[styles.badgeText, { color: colors.textMuted }]}>{task.category}</Text>
                </View>
              )}
            </View>
          )}

          {expanded && (
            <View style={styles.expandedContent}>
              {task.description ? (
                <View style={styles.detailItem}>
                  <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                    {task.description}
                  </Text>
                </View>
              ) : null}

              {(task.progress ?? 0) > 0 && !task.completed && (
                <View style={styles.progressSection}>
                  <View style={styles.progressLabelRow}>
                    <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>Progress</Text>
                    <Text style={[styles.progressPct, { color: colors.text }]}>{task.progress}%</Text>
                  </View>
                  <ProgressBar
                    progress={task.progress}
                    height={4}
                    color={pColor}
                    backgroundColor={colors.surfaceLight}
                  />
                </View>
              )}

              <View style={[styles.detailsGrid, { borderTopColor: colors.borderLight }]}>
                {task.estimated_time ? (
                  <View style={styles.gridCell}>
                    <Hourglass size={14} color={colors.textMuted} />
                    <Text style={[styles.gridText, { color: colors.textSecondary }]}>
                      {task.estimated_time} mins
                    </Text>
                  </View>
                ) : null}

                {task.difficulty ? (
                  <View style={styles.gridCell}>
                    <Text style={[styles.gridText, { color: colors.textSecondary }]}>
                      Difficulty: {task.difficulty}
                    </Text>
                  </View>
                ) : null}
              </View>

              {task.notes ? (
                <View style={[styles.notesSection, { backgroundColor: colors.surfaceLight }]}>
                  <View style={styles.notesTitleRow}>
                    <FileText size={12} color={colors.textSecondary} />
                    <Text style={[styles.notesTitle, { color: colors.textSecondary }]}>Notes</Text>
                  </View>
                  <Text style={[styles.notesText, { color: colors.textMuted }]}>
                    {task.notes}
                  </Text>
                </View>
              ) : null}

              <View style={[styles.actionRow, { borderTopColor: colors.borderLight }]}>
                {!task.completed && (
                  <Pressable
                    style={[styles.actionButton, { backgroundColor: colors.surfaceLight }]}
                    onPress={() => onEdit(task)}
                  >
                    <Edit2 size={14} color={colors.text} />
                    <Text style={[styles.actionButtonText, { color: colors.text }]}>Edit</Text>
                  </Pressable>
                )}

                {!task.archived ? (
                  <Pressable
                    style={[styles.actionButton, { backgroundColor: colors.surfaceLight }]}
                    onPress={() => onArchive(task.id)}
                  >
                    <Archive size={14} color={colors.text} />
                    <Text style={[styles.actionButtonText, { color: colors.text }]}>Archive</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    style={[styles.actionButton, { backgroundColor: colors.surfaceLight }]}
                    onPress={() => onRestore(task.id)}
                  >
                    <RotateCcw size={14} color="#4CAF50" />
                    <Text style={[styles.actionButtonText, { color: '#4CAF50' }]}>Restore</Text>
                  </Pressable>
                )}

                <Pressable
                  style={[styles.actionButton, { backgroundColor: 'rgba(239, 83, 80, 0.1)' }]}
                  onPress={() => onDelete(task.id, task.title)}
                >
                  <Trash2 size={14} color={colors.error} />
                  <Text style={[styles.actionButtonText, { color: colors.error }]}>Delete</Text>
                </Pressable>
              </View>
            </View>
          )}
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: Spacing.sm,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  swipeBg: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.lg,
  },
  swipeComplete: {
    left: 0,
    right: 0,
    backgroundColor: '#4CAF50',
    justifyContent: 'flex-start',
    gap: 8,
  },
  swipeDelete: {
    left: 0,
    right: 0,
    backgroundColor: '#EF5350',
    justifyContent: 'flex-end',
    gap: 8,
  },
  swipeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  card: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  cardContent: {
    padding: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    marginRight: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskTitleContainer: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
  desc: {
    fontSize: 12,
  },
  chevron: {
    paddingHorizontal: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: Spacing.sm,
    paddingLeft: 32,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    gap: 4,
  },
  overdueBadge: {
    borderColor: 'rgba(239, 83, 80, 0.3)',
    backgroundColor: 'rgba(239, 83, 80, 0.08)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  expandedContent: {
    marginTop: Spacing.md,
    paddingLeft: 32,
    gap: Spacing.md,
  },
  detailItem: {
    marginBottom: 2,
  },
  detailText: {
    fontSize: 13,
    lineHeight: 18,
  },
  progressSection: {
    gap: 6,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 12,
  },
  progressPct: {
    fontSize: 12,
    fontWeight: '700',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.base,
    borderTopWidth: 1,
    paddingTop: Spacing.md,
  },
  gridCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gridText: {
    fontSize: 12,
  },
  notesSection: {
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: 4,
  },
  notesTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  notesTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notesText: {
    fontSize: 12.5,
    lineHeight: 17,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
