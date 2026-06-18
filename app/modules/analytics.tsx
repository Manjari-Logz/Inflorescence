import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, StatusBar, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/template';
import { useStudy } from '@/hooks/useStudy';
import { useBooks } from '@/hooks/useModules';
import { useGoals } from '@/hooks/useGoals';
import { useMood } from '@/hooks/useMood';
import { usePlacement } from '@/hooks/useModules';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Typography, Spacing, Radius } from '@/constants/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { analyticsService } from '@/services/analyticsService';
import { MOOD_OPTIONS } from '@/services/moodService';

const chartWidth = Dimensions.get('window').width - 64;

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { user } = useAuth();
  const { domains } = useStudy();
  const { books } = useBooks();
  const { shortGoals, longGoals, dreams } = useGoals();
  const { recentMoods } = useMood();
  const { companies } = usePlacement();
  const [pomodoro, setPomodoro] = useState({ sessions: 0, totalMinutes: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      analyticsService.fetchPomodoroStats(user.id).then(setPomodoro).finally(() => setLoading(false));
    }
  }, [user]);

  const study = analyticsService.computeStudyAnalytics(domains);
  const reading = analyticsService.computeReadingAnalytics(books);
  const goals = analyticsService.computeGoalAnalytics(shortGoals, longGoals, dreams);
  const mood = analyticsService.computeMoodAnalytics(recentMoods);
  const placement = analyticsService.computePlacementAnalytics(companies);

  const moodChartData = {
    labels: MOOD_OPTIONS.map(m => m.emoji),
    datasets: [{ data: MOOD_OPTIONS.map(m => mood.distribution[m.label] ?? 0) }],
  };

  const chartConfig = {
    backgroundColor: colors.surface,
    backgroundGradientFrom: colors.surfaceLight,
    backgroundGradientTo: colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(41, 182, 246, ${opacity})`,
    labelColor: () => colors.textMuted,
    style: { borderRadius: Radius.lg },
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <StatusBar barStyle={colors.text === '#FFFFFF' ? 'light-content' : 'dark-content'} />
      <ScreenHeader title="Analytics" subtitle="Your growth insights" showBack />

      {loading ? <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} /> : (
        <ScrollView contentContainerStyle={{ padding: Spacing.base, paddingBottom: insets.bottom + 40, gap: Spacing.md }}>
          <GlassCard style={{ backgroundColor: colors.glass, borderColor: colors.border, gap: Spacing.sm }}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>📚 Study Analytics</Text>
            <View style={styles.statRow}>
              <Stat label="Domains" value={study.domains} colors={colors} />
              <Stat label="Subjects" value={study.totalSubjects} colors={colors} />
              <Stat label="Resources" value={study.totalResources} colors={colors} />
              <Stat label="Hours" value={study.totalHours} colors={colors} />
            </View>
          </GlassCard>

          <GlassCard style={{ backgroundColor: colors.glass, borderColor: colors.border, gap: Spacing.sm }}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>📖 Reading Analytics</Text>
            <View style={styles.statRow}>
              <Stat label="Books" value={reading.totalBooks} colors={colors} />
              <Stat label="Completed" value={reading.completed} colors={colors} />
              <Stat label="Pages" value={reading.pagesRead} colors={colors} />
            </View>
            <ProgressBar progress={reading.progress} color={colors.accent} height={6} />
            <Text style={[styles.progressLabel, { color: colors.textMuted }]}>{reading.progress}% reading progress</Text>
          </GlassCard>

          <GlassCard style={{ backgroundColor: colors.glass, borderColor: colors.border, gap: Spacing.sm }}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>🎯 Goal Analytics</Text>
            <View style={styles.statRow}>
              <Stat label="Short Goals" value={`${goals.shortCompleted}/${goals.shortTotal}`} colors={colors} />
              <Stat label="Long Goals" value={goals.longTotal} colors={colors} />
              <Stat label="Dreams" value={goals.dreams} colors={colors} />
            </View>
            <ProgressBar progress={goals.shortTotal > 0 ? (goals.shortCompleted / goals.shortTotal) * 100 : 0} color={colors.primaryLight} height={6} />
          </GlassCard>

          <GlassCard style={{ backgroundColor: colors.glass, borderColor: colors.border, gap: Spacing.sm }}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>😊 Mood Analytics</Text>
            <View style={styles.statRow}>
              <Stat label="Entries" value={mood.entries} colors={colors} />
              <Stat label="Avg Score" value={mood.avgScore} colors={colors} />
            </View>
            {mood.entries > 0 ? (
              <BarChart data={moodChartData} width={chartWidth} height={180} chartConfig={chartConfig} style={{ borderRadius: Radius.lg }} yAxisLabel="" yAxisSuffix="" fromZero />
            ) : null}
          </GlassCard>

          <GlassCard style={{ backgroundColor: colors.glass, borderColor: colors.border, gap: Spacing.sm }}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>💼 Placement Analytics</Text>
            <View style={styles.statRow}>
              <Stat label="Companies" value={placement.total} colors={colors} />
              <Stat label="Offers" value={placement.offers} colors={colors} />
              <Stat label="Response" value={`${placement.responseRate}%`} colors={colors} />
            </View>
          </GlassCard>

          <GlassCard style={{ backgroundColor: colors.glass, borderColor: colors.border, gap: Spacing.sm }}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>🍅 Focus Analytics</Text>
            <View style={styles.statRow}>
              <Stat label="Sessions" value={pomodoro.sessions} colors={colors} />
              <Stat label="Minutes" value={pomodoro.totalMinutes} colors={colors} />
            </View>
          </GlassCard>
        </ScrollView>
      )}
    </View>
  );
}

function Stat({ label, value, colors }: { label: string; value: string | number; colors: ReturnType<typeof useAppTheme>['colors'] }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color: colors.accent }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  cardTitle: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.lg, fontWeight: '700' },
  statRow: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  statValue: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.xl, fontWeight: '700' },
  statLabel: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.xs },
  progressLabel: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.sm, textAlign: 'center' },
});
