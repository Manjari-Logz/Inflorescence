import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Modal,
  KeyboardAvoidingView, Platform, ActivityIndicator, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, Trash2, Activity, Flame, Clock, X } from 'lucide-react-native';
import { useAlert } from '@/template';
import { useExercise } from '@/hooks/useModules';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Typography, Spacing, Radius, Colors } from '@/constants/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import { AppInput } from '@/components/ui/AppInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { EXERCISE_TYPES, ExerciseType, exerciseService } from '@/services/exerciseService';

export default function ExerciseScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { showAlert } = useAlert();
  const { logs, loading, addLog, removeLog } = useExercise();
  const [modal, setModal] = useState(false);
  const [type, setType] = useState<ExerciseType>('running');
  const [duration, setDuration] = useState('');
  const [distance, setDistance] = useState('');
  const [calories, setCalories] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const weekly = exerciseService.getWeeklyStats(logs);
  const today = new Date().toISOString().split('T')[0];

  const handleSave = async () => {
    if (!duration.trim()) { showAlert('Required', 'Enter duration in minutes.'); return; }
    setSaving(true);
    await addLog({ type, duration_minutes: parseInt(duration, 10) || 0, distance_km: parseFloat(distance) || 0, calories: parseInt(calories, 10) || 0, notes: notes.trim() || undefined, date: today });
    setSaving(false); setModal(false);
    setDuration(''); setDistance(''); setCalories(''); setNotes('');
  };

  const weeklyStats = [
    { label: 'Minutes', value: weekly.totalMinutes, color: colors.accent, icon: Clock },
    { label: 'Distance (km)', value: weekly.totalDistance.toFixed(1), color: Colors.success, icon: Activity },
    { label: 'Sessions', value: weekly.sessions, color: Colors.warning, icon: Flame },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <StatusBar barStyle={colors.text === '#F1F5F9' ? 'light-content' : 'dark-content'} />
      <ScreenHeader title="Exercise" subtitle={`${weekly.sessions} sessions this week`} rightAction={
        <Pressable onPress={() => setModal(true)} style={[styles.addBtn, { backgroundColor: Colors.success }]}>
          <Plus size={20} color="#fff" strokeWidth={2.5} />
        </Pressable>
      } />

      <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.base, paddingBottom: insets.bottom + 40 }}>
        {/* Weekly Stats */}
        <View style={styles.statsRow}>
          {weeklyStats.map((s, i) => (
            <GlassCard key={i} style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]} padding={14}>
              <View style={[styles.statIcon, { backgroundColor: s.color + '18' }]}>
                <s.icon size={18} color={s.color} strokeWidth={2} />
              </View>
              <Text style={[styles.statNum, { color: colors.text }]}>{s.value}</Text>
              <Text style={[styles.statLbl, { color: colors.textMuted }]}>{s.label}</Text>
            </GlassCard>
          ))}
        </View>

        {/* Exercise Type Grid */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Log by Type</Text>
        <View style={styles.typeGrid}>
          {EXERCISE_TYPES.map(t => (
            <Pressable
              key={t.key}
              style={({ pressed }) => [styles.typeCard, { backgroundColor: colors.surface, borderColor: t.color + '40' }, pressed && { opacity: 0.7 }]}
              onPress={() => { setType(t.key); setModal(true); }}
            >
              <View style={[styles.typeIconBox, { backgroundColor: t.color + '18' }]}>
                <Activity size={22} color={t.color} strokeWidth={2} />
              </View>
              <Text style={[styles.typeLabel, { color: colors.text }]}>{t.label}</Text>
              <Text style={[styles.typeMins, { color: colors.textMuted }]}>{weekly.byType[t.key] ?? 0} min</Text>
            </Pressable>
          ))}
        </View>

        {/* Activity Log */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</Text>
        {loading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: Spacing.lg }} />
        ) : logs.length === 0 ? (
          <View style={styles.empty}>
            <Activity size={40} color={colors.textDim} strokeWidth={1.5} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No exercise logged yet</Text>
          </View>
        ) : logs.slice(0, 20).map(log => {
          const t = EXERCISE_TYPES.find(e => e.key === log.type);
          return (
            <GlassCard key={log.id} style={[styles.logCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.logIconBox, { backgroundColor: (t?.color ?? colors.accent) + '18' }]}>
                <Activity size={20} color={t?.color ?? colors.accent} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.logType, { color: colors.text }]}>{t?.label ?? log.type}</Text>
                <View style={styles.logMeta}>
                  <View style={styles.logMetaItem}>
                    <Clock size={11} color={colors.textMuted} strokeWidth={2} />
                    <Text style={[styles.logDetail, { color: colors.textMuted }]}>{log.duration_minutes} min</Text>
                  </View>
                  {log.distance_km > 0 && (
                    <Text style={[styles.logDetail, { color: colors.textMuted }]}>{log.distance_km} km</Text>
                  )}
                  {log.calories > 0 && (
                    <View style={styles.logMetaItem}>
                      <Flame size={11} color={Colors.warning} strokeWidth={2} />
                      <Text style={[styles.logDetail, { color: colors.textMuted }]}>{log.calories} kcal</Text>
                    </View>
                  )}
                  <Text style={[styles.logDetail, { color: colors.textDim }]}>{log.date}</Text>
                </View>
              </View>
              <Pressable onPress={() => removeLog(log.id)} hitSlop={8}>
                <Trash2 size={16} color={colors.textDim} strokeWidth={2} />
              </Pressable>
            </GlassCard>
          );
        })}
      </ScrollView>

      <Modal visible={modal} transparent animationType="slide" onRequestClose={() => setModal(false)}>
        <KeyboardAvoidingView style={[styles.overlay, { backgroundColor: colors.overlay }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setModal(false)} />
          <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border, paddingBottom: insets.bottom + 16 }]}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>Log {EXERCISE_TYPES.find(t => t.key === type)?.label}</Text>
              <Pressable onPress={() => setModal(false)}><X size={20} color={colors.textMuted} strokeWidth={2} /></Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                {EXERCISE_TYPES.map(t => (
                  <Pressable key={t.key} style={[styles.typeChip, { borderColor: type === t.key ? t.color : colors.border, backgroundColor: type === t.key ? t.color + '22' : colors.surfaceLight }]} onPress={() => setType(t.key)}>
                    <Text style={{ color: type === t.key ? t.color : colors.textMuted, fontSize: Typography.sizes.sm, fontWeight: '600' }}>{t.label}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
            <AppInput label="Duration (minutes) *" value={duration} onChangeText={setDuration} keyboardType="number-pad" placeholder="30" />
            <AppInput label="Distance (km)" value={distance} onChangeText={setDistance} keyboardType="decimal-pad" placeholder="5.0" />
            <AppInput label="Calories" value={calories} onChangeText={setCalories} keyboardType="number-pad" placeholder="200" />
            <AppInput label="Notes" value={notes} onChangeText={setNotes} placeholder="How did it feel?" multiline />
            <PrimaryButton title="Log Exercise" onPress={handleSave} loading={saving} style={{ marginTop: Spacing.md }} />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  addBtn: { width: 38, height: 38, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  statCard: { flex: 1, alignItems: 'center', gap: 4 },
  statIcon: { width: 34, height: 34, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  statNum: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold },
  statLbl: { fontSize: Typography.sizes.xs, textAlign: 'center' },
  sectionTitle: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold, marginBottom: Spacing.md },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  typeCard: { width: '30.5%', alignItems: 'center', padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1, gap: Spacing.sm, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  typeIconBox: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  typeLabel: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, textAlign: 'center' },
  typeMins: { fontSize: Typography.sizes.xs },
  empty: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.md },
  emptyText: { fontSize: Typography.sizes.base },
  logCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm },
  logIconBox: { width: 42, height: 42, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  logType: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.semibold },
  logMeta: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center', flexWrap: 'wrap', marginTop: 3 },
  logMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  logDetail: { fontSize: Typography.sizes.xs },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, borderWidth: 1, padding: Spacing.xl, maxHeight: '85%' },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.base },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  sheetTitle: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold },
  typeChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.full, borderWidth: 1 },
});
