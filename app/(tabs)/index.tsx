import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Modal, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Bell, Search, CheckCircle2, Clock, Flame, Star,
  BookOpen, Activity, Trophy, Target, ChevronRight,
  Timer, TrendingUp, Calendar, Sun, Sunset, Moon,
  X,
} from 'lucide-react-native';
import { useAuth, useAlert } from '@/template';
import { useTasks } from '@/hooks/useTasks';
import { useBadges } from '@/hooks/useBadges';
import { useEvents } from '@/hooks/useEvents';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Typography, Spacing, Radius, MODULE_ROUTES, Colors } from '@/constants/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { PomodoroTimer } from '@/components/feature/PomodoroTimer';
import { BadgeAchievement } from '@/components/feature/BadgeAchievement';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good Morning', icon: Sun };
  if (h < 17) return { text: 'Good Afternoon', icon: Sunset };
  return { text: 'Good Evening', icon: Moon };
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { user } = useAuth();
  const { tasks } = useTasks();
  const { badges } = useBadges();
  const { hackathons } = useEvents();
  const { showAlert } = useAlert();
  const [pomodoroModal, setPomodoroModal] = useState(false);
  const [badgePreview, setBadgePreview] = useState<{ type: string; name: string } | null>(null);

  const today = new Date();
  const { text: greetingText, icon: GreetingIcon } = getGreeting();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const displayName = user?.username ?? user?.email?.split('@')[0] ?? 'there';

  const todayTasks = tasks.filter(t => {
    if (t.completed) return false;
    if (!t.deadline) return false;
    return new Date(t.deadline).toDateString() === today.toDateString();
  });

  const completedToday = tasks.filter(t => {
    if (!t.completed || !t.completed_at) return false;
    return new Date(t.completed_at).toDateString() === today.toDateString();
  });

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const upcomingEvents = hackathons
    .filter(h => h.end_date && new Date(h.end_date) >= today)
    .sort((a, b) => new Date(a.end_date!).getTime() - new Date(b.end_date!).getTime())
    .slice(0, 3);

  const priorityColor = (p: string) => Colors.priority[p] ?? colors.accent;

  const quickStats = [
    { label: "Today's Tasks", value: todayTasks.length, icon: CheckCircle2, color: colors.accent },
    { label: 'Done Today', value: completedToday.length, icon: Star, color: Colors.success },
    { label: 'Total Badges', value: badges.length, icon: Trophy, color: Colors.warning },
    { label: 'Completion', value: `${completionRate}%`, icon: TrendingUp, color: '#8B5CF6' },
  ];

  const moduleShortcuts = [
    { label: 'Study', icon: BookOpen, route: '/(tabs)/study', color: colors.accent },
    { label: 'Events', icon: Calendar, route: '/(tabs)/events', color: Colors.warning },
    { label: 'Books', icon: BookOpen, route: '/modules/books', color: '#8B5CF6' },
    { label: 'Exercise', icon: Activity, route: '/modules/exercise', color: Colors.success },
    { label: 'Goals', icon: Target, route: '/(tabs)/goals', color: '#A855F7' },
    { label: 'Analytics', icon: TrendingUp, route: '/modules/analytics', color: colors.accent },
  ];

  return (
    <View style={[styles.root, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.text === '#F1F5F9' ? 'light-content' : 'dark-content'} />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.greetingRow}>
              <GreetingIcon size={16} color={colors.textMuted} strokeWidth={2} />
              <Text style={[styles.greeting, { color: colors.textMuted }]}>{greetingText}</Text>
            </View>
            <Text style={[styles.name, { color: colors.text }]}>
              {displayName.charAt(0).toUpperCase() + displayName.slice(1)}
            </Text>
            <Text style={[styles.date, { color: colors.textMuted }]}>{dateStr}</Text>
          </View>
          <View style={styles.headerRight}>
            <Pressable
              style={[styles.iconBtn, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}
              onPress={() => showAlert('Search', 'Search coming soon')}
            >
              <Search size={18} color={colors.textMuted} strokeWidth={2} />
            </Pressable>
            <Pressable style={[styles.iconBtn, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
              <Bell size={18} color={colors.textMuted} strokeWidth={2} />
            </Pressable>
          </View>
        </View>

        {/* Overall Progress Banner */}
        <GlassCard style={[styles.progressBanner, { backgroundColor: colors.accent }]} padding={20}>
          <View style={styles.progressBannerTop}>
            <View>
              <Text style={styles.progressBannerTitle}>Overall Progress</Text>
              <Text style={styles.progressBannerSub}>{completedTasks} of {totalTasks} tasks done</Text>
            </View>
            <Text style={styles.progressBannerPct}>{completionRate}%</Text>
          </View>
          <View style={styles.progressBannerBar}>
            <View style={[styles.progressBannerFill, { width: `${completionRate}%` }]} />
          </View>
        </GlassCard>

        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
          {quickStats.map((s, i) => (
            <GlassCard key={i} style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]} padding={14}>
              <View style={[styles.statIconBox, { backgroundColor: s.color + '18' }]}>
                <s.icon size={18} color={s.color} strokeWidth={2} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>{s.label}</Text>
            </GlassCard>
          ))}
        </View>

        {/* Today's Priorities */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Today's Priorities</Text>
            <Pressable onPress={() => router.push('/(tabs)/tasks')} style={styles.seeAllBtn}>
              <Text style={[styles.seeAll, { color: colors.accent }]}>See all</Text>
              <ChevronRight size={14} color={colors.accent} strokeWidth={2} />
            </Pressable>
          </View>
          {todayTasks.length === 0 ? (
            <GlassCard style={{ backgroundColor: colors.surface, borderColor: colors.border }} padding={20}>
              <View style={styles.emptyState}>
                <CheckCircle2 size={32} color={Colors.success} strokeWidth={1.5} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>All clear for today</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>No tasks due today. Great work!</Text>
              </View>
            </GlassCard>
          ) : (
            <GlassCard style={{ backgroundColor: colors.surface, borderColor: colors.border }} padding={0}>
              {todayTasks.slice(0, 4).map((t, idx) => (
                <View key={t.id}>
                  {idx > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                  <View style={styles.taskRow}>
                    <View style={[styles.taskPriorityDot, { backgroundColor: priorityColor(t.priority) }]} />
                    <View style={styles.taskContent}>
                      <Text style={[styles.taskTitle, { color: colors.text }]} numberOfLines={1}>{t.title}</Text>
                      {t.deadline && (
                        <View style={styles.taskMeta}>
                          <Clock size={11} color={colors.textMuted} strokeWidth={2} />
                          <Text style={[styles.taskDeadline, { color: colors.textMuted }]}>
                            {new Date(t.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={[styles.priorityChip, { borderColor: priorityColor(t.priority) }]}>
                      <Text style={[styles.priorityChipText, { color: priorityColor(t.priority) }]}>{t.priority}</Text>
                    </View>
                  </View>
                </View>
              ))}
              {todayTasks.length > 4 && (
                <Pressable style={[styles.moreRow, { borderTopWidth: 1, borderTopColor: colors.border }]} onPress={() => router.push('/(tabs)/tasks')}>
                  <Text style={[styles.moreText, { color: colors.accent }]}>+{todayTasks.length - 4} more tasks</Text>
                </Pressable>
              )}
            </GlassCard>
          )}
        </View>

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Upcoming Deadlines</Text>
              <Pressable onPress={() => router.push('/(tabs)/events')} style={styles.seeAllBtn}>
                <Text style={[styles.seeAll, { color: colors.accent }]}>See all</Text>
                <ChevronRight size={14} color={colors.accent} strokeWidth={2} />
              </Pressable>
            </View>
            <GlassCard style={{ backgroundColor: colors.surface, borderColor: colors.border }} padding={0}>
              {upcomingEvents.map((h, idx) => {
                const daysLeft = h.end_date
                  ? Math.ceil((new Date(h.end_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                  : null;
                return (
                  <View key={h.id}>
                    {idx > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                    <View style={styles.eventRow}>
                      <View style={[styles.eventDot, { backgroundColor: daysLeft !== null && daysLeft <= 3 ? Colors.error : Colors.warning }]} />
                      <Text style={[styles.eventName, { color: colors.text }]} numberOfLines={1}>{h.name}</Text>
                      {daysLeft !== null && (
                        <Text style={[styles.eventDays, { color: daysLeft <= 3 ? Colors.error : colors.textMuted }]}>
                          {daysLeft === 0 ? 'Today' : `${daysLeft}d`}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </GlassCard>
          </View>
        )}

        {/* Quick Access */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: Spacing.md }]}>Quick Access</Text>
          <View style={styles.shortcutGrid}>
            {moduleShortcuts.map((m, i) => (
              <Pressable
                key={i}
                style={({ pressed }) => [
                  styles.shortcutCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() => router.push(m.route as any)}
              >
                <View style={[styles.shortcutIcon, { backgroundColor: m.color + '18' }]}>
                  <m.icon size={20} color={m.color} strokeWidth={2} />
                </View>
                <Text style={[styles.shortcutLabel, { color: colors.text }]}>{m.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Focus Timer CTA */}
        <Pressable
          style={[styles.focusCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setPomodoroModal(true)}
        >
          <View style={[styles.focusIcon, { backgroundColor: colors.accent + '18' }]}>
            <Timer size={22} color={colors.accent} strokeWidth={2} />
          </View>
          <View style={styles.focusText}>
            <Text style={[styles.focusTitle, { color: colors.text }]}>Focus Timer</Text>
            <Text style={[styles.focusSub, { color: colors.textMuted }]}>Start a Pomodoro session</Text>
          </View>
          <ChevronRight size={18} color={colors.textMuted} strokeWidth={2} />
        </Pressable>
      </ScrollView>

      {/* Pomodoro Modal */}
      <Modal visible={pomodoroModal} transparent animationType="slide" onRequestClose={() => setPomodoroModal(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setPomodoroModal(false)} />
          <View style={[styles.modalSheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHandle} />
            <Pressable style={styles.modalClose} onPress={() => setPomodoroModal(false)}>
              <X size={20} color={colors.textMuted} strokeWidth={2} />
            </Pressable>
            <PomodoroTimer />
          </View>
        </View>
      </Modal>

      <BadgeAchievement
        visible={!!badgePreview}
        badgeType={badgePreview?.type ?? ''}
        badgeName={badgePreview?.name ?? ''}
        onDismiss={() => setBadgePreview(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.base, paddingTop: Spacing.md },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.lg },
  headerLeft: { flex: 1 },
  headerRight: { flexDirection: 'row', gap: Spacing.sm },
  greetingRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  greeting: { fontSize: Typography.sizes.sm },
  name: { fontSize: Typography.sizes.xxl, fontWeight: Typography.weights.bold, marginBottom: 2 },
  date: { fontSize: Typography.sizes.sm },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Progress Banner
  progressBanner: {
    marginBottom: Spacing.base,
    borderColor: 'transparent',
    borderRadius: Radius.lg,
  },
  progressBannerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  progressBannerTitle: { color: '#fff', fontSize: Typography.sizes.base, fontWeight: Typography.weights.semibold },
  progressBannerSub: { color: 'rgba(255,255,255,0.7)', fontSize: Typography.sizes.sm, marginTop: 2 },
  progressBannerPct: { color: '#fff', fontSize: Typography.sizes.xxxl, fontWeight: Typography.weights.bold },
  progressBannerBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 3, overflow: 'hidden' },
  progressBannerFill: { height: '100%', backgroundColor: '#fff', borderRadius: 3 },

  // Stats Grid
  statsGrid: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg, flexWrap: 'wrap' },
  statCard: { flex: 1, minWidth: '45%', gap: 6 },
  statIconBox: { width: 34, height: 34, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold },
  statLabel: { fontSize: Typography.sizes.xs },

  // Section
  section: { marginBottom: Spacing.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAll: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.medium },

  // Empty state
  emptyState: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm },
  emptyTitle: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.semibold },
  emptySubtitle: { fontSize: Typography.sizes.sm, textAlign: 'center' },

  // Task row
  divider: { height: 1, marginHorizontal: Spacing.base },
  taskRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: 14, gap: Spacing.md },
  taskPriorityDot: { width: 8, height: 8, borderRadius: 4 },
  taskContent: { flex: 1, gap: 3 },
  taskTitle: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.medium },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  taskDeadline: { fontSize: Typography.sizes.xs },
  priorityChip: { borderWidth: 1, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  priorityChipText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.semibold },
  moreRow: { padding: Spacing.md, alignItems: 'center' },
  moreText: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.medium },

  // Event row
  eventRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: 14, gap: Spacing.md },
  eventDot: { width: 8, height: 8, borderRadius: 4 },
  eventName: { flex: 1, fontSize: Typography.sizes.base, fontWeight: Typography.weights.medium },
  eventDays: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold },

  // Shortcuts
  shortcutGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  shortcutCard: {
    width: '30.5%',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    gap: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  shortcutIcon: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  shortcutLabel: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.semibold, textAlign: 'center' },

  // Focus card
  focusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.base,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.base,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  focusIcon: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  focusText: { flex: 1 },
  focusTitle: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.semibold },
  focusSub: { fontSize: Typography.sizes.sm, marginTop: 2 },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalSheet: {
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    borderWidth: 1,
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  modalHandle: { width: 36, height: 4, backgroundColor: Colors.textDim, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.base },
  modalClose: { alignSelf: 'flex-end', padding: Spacing.xs },
});
