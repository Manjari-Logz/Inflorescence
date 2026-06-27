import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Modal,
  KeyboardAvoidingView, Platform, ActivityIndicator, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, Trash2, Flame, Clock, X, Zap, TrendingUp, Edit2 } from 'lucide-react-native';
import { useAlert } from '@/hooks/useAlert';
import { useExercise } from '@/hooks/useModules';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Typography, Spacing, Radius, Colors } from '@/constants/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import { AppInput } from '@/components/ui/AppInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EXERCISE_TYPES, ExerciseType, Intensity, Mood, calcCalories, exerciseService } from '@/services/exerciseService';

const INTENSITIES: Intensity[] = ['Low', 'Medium', 'High'];
const MOODS: Mood[] = ['Great', 'Good', 'Neutral', 'Tired', 'Bad'];
const INTENSITY_COLORS: Record<Intensity, string> = { Low: '#22C55E', Medium: '#F59E0B', High: '#EF4444' };

export default function ExerciseScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { showAlert } = useAlert();
  const { logs, loading, addLog, updateLog, removeLog } = useExercise();
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [type, setType] = useState<ExerciseType>('running');
  const [duration, setDuration] = useState('');
  const [distance, setDistance] = useState('');
  const [weight, setWeight] = useState('');
  const [intensity, setIntensity] = useState<Intensity>('Medium');
  const [moodBefore, setMoodBefore] = useState<Mood>('Good');
  const [moodAfter, setMoodAfter] = useState<Mood>('Great');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const estimatedCalories = duration && !isNaN(Number(duration))
    ? calcCalories(type, parseInt(duration) || 0, intensity, parseFloat(weight) || 70)
    : 0;

  const weekly = exerciseService.getWeeklyStats(logs);
  const today = new Date().toISOString().split('T')[0];

  const resetForm = () => {
    setEditId(null);
    setDuration(''); setDistance(''); setWeight(''); setIntensity('Medium');
    setMoodBefore('Good'); setMoodAfter('Great'); setNotes('');
  };

  const openEdit = (log: any) => {
    setEditId(log.id);
    setType(log.type); setDuration(String(log.duration_minutes));
    setDistance(log.distance_km > 0 ? String(log.distance_km) : '');
    setWeight(log.weight_kg ? String(log.weight_kg) : '');
    setIntensity(log.intensity); setMoodBefore(log.mood_before ?? 'Good');
    setMoodAfter(log.mood_after ?? 'Great'); setNotes(log.notes ?? '');
    setModal(true);
  };

  const handleSave = async () => {
    if (!duration.trim()) { showAlert('Required', 'Enter duration in minutes.'); return; }
    setSaving(true);
    const payload = {
      type, duration_minutes: parseInt(duration, 10) || 0,
      distance_km: parseFloat(distance) || 0,
      weight_kg: parseFloat(weight) || undefined,
      intensity, calories: estimatedCalories,
      mood_before: moodBefore, mood_after: moodAfter,
      notes: notes.trim() || undefined, date: today,
    };
    if (editId) {
      await updateLog(editId, payload);
    } else {
      await addLog(payload);
    }
    setSaving(false); setModal(false); resetForm();
  };

  const weeklyStats = [
    { label: 'Minutes', value: weekly.totalMinutes, color: colors.accent, icon: Clock },
    { label: 'Calories', value: weekly.totalCalories, color: Colors.error, icon: Flame },
    { label: 'Sessions', value: weekly.sessions, color: Colors.success, icon: TrendingUp },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <StatusBar barStyle={colors.text === '#F1F5F9' ? 'light-content' : 'dark-content'} />
      <ScreenHeader title="Exercise" subtitle={`${weekly.sessions} sessions · ${weekly.totalCalories} kcal this week`} rightAction={
        <Pressable onPress={() => { resetForm(); setModal(true); }} style={[styles.addBtn, { backgroundColor: Colors.success }]}>
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
                <Zap size={20} color={t.color} strokeWidth={2} />
              </View>
              <Text style={[styles.typeLabel, { color: colors.text }]}>{t.label}</Text>
              <Text style={[styles.typeMins, { color: colors.textMuted }]}>{weekly.byType[t.key] ?? 0}m</Text>
            </Pressable>
          ))}
        </View>

        {/* Activity Log */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</Text>
        {loading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: Spacing.lg }} />
        ) : logs.length === 0 ? (
          <View style={styles.empty}>
            <Zap size={40} color={colors.textDim} strokeWidth={1.5} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No exercise logged yet</Text>
          </View>
        ) : logs.slice(0, 25).map(log => {
          const t = EXERCISE_TYPES.find(e => e.key === log.type);
          return (
            <GlassCard key={log.id} style={[styles.logCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.logIconBox, { backgroundColor: (t?.color ?? colors.accent) + '18' }]}>
                <Zap size={20} color={t?.color ?? colors.accent} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                  <Text style={[styles.logType, { color: colors.text }]}>{t?.label ?? log.type}</Text>
                  <View style={[styles.intensityBadge, { borderColor: INTENSITY_COLORS[log.intensity] }]}>
                    <Text style={[styles.intensityText, { color: INTENSITY_COLORS[log.intensity] }]}>{log.intensity}</Text>
                  </View>
                </View>
                <View style={styles.logMeta}>
                  <View style={styles.logMetaItem}>
                    <Clock size={11} color={colors.textMuted} strokeWidth={2} />
                    <Text style={[styles.logDetail, { color: colors.textMuted }]}>{log.duration_minutes}m</Text>
                  </View>
                  {log.distance_km > 0 && <Text style={[styles.logDetail, { color: colors.textMuted }]}>{log.distance_km}km</Text>}
                  <View style={styles.logMetaItem}>
                    <Flame size={11} color={Colors.error} strokeWidth={2} />
                    <Text style={[styles.logDetail, { color: colors.textMuted }]}>{log.calories}kcal</Text>
                  </View>
                  <Text style={[styles.logDetail, { color: colors.textDim }]}>{log.date}</Text>
                </View>
              </View>
              <Pressable onPress={() => openEdit(log)} hitSlop={8}>
                <Edit2 size={15} color={colors.textMuted} strokeWidth={2} />
              </Pressable>
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
              <Text style={[styles.sheetTitle, { color: colors.text }]}>{editId ? 'Edit Log' : 'Log Exercise'}</Text>
              <Pressable onPress={() => { setModal(false); resetForm(); }}><X size={20} color={colors.textMuted} strokeWidth={2} /></Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Type selector */}
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.base }}>
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
              <AppInput label="Your Weight (kg)" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder="70 (for calorie estimate)" />

              {/* Live calorie estimate */}
              {estimatedCalories > 0 && (
                <View style={[styles.calorieBadge, { backgroundColor: Colors.error + '18', borderColor: Colors.error + '40' }]}>
                  <Flame size={14} color={Colors.error} strokeWidth={2} />
                  <Text style={[styles.calorieText, { color: Colors.error }]}>~{estimatedCalories} kcal estimated</Text>
                </View>
              )}

              {/* Intensity */}
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Intensity</Text>
              <View style={styles.chipRow}>
                {INTENSITIES.map(i => (
                  <Pressable key={i} style={[styles.selectChip, { borderColor: intensity === i ? INTENSITY_COLORS[i] : colors.border, backgroundColor: intensity === i ? INTENSITY_COLORS[i] + '18' : colors.surfaceLight }]} onPress={() => setIntensity(i)}>
                    <Text style={[styles.selectChipText, { color: intensity === i ? INTENSITY_COLORS[i] : colors.textMuted }]}>{i}</Text>
                  </Pressable>
                ))}
              </View>

              {/* Mood Before */}
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Mood Before</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.base }}>
                <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                  {MOODS.map(m => (
                    <Pressable key={m} style={[styles.selectChip, { borderColor: moodBefore === m ? colors.accent : colors.border, backgroundColor: moodBefore === m ? colors.accent + '18' : colors.surfaceLight }]} onPress={() => setMoodBefore(m)}>
                      <Text style={[styles.selectChipText, { color: moodBefore === m ? colors.accent : colors.textMuted }]}>{m}</Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>

              {/* Mood After */}
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Mood After</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.base }}>
                <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                  {MOODS.map(m => (
                    <Pressable key={m} style={[styles.selectChip, { borderColor: moodAfter === m ? Colors.success : colors.border, backgroundColor: moodAfter === m ? Colors.success + '18' : colors.surfaceLight }]} onPress={() => setMoodAfter(m)}>
                      <Text style={[styles.selectChipText, { color: moodAfter === m ? Colors.success : colors.textMuted }]}>{m}</Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>

              <AppInput label="Notes" value={notes} onChangeText={setNotes} placeholder="How did it feel?" multiline />
              <PrimaryButton title={editId ? 'Save Changes' : 'Log Exercise'} onPress={handleSave} loading={saving} style={{ marginTop: Spacing.md }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  addBtn: { width: 38, height: 38, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg, marginTop: Spacing.sm },
  statCard: { flex: 1, alignItems: 'center', gap: 4 },
  statIcon: { width: 34, height: 34, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  statNum: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold },
  statLbl: { fontSize: Typography.sizes.xs, textAlign: 'center' },
  sectionTitle: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold, marginBottom: Spacing.md },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  typeCard: { width: '30.5%', alignItems: 'center', padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1, gap: Spacing.xs, elevation: 1 },
  typeIconBox: { width: 40, height: 40, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  typeLabel: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.semibold, textAlign: 'center' },
  typeMins: { fontSize: Typography.sizes.xs },
  empty: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.md },
  emptyText: { fontSize: Typography.sizes.base },
  logCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm },
  logIconBox: { width: 42, height: 42, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  logType: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.semibold },
  intensityBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.full, borderWidth: 1 },
  intensityText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.semibold },
  logMeta: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center', flexWrap: 'wrap', marginTop: 3 },
  logMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  logDetail: { fontSize: Typography.sizes.xs },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, borderWidth: 1, padding: Spacing.xl, maxHeight: '92%' },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.base },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  sheetTitle: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold },
  fieldLabel: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, marginBottom: Spacing.sm },
  calorieBadge: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1, marginBottom: Spacing.base },
  calorieText: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold },
  chipRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.base },
  selectChip: { paddingHorizontal: Spacing.md, paddingVertical: 7, borderRadius: Radius.full, borderWidth: 1 },
  selectChipText: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold },
  typeChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.full, borderWidth: 1 },
});
