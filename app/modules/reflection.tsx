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
  }, {} as Record<string, { marked: boolean; dotColor: string }>);

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    await saveReflection(content.trim(), prompt, today);
    setSaving(false);
  };

  const selectedReflection = reflections.find(r => r.date === selectedDate);

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <StatusBar barStyle={colors.text === '#FFFFFF' ? 'light-content' : 'dark-content'} />
      <ScreenHeader title="Daily Reflection" subtitle="Journal your growth" showBack />

      <View style={[styles.tabRow, { backgroundColor: colors.surfaceLight }]}>
        {(['write', 'history', 'calendar'] as const).map(v => (
          <Pressable key={v} style={[styles.tab, view === v && { backgroundColor: colors.primary }]} onPress={() => setView(v)}>
            <Text style={[styles.tabText, { color: view === v ? '#fff' : colors.textMuted }]}>
              {v === 'write' ? 'Today' : v === 'history' ? 'History' : 'Calendar'}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} /> : view === 'write' ? (
        <ScrollView contentContainerStyle={{ padding: Spacing.base, paddingBottom: insets.bottom + 40 }}>
          <GlassCard style={{ backgroundColor: colors.glass, borderColor: colors.border, gap: Spacing.md }}>
            <Text style={[styles.promptLabel, { color: colors.accent }]}>Today's Prompt</Text>
            <Text style={[styles.prompt, { color: colors.text }]}>{prompt}</Text>
            <AppInput label="Your Reflection" value={content} onChangeText={setContent} placeholder="Write your thoughts..." multiline style={{ minHeight: 120 }} />
            <PrimaryButton title={todayReflection ? 'Update Reflection' : 'Save Reflection'} onPress={handleSave} loading={saving} />
          </GlassCard>
        </ScrollView>
      ) : view === 'history' ? (
        <ScrollView contentContainerStyle={{ padding: Spacing.base, paddingBottom: insets.bottom + 40, gap: Spacing.md }}>
          {reflections.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No reflections yet. Start journaling today!</Text>
          ) : reflections.map(r => (
            <GlassCard key={r.id} style={{ backgroundColor: colors.glass, borderColor: colors.border, gap: Spacing.sm }}>
              <Text style={[styles.historyDate, { color: colors.accent }]}>{new Date(r.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
              <Text style={[styles.historyPrompt, { color: colors.textMuted }]}>{r.prompt}</Text>
              <Text style={[styles.historyContent, { color: colors.text }]}>{r.content}</Text>
            </GlassCard>
          ))}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={{ padding: Spacing.base, paddingBottom: insets.bottom + 40 }}>
          <Calendar
            markedDates={{ ...markedDates, [selectedDate]: { ...(markedDates[selectedDate] ?? {}), selected: true, selectedColor: colors.primary } }}
            onDayPress={d => setSelectedDate(d.dateString)}
            theme={{
              backgroundColor: 'transparent',
              calendarBackground: 'transparent',
              textSectionTitleColor: colors.textMuted,
              dayTextColor: colors.text,
              todayTextColor: colors.accent,
              selectedDayBackgroundColor: colors.primary,
              monthTextColor: colors.text,
              arrowColor: colors.accent,
            }}
          />
          {selectedReflection ? (
            <GlassCard style={{ backgroundColor: colors.glass, borderColor: colors.border, marginTop: Spacing.md, gap: Spacing.sm }}>
              <Text style={[styles.historyDate, { color: colors.accent }]}>{selectedDate}</Text>
              <Text style={[styles.historyPrompt, { color: colors.textMuted }]}>{selectedReflection.prompt}</Text>
              <Text style={[styles.historyContent, { color: colors.text }]}>{selectedReflection.content}</Text>
            </GlassCard>
          ) : (
            <Text style={[styles.emptyText, { color: colors.textMuted, marginTop: Spacing.lg }]}>No reflection on this date</Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  tabRow: { flexDirection: 'row', marginHorizontal: Spacing.base, borderRadius: Radius.md, padding: 4, marginBottom: Spacing.md },
  tab: { flex: 1, paddingVertical: Spacing.sm, alignItems: 'center', borderRadius: Radius.sm },
  tabText: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.sm, fontWeight: '600' },
  promptLabel: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.sm, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  prompt: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.lg, fontWeight: '600', lineHeight: 26 },
  emptyText: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.base, textAlign: 'center', padding: Spacing.xxl },
  historyDate: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.sm, fontWeight: '700' },
  historyPrompt: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.sm, fontStyle: 'italic' },
  historyContent: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.base, lineHeight: 22 },
});
