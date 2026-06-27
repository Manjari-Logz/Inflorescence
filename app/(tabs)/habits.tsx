import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Modal,
  KeyboardAvoidingView, Platform, StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, Flame, CheckCircle2, Circle, Trash2, X, AlertCircle, Menu } from 'lucide-react-native';
import { useAlert } from '@/hooks/useAlert';
import { useHabits } from '@/hooks/useHabits';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useDrawer } from '@/contexts/DrawerContext';
import { Typography, Spacing, Radius } from '@/constants/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { AppInput } from '@/components/ui/AppInput';
import { WatercolorBackground } from '@/components/ui/WatercolorBackground';

const FREQUENCY_OPTIONS = ['Daily', 'Weekly'];

export default function HabitsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { openDrawer } = useDrawer();
  const { habits, loading, addHabit, deleteHabit, logHabit, unlogHabit } = useHabits();
  const { showAlert } = useAlert();

  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState('Daily');
  const [saving, setSaving] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  const handleCreate = async () => {
    if (!name.trim()) {
      showAlert('Required', 'Please enter a habit name.');
      return;
    }
    setSaving(true);
    await addHabit(name.trim(), description.trim() || undefined, frequency.toLowerCase());
    setSaving(false);
    setModalVisible(false);
    setName('');
    setDescription('');
    setFrequency('Daily');
  };

  const handleToggleLog = async (habitId: string, isCompleted: boolean) => {
    if (isCompleted) {
      await unlogHabit(habitId, todayStr);
    } else {
      await logHabit(habitId, todayStr);
    }
  };

  const handleDelete = (id: string, habitName: string) => {
    Alert.alert('Delete Habit', `Are you sure you want to delete "${habitName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteHabit(id) },
    ]);
  };

  return (
    <WatercolorBackground>
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.title, { color: colors.text }]}>Habits</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              {habits.length} habits tracked · Maintain your streaks!
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Pressable style={[styles.iconBtn, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]} onPress={openDrawer}>
              <Menu size={18} color={colors.textMuted} strokeWidth={2} />
            </Pressable>
            <Pressable style={[styles.addBtn, { backgroundColor: colors.accent }]} onPress={() => setModalVisible(true)}>
              <Plus size={22} color="#fff" strokeWidth={2.5} />
            </Pressable>
          </View>
        </View>

        {loading ? (
          <View style={styles.center}><ActivityIndicator color={colors.accent} size="large" /></View>
        ) : habits.length === 0 ? (
          <View style={styles.empty}>
            <Flame size={52} color={colors.textDim} strokeWidth={1.5} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Start a new habit</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              Consistency is key. Tap the + icon to define your daily routines.
            </Text>
            <PrimaryButton title="Create Habit" onPress={() => setModalVisible(true)} style={{ marginTop: Spacing.lg }} />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
            showsVerticalScrollIndicator={false}
          >
            {habits.map(habit => {
              const logs = habit.habit_logs ?? [];
              const isCompletedToday = logs.some(l => l.date === todayStr);

              return (
                <GlassCard
                  key={habit.id}
                  style={[
                    styles.habitCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: isCompletedToday ? 'rgba(76, 175, 80, 0.4)' : colors.border
                    }
                  ]}
                >
                  <View style={styles.cardContent}>
                    <Pressable
                      style={styles.checkBtn}
                      onPress={() => handleToggleLog(habit.id, isCompletedToday)}
                      hitSlop={8}
                    >
                      {isCompletedToday ? (
                        <CheckCircle2 size={24} color="#4CAF50" strokeWidth={2} />
                      ) : (
                        <Circle size={24} color={colors.textDim} strokeWidth={2} />
                      )}
                    </Pressable>

                    <View style={styles.details}>
                      <Text
                        style={[
                          styles.habitName,
                          {
                            color: isCompletedToday ? colors.textMuted : colors.text,
                            textDecorationLine: isCompletedToday ? 'line-through' : 'none'
                          }
                        ]}
                        numberOfLines={1}
                      >
                        {habit.name}
                      </Text>
                      {habit.description ? (
                        <Text style={[styles.habitDesc, { color: colors.textMuted }]} numberOfLines={1}>
                          {habit.description}
                        </Text>
                      ) : null}

                      <View style={styles.metaRow}>
                        <View style={[styles.freqBadge, { backgroundColor: colors.surfaceLight }]}>
                          <Text style={[styles.freqTxt, { color: colors.textMuted }]}>
                            {habit.frequency.toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.streakRow}>
                          <Flame size={14} color="#FFB74D" strokeWidth={2.5} fill={habit.streak > 0 ? '#FFB74D' : 'transparent'} />
                          <Text style={[styles.streakTxt, { color: '#FFB74D' }]}>
                            {habit.streak} day{habit.streak !== 1 ? 's' : ''}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <Pressable
                      onPress={() => handleDelete(habit.id, habit.name)}
                      hitSlop={8}
                      style={styles.deleteBtn}
                    >
                      <Trash2 size={16} color={colors.textDim} strokeWidth={2} />
                    </Pressable>
                  </View>
                </GlassCard>
              );
            })}
          </ScrollView>
        )}

        {/* Add Habit Modal (Centered, Glassmorphic Scale/Fade) */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setModalVisible(false)} />
            <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>New Habit</Text>
                <Pressable onPress={() => setModalVisible(false)} hitSlop={8}>
                  <X size={20} color={colors.textMuted} strokeWidth={2} />
                </Pressable>
              </View>

              <AppInput
                label="Habit Name *"
                placeholder="e.g. Meditate, Read, Exercise..."
                value={name}
                onChangeText={setName}
              />

              <AppInput
                label="Description"
                placeholder="Why is this routine important?"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={2}
              />

              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Frequency</Text>
              <View style={styles.frequencyRow}>
                {FREQUENCY_OPTIONS.map(opt => (
                  <Pressable
                    key={opt}
                    style={[
                      styles.freqOpt,
                      {
                        borderColor: colors.border,
                        backgroundColor: colors.surfaceLight
                      },
                      frequency === opt && {
                        borderColor: colors.accent,
                        backgroundColor: colors.accent + '15'
                      }
                    ]}
                    onPress={() => setFrequency(opt)}
                  >
                    <Text style={[styles.freqOptTxt, { color: frequency === opt ? colors.accent : colors.textMuted }]}>
                      {opt}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <PrimaryButton
                title="Create Habit"
                onPress={handleCreate}
                loading={saving}
                style={{ marginTop: Spacing.lg }}
              />
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </WatercolorBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.base, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  headerLeft: { flex: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  iconBtn: { width: 36, height: 36, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  title: { fontSize: Typography.sizes.xxl, fontWeight: Typography.weights.bold },
  subtitle: { fontSize: Typography.sizes.sm, marginTop: 2 },
  addBtn: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xxl, gap: Spacing.md },
  emptyTitle: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, textAlign: 'center' },
  emptySubtitle: { fontSize: Typography.sizes.base, textAlign: 'center' },
  list: { paddingHorizontal: Spacing.base, paddingTop: Spacing.sm, gap: Spacing.sm },
  habitCard: { borderRadius: Radius.lg, borderWidth: 1 },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  checkBtn: { paddingRight: Spacing.md },
  details: { flex: 1, gap: 2 },
  habitName: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.semibold },
  habitDesc: { fontSize: Typography.sizes.sm },
  metaRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center', marginTop: 4 },
  freqBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.sm },
  freqTxt: { fontSize: 9, fontWeight: '700' },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  streakTxt: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.semibold },
  deleteBtn: { paddingLeft: Spacing.sm, paddingVertical: 8 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(3, 10, 22, 0.75)', padding: Spacing.xl },
  modalCard: { width: '100%', borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.xl, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  modalTitle: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold },
  fieldLabel: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, marginBottom: Spacing.sm },
  frequencyRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  freqOpt: { flex: 1, paddingVertical: 10, borderRadius: Radius.md, borderWidth: 1, alignItems: 'center' },
  freqOptTxt: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold },
});
