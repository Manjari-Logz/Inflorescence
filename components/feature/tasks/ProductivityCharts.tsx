import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Spacing, Radius } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

interface ProductivityChartsProps {
  tasks: any[];
  colors: any;
}

export function ProductivityCharts({ tasks, colors }: ProductivityChartsProps) {
  // 1. Calculate Weekly Completion (last 7 days)
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });

  const weeklyData = last7Days.map(day => {
    const dateStr = day.toDateString();
    const count = tasks.filter(t => {
      if (!t.completed || !t.completed_at) return false;
      return new Date(t.completed_at).toDateString() === dateStr;
    }).length;
    
    // Day label: e.g. Mon, Tue
    const label = day.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3);
    return { label, count };
  });

  const maxCount = Math.max(...weeklyData.map(d => d.count), 1);

  // Animated heights for the 7 bars
  const animValues = useRef(Array.from({ length: 7 }).map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const animations = animValues.map((anim, idx) => {
      const targetPct = (weeklyData[idx].count / maxCount) * 100;
      return Animated.spring(anim, {
        toValue: targetPct,
        friction: 8,
        tension: 30,
        useNativeDriver: false, // Height layout changes require layout animations (useNativeDriver: false)
      });
    });
    Animated.parallel(animations).start();
  }, [tasks, maxCount]);

  // 2. Calculate Category Distribution (top 4 categories)
  const categoryCounts = tasks.reduce((acc: Record<string, number>, task) => {
    const cat = task.category || 'General';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const distributionData = Object.entries(categoryCounts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  const maxDistributionCount = Math.max(...distributionData.map(d => d.count), 1);

  return (
    <View style={styles.container}>
      {/* Chart 1: Weekly Progress */}
      <View style={[styles.card, { backgroundColor: 'rgba(255, 255, 255, 0.03)', borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Weekly Completion Activity</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>Tasks completed per day over the last week</Text>
        
        <View style={styles.chartContainer}>
          <View style={styles.barsRow}>
            {weeklyData.map((data, idx) => {
              const barHeight = animValues[idx].interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              });

              return (
                <View key={idx} style={styles.barColumn}>
                  <View style={styles.barTrack}>
                    <Animated.View style={[styles.barFill, { height: barHeight }]}>
                      <LinearGradient
                        colors={[colors.accent, colors.primaryLighter || '#B8D5FF']}
                        style={StyleSheet.absoluteFillObject}
                      />
                    </Animated.View>
                  </View>
                  <Text style={[styles.barCount, { color: colors.text }]}>{data.count}</Text>
                  <Text style={[styles.barLabel, { color: colors.textMuted }]}>{data.label}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* Chart 2: Category Distribution */}
      <View style={[styles.card, { backgroundColor: 'rgba(255, 255, 255, 0.03)', borderColor: colors.border, marginTop: Spacing.md }]}>
        <Text style={[styles.title, { color: colors.text }]}>Tasks Distribution</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>Task volume breakdown by category</Text>

        <View style={styles.distributionContainer}>
          {distributionData.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textDim }]}>No categories recorded yet.</Text>
          ) : (
            distributionData.map((item, idx) => {
              const percentage = (item.count / maxDistributionCount) * 100;
              const barWidth = percentage + '%';

              return (
                <View key={idx} style={styles.distRow}>
                  <View style={styles.distMeta}>
                    <Text style={[styles.distLabel, { color: colors.text }]}>{item.category}</Text>
                    <Text style={[styles.distCount, { color: colors.textMuted }]}>{item.count} tasks</Text>
                  </View>
                  <View style={styles.distTrack}>
                    <View style={[styles.distFill, { width: barWidth, backgroundColor: colors.accent }]} />
                  </View>
                </View>
              );
            })
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.lg,
    overflow: 'hidden',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    marginBottom: Spacing.lg,
  },
  chartContainer: {
    height: 140,
    justifyContent: 'flex-end',
    paddingTop: Spacing.md,
  },
  barsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '100%',
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
  },
  barTrack: {
    width: 14,
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: Radius.full,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    borderRadius: Radius.full,
  },
  barCount: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 6,
    marginBottom: 2,
  },
  barLabel: {
    fontSize: 10,
  },
  distributionContainer: {
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  distRow: {
    gap: 6,
  },
  distMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  distLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  distCount: {
    fontSize: 11,
  },
  distTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  distFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },
});
