import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, StatusBar, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookOpen, Target, Smile, Briefcase, Timer } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useStudy } from '@/hooks/useStudy';
import { useBooks, usePlacement } from '@/hooks/useModules';
import { useGoals } from '@/hooks/useGoals';
import { useMood } from '@/hooks/useMood';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useSafeTabBarHeight } from '@/hooks/useSafeTabBarHeight';
import { Typography, Spacing, Radius } from '@/constants/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { analyticsService } from '@/services/analyticsService';
import { MOOD_OPTIONS } from '@/services/moodService';

const chartWidth = Dimensions.get('window').width - 64;

function StatRow({ items, colors }: { items: { label: string; value: string | number }[]; colors: any }) {
  return (
    <View style={styles.statRow}>
      {items.map((s, i) => (
        <View key={i} style={styles.stat}>
          <Text style={[styles.statValue, { color: colors.accent }]}>{s.value}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>{s.label}</Text>
        </View>
      ))}
    </View>
  );
}

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useSafeTabBarHeight();
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
  const mood = analyticsService.computeMoodAnalytics(recentMoods.map(m => ({ mood: m.mood, score: m.mood_score })));
  const placement = analyticsService.computePlacementAnalytics(companies);

  const moodChartData = {
    labels: MOOD_OPTIONS.map(m => m.label.slice(0, 3)),
    datasets: [{ data: MOOD_OPTIONS.map(m => mood.distribution[m.label] ?? 0) }],
  };

  const chartConfig = {
    backgroundColor: '#091535',
    backgroundGradientFrom: '#000B29',
    backgroundGradientTo: '#091535',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: () => '#94A3B8',
    style: { borderRadius: Radius.lg },
    barPercentage: 0.6,
  };

  const sections = [
    {
      title: 'Study',
      icon: BookOpen,
      color: colors.accent,
      stats: [
        { label: 'Domains', value: study.domains },
        { label: 'Subjects', value: study.totalSubjects },
        { label: 'Resources', value: study.totalResources },
        { label: 'Hours', value: study.totalHours },
      ],
    },
    {
      title: 'Reading',
      icon: BookOpen,
      color: '#8B5CF6',
      stats: [
        { label: 'Books', value: reading.totalBooks },
        { label: 'Completed', value: reading.completed },
        { label: 'Pages Read', value: reading.pagesRead },
        { label: 'Progress', value: `${reading.progress}%` },
      ],
      progress: reading.progress,
    },
    {
      title: 'Goals',
      icon: Target,
      color: '#22C55E',
      stats: [
        { label: 'Short Goals', value: `${goals.shortCompleted}/${goals.shortTotal}` },
        { label: 'Long Goals', value: goals.longTotal },
        { label: 'Dreams', value: goals.dreams },
      ],
      progress: goals.shortTotal > 0 ? (goals.shortCompleted / goals.shortTotal) * 100 : 0,
    },
    {
      title: 'Placement',
      icon: Briefcase,
      color: '#F59E0B',
      stats: [
        { label: 'Companies', value: placement.total },
        { label: 'Offers', value: placement.offers },
        { label: 'Response Rate', value: `${placement.responseRate}%` },
      ],
    },
    {
      title: 'Focus',
      icon: Timer,
      color: colors.accent,
      stats: [
        { label: 'Sessions', value: pomodoro.sessions },
        { label: 'Minutes', value: pomodoro.totalMinutes },
      ],
    },
  ];

  return (
    <View style={[styles.root, { backgroundColor: '#000B29', paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <ScreenHeader title="Analytics" subtitle="Your growth insights" showBack={false} showMenu={true} />

      {loading ? <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} /> : (
        <ScrollView contentContainerStyle={{ padding: Spacing.base, paddingBottom: tabBarHeight + 24, gap: Spacing.md }}>
          {sections.map((section, idx) => (
            <GlassCard key={idx} style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', borderColor: 'rgba(255, 255, 255, 0.06)', gap: Spacing.md }}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, { backgroundColor: section.color + '18' }]}>
                  <section.icon size={18} color={section.color} strokeWidth={2} />
                </View>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{section.title} Analytics</Text>
              </View>
              <StatRow items={section.stats} colors={colors} />
              {section.progress !== undefined && (
                <ProgressBar progress={section.progress} color={section.color} height={5} backgroundColor="rgba(255, 255, 255, 0.06)" />
              )}
            </GlassCard>
          ))}

          {/* Mood Chart */}
          <GlassCard style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', borderColor: 'rgba(255, 255, 255, 0.06)', gap: Spacing.md }}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: '#F59E0B18' }]}>
                <Smile size={18} color="#F59E0B" strokeWidth={2} />
              </View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Mood Analytics</Text>
            </View>
            <StatRow items={[{ label: 'Entries', value: mood.entries }, { label: 'Avg Score', value: mood.avgScore }]} colors={colors} />
            {mood.entries > 0 ? (
              <BarChart
                data={moodChartData}
                width={chartWidth}
                height={160}
                chartConfig={chartConfig}
                style={{ borderRadius: Radius.md, marginLeft: -12 }}
                yAxisLabel=""
                yAxisSuffix=""
                fromZero
              />
            ) : (
              <Text style={[styles.noDataText, { color: colors.textMuted }]}>Log your mood daily to see trends here</Text>
            )}
          </GlassCard>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  sectionIcon: { width: 32, height: 32, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold },
  statRow: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center', gap: 3 },
  statValue: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold },
  statLabel: { fontSize: Typography.sizes.xs },
  noDataText: { fontSize: Typography.sizes.sm, textAlign: 'center', paddingVertical: Spacing.md },
});
