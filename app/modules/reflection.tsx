import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator, StatusBar,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReflection } from '@/hooks/useModules';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Typography, Spacing, Radius } from '@/constants/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import { AppInput } from '@/components/ui/AppInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { reflectionService } from '@/services/reflectionService';

export default function ReflectionScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { reflections, loading, todayReflection, saveReflection } = useReflection();
  const [content, setContent] = useState(todayReflection?.content ?? '');
  const [view, setView] = useState<'write' | 'history' | 'calendar'>('write');
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const prompt = reflectionService.getDailyPrompt();
  const today = new Date().toISOString().split('T')[0];

  const markedDates = reflections.reduce((acc, r) => {
    acc[r.date] = { marked: true, dotColor: colors.accent };
    return acc;
  }, {} as Record<string, any>);

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    await saveReflection(content.trim(), prompt, today);
    setSaving(false);
  };

  const selectedReflection = reflections.find(r => r.date === selectedDate);

  const TABS = [
    { key: 'write', label: 'Today' },
    { key: 'history', label: 'History' },
    { key: 'calendar', label: 'Calendar' },
  ] as const;

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <StatusBar barStyle={colors.text === '#F1F5F9' ? 'light-content' : 'dark-content'} />
      <ScreenHeader title="Reflection" subtitle="Journal your growth" showBack />

      <View style={[styles.tabRow, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
        {TABS.map(t => (
          <Pressable
            key={t.key}
            style={[styles.tab, view === t.key && { backgroundColor: colors.accent }]}
            onPress={() => setView(t.key)}
          >
            <Text style={[styles.tabText, { color: view === t.key ? '#fff' : colors.textMuted }]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : view === 'write' ? (
        <ScrollView contentContainerStyle={{ padding: Spacing.base, paddingBottom: insets.bottom + 40 }}>
          <GlassCard style={{ backgroundColor: colors.surface, borderColor: colors.border, gap: Spacing.md }}>
            <View style={[styles.promptBox, { backgroundColor: colors.accent + '10', borderColor: colors.accent + '30' }]}>
              <Text style={[styles.promptLabel, { color: colors.accent }]}>Today&apos;s Prompt</Text>
              <Text style={[styles.prompt, { color: colors.text }]}>{prompt}</Text>
            </View>
            <AppInput
              label="Your Reflection"
              value={content}
              onChangeText={setContent}
              placeholder="Write your thoughts for today..."
              multiline
              style={{ minHeight: 140 }}
            />
            <PrimaryButton
              title={todayReflection ? 'Update Reflection' : 'Save Reflection'}
              onPress={handleSave}
              loading={saving}
            />
          </GlassCard>
        </ScrollView>
      ) : view === 'history' ? (
        <ScrollView contentContainerStyle={{ padding: Spacing.base, paddingBottom: insets.bottom + 40, gap: Spacing.md }}>
          {reflections.length === 0 ? (
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>No reflections yet. Start journaling today!</Text>
            </View>
          ) : reflections.map(r => (
            <GlassCard key={r.id} style={{ backgroundColor: colors.surface, borderColor: colors.border, gap: Spacing.sm }}>
              <Text style={[styles.historyDate, { color: colors.accent }]}>
                {new Date(r.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </Text>
              <Text style={[styles.historyPrompt, { color: colors.textMuted }]}>{r.prompt}</Text>
              <Text style={[styles.historyContent, { color: colors.text }]}>{r.content}</Text>
            </GlassCard>
          ))}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={{ padding: Spacing.base, paddingBottom: insets.bottom + 40 }}>
          <Calendar
            markedDates={{
              ...markedDates,
              [selectedDate]: { ...(markedDates[selectedDate] ?? {}), selected: true, selectedColor: colors.accent },
            }}
            onDayPress={d => setSelectedDate(d.dateString)}
            theme={{
              backgroundColor: 'transparent',
              calendarBackground: 'transparent',
              textSectionTitleColor: colors.textMuted,
              dayTextColor: colors.text,
              todayTextColor: colors.accent,
              selectedDayBackgroundColor: colors.accent,
              monthTextColor: colors.text,
              arrowColor: colors.accent,
              dotColor: colors.accent,
            }}
          />
          {selectedReflection ? (
            <GlassCard style={{ backgroundColor: colors.surface, borderColor: colors.border, marginTop: Spacing.md, gap: Spacing.sm }}>
              <Text style={[styles.historyDate, { color: colors.accent }]}>{selectedDate}</Text>
              <Text style={[styles.historyPrompt, { color: colors.textMuted }]}>{selectedReflection.prompt}</Text>
              <Text style={[styles.historyContent, { color: colors.text }]}>{selectedReflection.content}</Text>
            </GlassCard>
          ) : (
            <Text style={[styles.emptyText, { color: colors.textMuted, marginTop: Spacing.lg, textAlign: 'center' }]}>
              No reflection on this date
            </Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.base,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: 4,
    marginBottom: Spacing.base,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: Radius.md,
  },
  tabText: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold },
  promptBox: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  promptLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  prompt: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.semibold, lineHeight: 24 },
  empty: { alignItems: 'center', paddingTop: Spacing.xxxl },
  emptyText: { fontSize: Typography.sizes.base },
  historyDate: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold },
  historyPrompt: { fontSize: Typography.sizes.sm, fontStyle: 'italic' },
  historyContent: { fontSize: Typography.sizes.base, lineHeight: 22 },
});
