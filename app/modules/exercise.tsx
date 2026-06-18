import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Modal,
  KeyboardAvoidingView, Platform, ActivityIndicator, StatusBar,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '@/template';
import { useExercise } from '@/hooks/useModules';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Typography, Spacing, Radius } from '@/constants/theme';
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
    await addLog({
      type,
      duration_minutes: parseInt(duration, 10) || 0,
      distance_km: parseFloat(distance) || 0,
      calories: parseInt(calories, 10) || 0,
      notes: notes.trim() || undefined,
      date: today,
    });
    setSaving(false); setModal(false);
    setDuration(''); setDistance(''); setCalories(''); setNotes('');
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <StatusBar barStyle={colors.text === '#FFFFFF' ? 'light-content' : 'dark-content'} />
      <ScreenHeader title="Exercise Tracker" subtitle={`${weekly.sessions} sessions this week`} rightAction={
        <Pressable onPress={() => setModal(true)} style={[styles.addBtn, { backgroundColor: colors.success }]}>
          <MaterialIcons name="add" size={24} color="#fff" />
        </Pressable>
      } />

      <ScrollView contentContainerStyle={{ padding: Spacing.base, paddingBottom: insets.bottom + 40 }}>
        <GlassCard style={{ backgroundColor: colors.glass, borderColor: colors.border, marginBottom: Spacing.md, gap: Spacing.sm }}>
          <Text style={[styles.statsTitle, { color: colors.text }]}>This Week</Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}><Text style={[styles.statNum, { color: colors.accent }]}>{weekly.totalMinutes}</Text><Text style={[styles.statLbl, { color: colors.textMuted }]}>Minutes</Text></View>
            <View style={styles.stat}><Text style={[styles.statNum, { color: colors.accent }]}>{weekly.totalDistance.toFixed(1)}</Text><Text style={[styles.statLbl, { color: colors.textMuted }]}>km</Text></View>
            <View style={styles.stat}><Text style={[styles.statNum, { color: colors.accent }]}>{weekly.sessions}</Text><Text style={[styles.statLbl, { color: colors.textMuted }]}>Sessions</Text></View>
          </View>
        </GlassCard>

        <View style={styles.typeGrid}>
          {EXERCISE_TYPES.map(t => (
            <Pressable key={t.key} style={[styles.typeCard, { backgroundColor: colors.glass, borderColor: t.color + '44' }]} onPress={() => { setType(t.key); setModal(true); }}>
              <MaterialIcons name={t.icon as any} size={28} color={t.color} />
              <Text style={[styles.typeLabel, { color: colors.text }]}>{t.label}</Text>
              <Text style={[styles.typeMins, { color: colors.textMuted }]}>{weekly.byType[t.key] ?? 0} min</Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.historyTitle, { color: colors.text }]}>Recent Activity</Text>
        {loading ? <ActivityIndicator color={colors.accent} /> : logs.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>No exercise logged yet</Text>
        ) : logs.slice(0, 20).map(log => {
          const t = EXERCISE_TYPES.find(e => e.key === log.type);
          return (
            <GlassCard key={log.id} style={[styles.logCard, { backgroundColor: colors.glass, borderColor: colors.border }]}>
              <MaterialIcons name={t?.icon as any ?? 'fitness-center'} size={24} color={t?.color ?? colors.accent} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.logType, { color: colors.text }]}>{t?.label ?? log.type}</Text>
                <Text style={[styles.logDetail, { color: colors.textMuted }]}>{log.duration_minutes} min · {log.distance_km > 0 ? `${log.distance_km} km · ` : ''}{log.date}</Text>
              </View>
              <Pressable onPress={() => removeLog(log.id)} hitSlop={8}>
                <MaterialIcons name="delete-outline" size={18} color={colors.textDim} />
              </Pressable>
            </GlassCard>
          );
        })}
      </ScrollView>

      <Modal visible={modal} transparent animationType="slide" onRequestClose={() => setModal(false)}>
        <KeyboardAvoidingView style={[styles.overlay, { backgroundColor: colors.overlay }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setModal(false)} />
          <View style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 16 }]}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>Log {EXERCISE_TYPES.find(t => t.key === type)?.label}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                {EXERCISE_TYPES.map(t => (
                  <Pressable key={t.key} style={[styles.typeChip, { borderColor: type === t.key ? t.color : colors.border, backgroundColor: type === t.key ? t.color + '22' : colors.surfaceLight }]} onPress={() => setType(t.key)}>
                    <Text style={{ color: type === t.key ? t.color : colors.textMuted, fontFamily: Typography.fontFamily, fontSize: Typography.sizes.sm, fontWeight: '600' }}>{t.label}</Text>
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
  addBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  statsTitle: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.lg, fontWeight: '700' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  statNum: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.xxl, fontWeight: '700' },
  statLbl: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.xs },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  typeCard: { width: '30%', alignItems: 'center', padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1, gap: Spacing.xs },
  typeLabel: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.sm, fontWeight: '600' },
  typeMins: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.xs },
  historyTitle: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.lg, fontWeight: '700', marginBottom: Spacing.md },
  emptyText: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.base, textAlign: 'center', padding: Spacing.xl },
  logCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm },
  logType: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.base, fontWeight: '600' },
  logDetail: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.sm },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, padding: Spacing.xl, maxHeight: '85%' },
  sheetTitle: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.xl, fontWeight: '700', marginBottom: Spacing.lg },
  typeChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.full, borderWidth: 1 },
});
