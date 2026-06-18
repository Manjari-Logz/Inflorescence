import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth, useAlert } from '@/template';
import { useTasks } from '@/hooks/useTasks';
import { useBadges } from '@/hooks/useBadges';
import { useMood } from '@/hooks/useMood';
import { useGoals } from '@/hooks/useGoals';
import { useEvents } from '@/hooks/useEvents';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { BadgePill } from '@/components/ui/BadgePill';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { BADGE_MILESTONES, BADGE_EMOJIS } from '@/services/badgesService';
import { MOOD_OPTIONS } from '@/services/moodService';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { showAlert } = useAlert();
  const { tasks } = useTasks();
  const { badges } = useBadges();
  const { recentMoods } = useMood();
  const { shortGoals, longGoals, dreams } = useGoals();
  const { hackathons } = useEvents();

  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const completedGoals = shortGoals.filter(g => g.completed).length;

  // Badge progress
  const nextMilestone = BADGE_MILESTONES.find(m => m.count > completedTasks);
  const prevMilestone = BADGE_MILESTONES.filter(m => m.count <= completedTasks).pop();
  const badgeProgress = nextMilestone
    ? ((completedTasks - (prevMilestone?.count ?? 0)) / (nextMilestone.count - (prevMilestone?.count ?? 0))) * 100
    : 100;

  // Badge counts by type
  const badgeCounts: Record<string, number> = {};
  badges.forEach(b => { badgeCounts[b.type] = (badgeCounts[b.type] ?? 0) + 1; });

  // Mood trend
  const moodTrend = recentMoods.slice(0, 7).reverse();

  const handleLogout = () => {
    showAlert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const displayName = user?.username ?? user?.email?.split('@')[0] ?? 'Champion';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <GlassCard style={styles.profileCard} glow>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
          <Text style={styles.profileName}>{displayName}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>
              {completedTasks >= 1000 ? '🌟 Legend' :
               completedTasks >= 500 ? '👑 Master' :
               completedTasks >= 250 ? '💎 Diamond' :
               completedTasks >= 100 ? '🥇 Gold' :
               completedTasks >= 50 ? '🥈 Silver' :
               completedTasks >= 10 ? '🥉 Bronze' : '🌱 Beginner'}
            </Text>
          </View>
        </GlassCard>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {[
            { label: 'Tasks Done', value: completedTasks, icon: 'check-circle', color: Colors.success },
            { label: 'Total Tasks', value: totalTasks, icon: 'list', color: Colors.accent },
            { label: 'Badges', value: badges.length, icon: 'military-tech', color: Colors.badge.gold },
            { label: 'Goals Set', value: shortGoals.length + longGoals.length, icon: 'flag', color: Colors.primaryLight },
            { label: 'Dreams', value: dreams.length, icon: 'auto-awesome', color: Colors.badge.master },
            { label: 'Events', value: hackathons.length, icon: 'event', color: Colors.warning },
          ].map(s => (
            <GlassCard key={s.label} style={styles.statCard}>
              <MaterialIcons name={s.icon as any} size={22} color={s.color} />
              <Text style={[styles.statNumber, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </GlassCard>
          ))}
        </View>

        {/* Badge Progress */}
        <GlassCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Badge Journey</Text>
          {nextMilestone ? (
            <>
              <View style={styles.badgeProgressRow}>
                <Text style={styles.badgeProgressText}>
                  {completedTasks} / {nextMilestone.count} tasks → {nextMilestone.name}
                </Text>
                <Text style={styles.badgeProgressNext}>{BADGE_EMOJIS[nextMilestone.type]}</Text>
              </View>
              <ProgressBar progress={badgeProgress} color={Colors.badge[nextMilestone.type] ?? Colors.accent} height={8} />
              <Text style={styles.badgeProgressSub}>
                {nextMilestone.count - completedTasks} more tasks to unlock {nextMilestone.name}!
              </Text>
            </>
          ) : (
            <Text style={styles.legendText}>🌟 You have reached Legend status!</Text>
          )}
        </GlassCard>

        {/* Badge Showcase */}
        {badges.length > 0 ? (
          <GlassCard style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>My Achievements ({badges.length})</Text>
            <View style={styles.badgesGrid}>
              {Object.entries(badgeCounts).map(([type, count]) => (
                <View key={type} style={styles.badgeItem}>
                  <BadgePill type={type} size="lg" />
                  {count > 1 ? <Text style={styles.badgeCount}>x{count}</Text> : null}
                </View>
              ))}
            </View>
            <Text style={styles.latestBadgeLabel}>Latest Earned</Text>
            <View style={styles.latestBadgesRow}>
              {badges.slice(0, 5).map(b => (
                <View key={b.id} style={styles.latestBadge}>
                  <Text style={styles.latestBadgeEmoji}>{BADGE_EMOJIS[b.type] ?? '🏅'}</Text>
                  <Text style={styles.latestBadgeName} numberOfLines={1}>{b.name}</Text>
                  <Text style={styles.latestBadgeModule}>{b.module}</Text>
                </View>
              ))}
            </View>
          </GlassCard>
        ) : (
          <GlassCard style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>My Achievements</Text>
            <Text style={styles.noBadgesText}>Complete 10 tasks to earn your first badge! 🏅</Text>
          </GlassCard>
        )}

        {/* Mood Trend */}
        {moodTrend.length > 0 ? (
          <GlassCard style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Mood Trend (Last 7 Days)</Text>
            <View style={styles.moodTrendRow}>
              {moodTrend.map(m => {
                const opt = MOOD_OPTIONS.find(o => o.label === m.mood);
                return (
                  <View key={m.id} style={styles.moodTrendItem}>
                    <Text style={styles.moodTrendEmoji}>{opt?.emoji ?? '😐'}</Text>
                    <Text style={styles.moodTrendDate}>
                      {new Date(m.date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </Text>
                  </View>
                );
              })}
            </View>
          </GlassCard>
        ) : null}

        {/* Overall Progress */}
        <GlassCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Overall Progress</Text>
          <View style={styles.progressItem}>
            <Text style={styles.progressItemLabel}>Task Completion</Text>
            <Text style={styles.progressItemValue}>{completionRate}%</Text>
          </View>
          <ProgressBar progress={completionRate} color={Colors.accent} height={6} />
          <View style={styles.progressItem} style={{ marginTop: Spacing.md }}>
            <Text style={styles.progressItemLabel}>Goals Completed</Text>
            <Text style={styles.progressItemValue}>{completedGoals}/{shortGoals.length}</Text>
          </View>
          <ProgressBar progress={shortGoals.length > 0 ? (completedGoals / shortGoals.length) * 100 : 0} color={Colors.primaryLight} height={6} />
        </GlassCard>

        {/* Sign Out */}
        <PrimaryButton
          title="Sign Out"
          onPress={handleLogout}
          variant="danger"
          style={styles.signOutBtn}
        />
        <Text style={styles.versionText}>Inflorescence v1.0 · Your Personal Life OS</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Spacing.base, paddingTop: Spacing.md },
  profileCard: { alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.lg },
  avatarLarge: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(41,182,246,0.15)', borderWidth: 2, borderColor: Colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { color: Colors.accent, fontFamily: 'Arial', fontSize: Typography.sizes.xxl, fontWeight: '700' },
  profileName: { color: Colors.text, fontFamily: 'Arial', fontSize: Typography.sizes.xl, fontWeight: '700' },
  profileEmail: { color: Colors.textMuted, fontFamily: 'Arial', fontSize: Typography.sizes.sm },
  levelBadge: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xs, borderRadius: Radius.full, backgroundColor: 'rgba(41,182,246,0.12)', borderWidth: 1, borderColor: Colors.border },
  levelText: { color: Colors.accent, fontFamily: 'Arial', fontSize: Typography.sizes.base, fontWeight: '700' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  statCard: { width: '30.5%', alignItems: 'center', padding: Spacing.md, gap: Spacing.xs },
  statNumber: { fontFamily: 'Arial', fontSize: Typography.sizes.xl, fontWeight: '700' },
  statLabel: { color: Colors.textMuted, fontFamily: 'Arial', fontSize: Typography.sizes.xs, textAlign: 'center' },
  sectionCard: { marginBottom: Spacing.md, gap: Spacing.md },
  sectionTitle: { color: Colors.text, fontFamily: 'Arial', fontSize: Typography.sizes.lg, fontWeight: '700' },
  badgeProgressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badgeProgressText: { color: Colors.textSecondary, fontFamily: 'Arial', fontSize: Typography.sizes.sm },
  badgeProgressNext: { fontSize: 24 },
  badgeProgressSub: { color: Colors.textMuted, fontFamily: 'Arial', fontSize: Typography.sizes.sm },
  legendText: { color: Colors.badge.legend, fontFamily: 'Arial', fontSize: Typography.sizes.base, fontWeight: '700', textAlign: 'center', padding: Spacing.sm },
  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  badgeItem: { alignItems: 'center', gap: Spacing.xs },
  badgeCount: { color: Colors.textMuted, fontFamily: 'Arial', fontSize: Typography.sizes.xs, fontWeight: '600' },
  latestBadgeLabel: { color: Colors.textMuted, fontFamily: 'Arial', fontSize: Typography.sizes.sm, fontWeight: '600' },
  latestBadgesRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  latestBadge: { alignItems: 'center', width: 56, gap: 2 },
  latestBadgeEmoji: { fontSize: 28 },
  latestBadgeName: { color: Colors.textSecondary, fontFamily: 'Arial', fontSize: 9, textAlign: 'center' },
  latestBadgeModule: { color: Colors.textDim, fontFamily: 'Arial', fontSize: 9 },
  noBadgesText: { color: Colors.textMuted, fontFamily: 'Arial', fontSize: Typography.sizes.base, textAlign: 'center', padding: Spacing.sm },
  moodTrendRow: { flexDirection: 'row', justifyContent: 'space-between' },
  moodTrendItem: { alignItems: 'center', gap: Spacing.xs },
  moodTrendEmoji: { fontSize: 22 },
  moodTrendDate: { color: Colors.textMuted, fontFamily: 'Arial', fontSize: Typography.sizes.xs },
  progressItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressItemLabel: { color: Colors.textSecondary, fontFamily: 'Arial', fontSize: Typography.sizes.sm },
  progressItemValue: { color: Colors.accent, fontFamily: 'Arial', fontSize: Typography.sizes.sm, fontWeight: '700' },
  signOutBtn: { width: '100%', marginTop: Spacing.sm, marginBottom: Spacing.sm },
  versionText: { color: Colors.textDim, fontFamily: 'Arial', fontSize: Typography.sizes.xs, textAlign: 'center', marginBottom: Spacing.base },
});
