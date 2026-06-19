import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Award, Crown, Heart, Activity, Target, BookOpen,
  GraduationCap, Sparkles, Flame, Star, Lock,
} from 'lucide-react-native';
import { useBadges } from '@/hooks/useBadges';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Typography, Spacing, Radius } from '@/constants/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import { BadgeAchievement } from '@/components/feature/BadgeAchievement';
import { BADGE_MILESTONES } from '@/services/badgesService';

const BADGE_ICONS: Record<string, React.ComponentType<any>> = {
  bronze: Award, silver: Award, gold: Award, diamond: Sparkles,
  master: Crown, legend: Star, heart: Heart, focus: Target,
  health: Activity, motivation: Flame, reader: BookOpen, scholar: GraduationCap,
};

const ALL_BADGE_TYPES = [
  ...BADGE_MILESTONES.map(m => ({ type: m.type, name: m.name, description: m.description, module: 'Tasks' })),
  { type: 'heart', name: 'Heart Badge', description: 'Log a happy mood', module: 'Mood' },
  { type: 'focus', name: 'Focus Master', description: '10 Pomodoro sessions', module: 'Focus' },
  { type: 'health', name: 'Fitness Streak', description: '7 exercise sessions', module: 'Exercise' },
  { type: 'reader', name: 'First Book', description: 'Complete your first book', module: 'Books' },
  { type: 'scholar', name: 'Scholar', description: 'Complete 5 books', module: 'Books' },
];

export default function BadgesScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { badges } = useBadges();
  const [preview, setPreview] = useState<{ type: string; name: string } | null>(null);

  const earnedTypes = new Set(badges.map(b => b.type));

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <StatusBar barStyle={colors.text === '#F1F5F9' ? 'light-content' : 'dark-content'} />
      <ScreenHeader title="Badges" subtitle={`${badges.length} earned`} showBack />

      <ScrollView contentContainerStyle={{ padding: Spacing.base, paddingBottom: insets.bottom + 40, gap: Spacing.lg }}>

        {/* Earned History */}
        {badges.length > 0 && (
          <GlassCard style={{ backgroundColor: colors.surface, borderColor: colors.border, gap: 0 }} padding={0}>
            <Text style={[styles.sectionTitle, { color: colors.text, padding: Spacing.base, paddingBottom: Spacing.sm }]}>Earned Badges</Text>
            {badges.map((b, idx) => {
              const BadgeIcon = BADGE_ICONS[b.type] ?? Award;
              const badgeColor = colors.badge[b.type] ?? colors.accent;
              return (
                <Pressable
                  key={b.id}
                  style={[styles.historyRow, { borderTopWidth: idx > 0 ? 1 : 0, borderTopColor: colors.border }]}
                  onPress={() => setPreview({ type: b.type, name: b.name })}
                >
                  <View style={[styles.badgeIconBox, { backgroundColor: badgeColor + '18' }]}>
                    <BadgeIcon size={22} color={badgeColor} strokeWidth={2} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.badgeName, { color: colors.text }]}>{b.name}</Text>
                    <Text style={[styles.badgeMeta, { color: colors.textMuted }]}>
                      {b.module} · {new Date(b.earned_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                  </View>
                  <View style={[styles.earnedDot, { backgroundColor: colors.badge[b.type] ?? colors.accent }]} />
                </Pressable>
              );
            })}
          </GlassCard>
        )}

        {/* All Badges Grid */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>All Achievements</Text>
        <View style={styles.grid}>
          {ALL_BADGE_TYPES.map(b => {
            const earned = earnedTypes.has(b.type);
            const BadgeIcon = BADGE_ICONS[b.type] ?? Award;
            const badgeColor = colors.badge[b.type] ?? colors.accent;
            return (
              <Pressable
                key={b.type}
                style={[
                  styles.gridItem,
                  { backgroundColor: colors.surface, borderColor: earned ? badgeColor + '40' : colors.border },
                  !earned && styles.locked,
                ]}
                onPress={() => earned && setPreview({ type: b.type, name: b.name })}
              >
                <View style={[styles.gridIcon, { backgroundColor: earned ? badgeColor + '18' : colors.surfaceLight }]}>
                  {earned
                    ? <BadgeIcon size={26} color={badgeColor} strokeWidth={2} />
                    : <Lock size={20} color={colors.textDim} strokeWidth={2} />
                  }
                </View>
                <Text style={[styles.gridName, { color: earned ? colors.text : colors.textDim }]} numberOfLines={1}>{b.name}</Text>
                <Text style={[styles.gridDesc, { color: colors.textMuted }]} numberOfLines={2}>{b.description}</Text>
                {!earned && (
                  <Text style={[styles.lockedLabel, { color: colors.textDim }]}>Locked</Text>
                )}
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
  sectionTitle: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold, marginBottom: Spacing.md },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: 14,
  },
  badgeIconBox: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  badgeName: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.semibold },
  badgeMeta: { fontSize: Typography.sizes.xs, marginTop: 2 },
  earnedDot: { width: 8, height: 8, borderRadius: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  gridItem: {
    width: '30.5%',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  locked: { opacity: 0.55 },
  gridIcon: { width: 52, height: 52, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  gridName: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.semibold, textAlign: 'center' },
  gridDesc: { fontSize: 10, textAlign: 'center', lineHeight: 14 },
  lockedLabel: { fontSize: 9, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
});
