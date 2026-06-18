import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBadges } from '@/hooks/useBadges';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Typography, Spacing, Radius } from '@/constants/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import { BADGE_EMOJIS, BADGE_IMAGES, BADGE_MILESTONES } from '@/services/badgesService';
import { BadgeAchievement } from '@/components/feature/BadgeAchievement';

export default function BadgesScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { badges } = useBadges();
  const [preview, setPreview] = useState<{ type: string; name: string } | null>(null);

  const earnedTypes = new Set(badges.map(b => b.type));
  const allBadgeTypes = [
    ...BADGE_MILESTONES.map(m => ({ type: m.type, name: m.name, description: m.description, module: 'tasks' })),
    { type: 'heart', name: 'Heart Badge', description: 'Log a happy mood', module: 'mood' },
    { type: 'focus', name: 'Focus Master', description: '10 Pomodoro sessions', module: 'pomodoro' },
    { type: 'health', name: 'Fitness Streak', description: '7 exercise sessions', module: 'exercise' },
    { type: 'reader', name: 'First Book', description: 'Complete your first book', module: 'books' },
    { type: 'scholar', name: 'Scholar', description: 'Complete 5 books', module: 'books' },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <StatusBar barStyle={colors.text === '#FFFFFF' ? 'light-content' : 'dark-content'} />
      <ScreenHeader title="Badge Collection" subtitle={`${badges.length} earned`} showBack />

      <ScrollView contentContainerStyle={{ padding: Spacing.base, paddingBottom: insets.bottom + 40, gap: Spacing.lg }}>
        <GlassCard style={{ backgroundColor: colors.glass, borderColor: colors.border }}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Achievement History</Text>
          {badges.length === 0 ? (
            <Text style={[styles.empty, { color: colors.textMuted }]}>Complete tasks and activities to earn badges!</Text>
          ) : badges.map(b => {
            const img = BADGE_IMAGES[b.type];
            return (
              <Pressable key={b.id} style={[styles.historyRow, { borderBottomColor: colors.borderLight }]} onPress={() => setPreview({ type: b.type, name: b.name })}>
                <LinearGradient colors={img?.gradient ?? [colors.primary, colors.accent]} style={styles.badgeIcon}>
                  <Text style={styles.badgeEmoji}>{BADGE_EMOJIS[b.type] ?? '🏅'}</Text>
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.badgeName, { color: colors.text }]}>{b.name}</Text>
                  <Text style={[styles.badgeModule, { color: colors.textMuted }]}>{b.module} · {new Date(b.earned_at).toLocaleDateString()}</Text>
                </View>
              </Pressable>
            );
          })}
        </GlassCard>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>All Badges</Text>
        <View style={styles.grid}>
          {allBadgeTypes.map(b => {
            const earned = earnedTypes.has(b.type);
            const img = BADGE_IMAGES[b.type];
            return (
              <Pressable key={b.type} style={[styles.gridItem, { opacity: earned ? 1 : 0.4 }]} onPress={() => earned && setPreview({ type: b.type, name: b.name })}>
                <LinearGradient colors={img?.gradient ?? [colors.surfaceLight, colors.surface]} style={[styles.gridBadge, { borderColor: earned ? (colors.badge[b.type] ?? colors.accent) : colors.border }]}>
                  <Text style={styles.gridEmoji}>{BADGE_EMOJIS[b.type] ?? '🏅'}</Text>
                </LinearGradient>
                <Text style={[styles.gridName, { color: colors.textSecondary }]} numberOfLines={1}>{b.name}</Text>
                {!earned ? <Text style={[styles.locked, { color: colors.textDim }]}>Locked</Text> : null}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <BadgeAchievement
        visible={!!preview}
        badgeType={preview?.type ?? ''}
        badgeName={preview?.name ?? ''}
        onDismiss={() => setPreview(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  sectionTitle: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.lg, fontWeight: '700', marginBottom: Spacing.md },
  empty: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.base, textAlign: 'center', padding: Spacing.lg },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md, borderBottomWidth: 1 },
  badgeIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  badgeEmoji: { fontSize: 24 },
  badgeName: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.base, fontWeight: '600' },
  badgeModule: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.xs },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, justifyContent: 'space-between' },
  gridItem: { width: '30%', alignItems: 'center', gap: Spacing.xs },
  gridBadge: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  gridEmoji: { fontSize: 28 },
  gridName: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.xs, textAlign: 'center' },
  locked: { fontFamily: Typography.fontFamily, fontSize: 9 },
});
