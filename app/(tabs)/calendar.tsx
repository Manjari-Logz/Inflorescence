import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, StatusBar } from 'react-native';
import { Calendar as RNCalendar } from 'react-native-calendars';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Calendar, CheckCircle2, Trophy, Target, ChevronRight, Menu } from 'lucide-react-native';
import { useTasks } from '@/hooks/useTasks';
import { useEvents } from '@/hooks/useEvents';
import { useGoals } from '@/hooks/useGoals';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useDrawer } from '@/contexts/DrawerContext';
import { useSafeTabBarHeight } from '@/hooks/useSafeTabBarHeight';
import { Typography, Spacing, Radius } from '@/constants/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { GlassCard } from '@/components/ui/GlassCard';

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useSafeTabBarHeight();
  const router = useRouter();
  const { colors } = useAppTheme();
  const { openDrawer } = useDrawer();
  const { tasks } = useTasks();
  const { hackathons } = useEvents();
  const { shortGoals } = useGoals();
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Combine items due on selected date
  const selectedItems = useMemo(() => {
    const activeTasks = tasks.filter(t => t.deadline && t.deadline.split('T')[0] === selectedDate);
    const activeEvents = hackathons.filter(h => h.end_date && h.end_date.split('T')[0] === selectedDate);
    const activeGoals = shortGoals.filter(g => g.due_date && g.due_date.split('T')[0] === selectedDate);
    return { tasks: activeTasks, events: activeEvents, goals: activeGoals };
  }, [tasks, hackathons, shortGoals, selectedDate]);

  // Generate calendar marks
  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    
    tasks.forEach(t => {
      if (t.deadline) {
        const d = t.deadline.split('T')[0];
        marks[d] = { marked: true, dotColor: '#3B82F6' };
      }
    });

    hackathons.forEach(h => {
      if (h.end_date) {
        const d = h.end_date.split('T')[0];
        marks[d] = { ...(marks[d] || {}), marked: true, dotColor: '#FBBF24' };
      }
    });

    if (selectedDate) {
      marks[selectedDate] = {
        ...(marks[selectedDate] || {}),
        selected: true,
        selectedColor: '#3B82F6',
      };
    }
    return marks;
  }, [tasks, hackathons, selectedDate]);

  return (
    <View style={[styles.root, { backgroundColor: '#000B29' }]}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.topHeaderBar, { paddingTop: insets.top + 6 }]}>
        <Pressable
          style={({ pressed }) => [styles.headerIconBtn, pressed && { opacity: 0.7 }]}
          onPress={openDrawer}
        >
          <Menu size={24} color="#FFFFFF" strokeWidth={2.5} />
        </Pressable>
        
        <Text style={styles.headerTitle}>Planner Calendar</Text>
        
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: tabBarHeight + 24 }} showsVerticalScrollIndicator={false}>
        {/* Calendar Picker Widget */}
        <GlassCard style={styles.calendarCard} padding={8}>
          <RNCalendar
            onDayPress={(day: any) => setSelectedDate(day.dateString)}
            markedDates={markedDates}
            theme={{
              backgroundColor: 'transparent',
              calendarBackground: 'transparent',
              textSectionTitleColor: '#94A3B8',
              selectedDayBackgroundColor: '#3B82F6',
              selectedDayTextColor: '#FFFFFF',
              todayTextColor: '#60A5FA',
              dayTextColor: '#E2E8F0',
              textDisabledColor: '#475569',
              dotColor: '#3B82F6',
              selectedDotColor: '#FFFFFF',
              arrowColor: '#3B82F6',
              monthTextColor: '#FFFFFF',
              indicatorColor: '#3B82F6',
              textDayFontWeight: '500',
              textMonthFontWeight: '700',
              textDayHeaderFontWeight: '600',
              textDayFontSize: 14,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 12,
            }}
          />
        </GlassCard>

        {/* Schedule List */}
        <View style={styles.scheduleSection}>
          <Text style={styles.sectionTitle}>Due on {new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>

          {selectedItems.tasks.length === 0 && selectedItems.events.length === 0 && selectedItems.goals.length === 0 ? (
            <Text style={styles.emptyText}>No items scheduled for this day.</Text>
          ) : (
            <View style={{ gap: 12 }}>
              {selectedItems.tasks.map(t => (
                <GlassCard key={t.id} style={styles.itemCard} padding={12}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <CheckCircle2 size={16} color="#60A5FA" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>{t.title}</Text>
                      <Text style={styles.itemSubtitle}>Priority: {t.priority}</Text>
                    </View>
                    <Pressable onPress={() => router.push('/(tabs)/tasks')}>
                      <ChevronRight size={16} color="#64748B" />
                    </Pressable>
                  </View>
                </GlassCard>
              ))}

              {selectedItems.events.map(e => (
                <GlassCard key={e.id} style={[styles.itemCard, { borderColor: 'rgba(251, 191, 36, 0.2)' }]} padding={12}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Trophy size={16} color="#FBBF24" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>{e.name}</Text>
                      <Text style={styles.itemSubtitle}>Event Deadline</Text>
                    </View>
                  </View>
                </GlassCard>
              ))}

              {selectedItems.goals.map(g => (
                <GlassCard key={g.id} style={[styles.itemCard, { borderColor: 'rgba(244, 114, 182, 0.2)' }]} padding={12}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Target size={16} color="#F472B6" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>{g.title}</Text>
                      <Text style={styles.itemSubtitle}>Goal Deadline</Text>
                    </View>
                  </View>
                </GlassCard>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.sm,
    backgroundColor: 'rgba(0, 11, 41, 0.6)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  calendarCard: {
    margin: Spacing.base,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  scheduleSection: {
    paddingHorizontal: Spacing.base,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 24,
  },
  itemCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  itemSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
});
