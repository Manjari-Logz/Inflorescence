import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Modal,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth, useAlert } from '@/template';
import { useTasks } from '@/hooks/useTasks';
import { useBadges } from '@/hooks/useBadges';
import { useMood } from '@/hooks/useMood';
import { useEvents } from '@/hooks/useEvents';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { BadgePill } from '@/components/ui/BadgePill';
import { MoodPicker } from '@/components/feature/MoodPicker';
import { PomodoroTimer } from '@/components/feature/PomodoroTimer';
import { MOOD_OPTIONS, MOTIVATIONAL_QUOTES, moodService } from '@/services/moodService';
import { BADGE_EMOJIS } from '@/services/badgesService';

const QUOTE = moodService.getRandomQuote();

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { tasks } = useTasks();
  const { badges } = useBadges();
  const { todayMood, setMood } = useMood();
  const { hackathons } = useEvents();
  const { showAlert } = useAlert();
  const [moodModal, setMoodModal] = useState(false);
  const [pomodoroModal, setPomodoroModal] = useState(false);

  const today = new Date();
  const greeting = today.getHours() < 12 ? 'Good Morning' : today.getHours() < 17 ? 'Good Afternoon' : 'Good Evening';
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const todayTasks = tasks.filter(t => {
    if (t.completed) return false;
    if (!t.deadline) return false;
    const d = new Date(t.deadline);
    return d.toDateString() === today.toDateString();
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

  const recentBadges = badges.slice(0, 4);
  const moodOption = MOOD_OPTIONS.find(m => m.label === todayMood?.mood);
  const isSad = todayMood && (todayMood.mood === 'Sad' || todayMood.mood === 'Very Sad');

  const handleMoodSelect = async (mood: string, score: number) => {
    await setMood(mood, score);
    setMoodModal(false);
    if (score >= 4) {
      showAlert('Great vibes! 😀', 'Keep that positive energy flowing! You earned a Heart Badge!');
    } else if (score <= 2) {
      showAlert(`${QUOTE.quote}`, `— ${QUOTE.author}`);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting} 👋</Text>
            <Text style={styles.name}>{user?.username ?? user?.email?.split('@')[0] ?? 'Champion'}</Text>
            <Text style={styles.date}>{dateStr}</Text>
          </View>
          <Pressable style={styles.avatarBtn} onPress={() => setMoodModal(true)}>
            <Text style={styles.avatarEmoji}>{moodOption ? moodOption.emoji : '😐'}</Text>
          </Pressable>
        </View>

        {/* Mood Banner */}
        {!todayMood ? (
          <Pressable onPress={() => setMoodModal(true)} style={styles.moodBanner}>
            <Text style={styles.moodBannerEmoji}>🌟</Text>
            <View style={styles.moodBannerText}>
              <Text style={styles.moodBannerTitle}>How are you feeling today?</Text>
              <Text style={styles.moodBannerSub}>Tap to log your mood</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={Colors.accent} />
          </Pressable>
        ) : isSad ? (
          <GlassCard style={styles.quoteCard}>
            <Text style={styles.quoteIcon}>💙</Text>
            <Text style={styles.quoteText}>"{QUOTE.quote}"</Text>
            <Text style={styles.quoteAuthor}>— {QUOTE.author}</Text>
          </GlassCard>
        ) : null}

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <GlassCard style={styles.statCard}>
            <Text style={styles.statNumber}>{completedToday.length}</Text>
            <Text style={styles.statLabel}>Done Today</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <Text style={styles.statNumber}>{todayTasks.length}</Text>
            <Text style={styles.statLabel}>Due Today</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <Text style={styles.statNumber}>{badges.length}</Text>
            <Text style={styles.statLabel}>Badges</Text>
          </GlassCard>
        </View>

        {/* Overall Progress */}
        <GlassCard style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Overall Progress</Text>
            <Text style={styles.sectionValue}>{completionRate}%</Text>
          </View>
          <ProgressBar progress={completionRate} color={Colors.accent} height={8} />
          <Text style={styles.progressSub}>{completedTasks} of {totalTasks} tasks completed</Text>
        </GlassCard>

        {/* Today's Tasks */}
        <GlassCard style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Due Today</Text>
            <View style={styles.countPill}>
              <Text style={styles.countText}>{todayTasks.length}</Text>
            </View>
          </View>
          {todayTasks.length === 0 ? (
            <View style={styles.emptySmall}>
              <Text style={styles.emptySmallText}>All clear for today! 🎉</Text>
            </View>
          ) : (
            todayTasks.slice(0, 3).map(t => (
              <View key={t.id} style={styles.taskRow}>
                <View style={[styles.taskDot, { backgroundColor: Colors.priority[t.priority] ?? Colors.accent }]} />
                <Text style={styles.taskTitle} numberOfLines={1}>{t.title}</Text>
                <View style={[styles.priorityBadge, { borderColor: Colors.priority[t.priority] }]}>
                  <Text style={[styles.priorityText, { color: Colors.priority[t.priority] }]}>{t.priority}</Text>
                </View>
              </View>
            ))
          )}
          {todayTasks.length > 3 ? (
            <Text style={styles.moreText}>+{todayTasks.length - 3} more tasks</Text>
          ) : null}
        </GlassCard>

        {/* Badge Showcase */}
        {recentBadges.length > 0 ? (
          <GlassCard style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Recent Badges</Text>
            <View style={styles.badgeRow}>
              {recentBadges.map(b => (
                <BadgePill key={b.id} type={b.type} name={b.name} size="md" />
              ))}
            </View>
          </GlassCard>
        ) : (
          <GlassCard style={styles.sectionCard} glow>
            <Text style={styles.sectionTitle}>Your Badge Journey</Text>
            <Text style={styles.badgeHint}>Complete 10 tasks to earn your first 🥉 Bronze Badge!</Text>
            <ProgressBar progress={Math.min(100, (completedTasks / 10) * 100)} color={Colors.badge.bronze} height={6} />
            <Text style={styles.progressSub}>{completedTasks}/10 tasks to Bronze</Text>
          </GlassCard>
        )}

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 ? (
          <GlassCard style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
            {upcomingEvents.map(h => (
              <View key={h.id} style={styles.eventRow}>
                <MaterialIcons name="event" size={16} color={Colors.accent} />
                <Text style={styles.eventName} numberOfLines={1}>{h.name}</Text>
                {h.end_date ? (
                  <Text style={styles.eventDate}>
                    {new Date(h.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                ) : null}
              </View>
            ))}
          </GlassCard>
        ) : null}

        {/* Pomodoro Quick Start */}
        <Pressable style={styles.pomodoroBtn} onPress={() => setPomodoroModal(true)}>
          <MaterialIcons name="timer" size={20} color={Colors.accent} />
          <Text style={styles.pomodoroBtnText}>Open Pomodoro Timer</Text>
          <MaterialIcons name="chevron-right" size={20} color={Colors.accent} />
        </Pressable>
      </ScrollView>

      {/* Mood Modal */}
      <Modal visible={moodModal} transparent animationType="fade" onRequestClose={() => setMoodModal(false)}>
        <Pressable style={styles.overlay} onPress={() => setMoodModal(false)}>
          <Pressable style={styles.modalCard} onPress={e => e.stopPropagation()}>
            <Text style={styles.modalTitle}>How are you feeling?</Text>
            <Text style={styles.modalSub}>Track your daily mood journey</Text>
            <MoodPicker selected={todayMood?.mood} onSelect={handleMoodSelect} />
          </Pressable>
        </Pressable>
      </Modal>

      {/* Pomodoro Modal */}
      <Modal visible={pomodoroModal} transparent animationType="slide" onRequestClose={() => setPomodoroModal(false)}>
        <Pressable style={styles.overlay} onPress={() => setPomodoroModal(false)}>
          <Pressable style={styles.modalCard} onPress={e => e.stopPropagation()}>
            <Pressable style={styles.closeBtn} onPress={() => setPomodoroModal(false)}>
              <MaterialIcons name="close" size={22} color={Colors.textMuted} />
            </Pressable>
            <PomodoroTimer />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Spacing.base, paddingTop: Spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.lg },
  greeting: { color: Colors.textMuted, fontFamily: 'Arial', fontSize: Typography.sizes.sm },
  name: { color: Colors.text, fontFamily: 'Arial', fontSize: Typography.sizes.xxl, fontWeight: '700', marginTop: 2 },
  date: { color: Colors.textMuted, fontFamily: 'Arial', fontSize: Typography.sizes.sm, marginTop: 2 },
  avatarBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.surfaceLight, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  avatarEmoji: { fontSize: 26 },
  moodBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(41,182,246,0.08)', borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.accent, padding: Spacing.base, marginBottom: Spacing.base, gap: Spacing.md },
  moodBannerEmoji: { fontSize: 28 },
  moodBannerText: { flex: 1 },
  moodBannerTitle: { color: Colors.text, fontFamily: 'Arial', fontSize: Typography.sizes.base, fontWeight: '600' },
  moodBannerSub: { color: Colors.textMuted, fontFamily: 'Arial', fontSize: Typography.sizes.sm, marginTop: 2 },
  quoteCard: { marginBottom: Spacing.base, gap: Spacing.sm },
  quoteIcon: { fontSize: 24 },
  quoteText: { color: Colors.textSecondary, fontFamily: 'Arial', fontSize: Typography.sizes.base, fontStyle: 'italic', lineHeight: 22 },
  quoteAuthor: { color: Colors.textMuted, fontFamily: 'Arial', fontSize: Typography.sizes.sm, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.base },
  statCard: { flex: 1, alignItems: 'center', padding: Spacing.md },
  statNumber: { color: Colors.accent, fontFamily: 'Arial', fontSize: Typography.sizes.xxl, fontWeight: '700' },
  statLabel: { color: Colors.textMuted, fontFamily: 'Arial', fontSize: Typography.sizes.xs, marginTop: 2 },
  sectionCard: { marginBottom: Spacing.base, gap: Spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { color: Colors.text, fontFamily: 'Arial', fontSize: Typography.sizes.lg, fontWeight: '700' },
  sectionValue: { color: Colors.accent, fontFamily: 'Arial', fontSize: Typography.sizes.lg, fontWeight: '700' },
  progressSub: { color: Colors.textMuted, fontFamily: 'Arial', fontSize: Typography.sizes.sm },
  countPill: { backgroundColor: Colors.surfaceLighter, paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full },
  countText: { color: Colors.accent, fontFamily: 'Arial', fontSize: Typography.sizes.sm, fontWeight: '700' },
  emptySmall: { paddingVertical: Spacing.sm },
  emptySmallText: { color: Colors.textMuted, fontFamily: 'Arial', fontSize: Typography.sizes.base, textAlign: 'center' },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xs },
  taskDot: { width: 8, height: 8, borderRadius: 4 },
  taskTitle: { flex: 1, color: Colors.text, fontFamily: 'Arial', fontSize: Typography.sizes.base },
  priorityBadge: { borderWidth: 1, borderRadius: Radius.full, paddingHorizontal: 6, paddingVertical: 1 },
  priorityText: { fontFamily: 'Arial', fontSize: Typography.sizes.xs, fontWeight: '600' },
  moreText: { color: Colors.textMuted, fontFamily: 'Arial', fontSize: Typography.sizes.sm, textAlign: 'center' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  badgeHint: { color: Colors.textMuted, fontFamily: 'Arial', fontSize: Typography.sizes.sm },
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xs },
  eventName: { flex: 1, color: Colors.text, fontFamily: 'Arial', fontSize: Typography.sizes.base },
  eventDate: { color: Colors.textMuted, fontFamily: 'Arial', fontSize: Typography.sizes.sm },
  pomodoroBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceLight, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.base, gap: Spacing.md, marginBottom: Spacing.base },
  pomodoroBtnText: { flex: 1, color: Colors.text, fontFamily: 'Arial', fontSize: Typography.sizes.base, fontWeight: '600' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: Spacing.base },
  modalCard: { backgroundColor: Colors.surface, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border, padding: Spacing.xl, width: '100%', gap: Spacing.md },
  modalTitle: { color: Colors.text, fontFamily: 'Arial', fontSize: Typography.sizes.xl, fontWeight: '700' },
  modalSub: { color: Colors.textMuted, fontFamily: 'Arial', fontSize: Typography.sizes.sm },
  closeBtn: { alignSelf: 'flex-end', padding: Spacing.xs },
});
