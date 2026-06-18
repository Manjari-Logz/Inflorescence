import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { getSupabaseClient, useAuth } from '@/template';

const MODES = [
  { label: '25/5', work: 25, break: 5 },
  { label: '50/10', work: 50, break: 10 },
  { label: 'Custom', work: 30, break: 5 },
];

export function PomodoroTimer() {
  const { user } = useAuth();
  const [modeIdx, setModeIdx] = useState(0);
  const [phase, setPhase] = useState<'work' | 'break'>('work');
  const [secondsLeft, setSecondsLeft] = useState(MODES[0].work * 60);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mode = MODES[modeIdx];
  const total = phase === 'work' ? mode.work * 60 : mode.break * 60;
  const progress = ((total - secondsLeft) / total) * 100;

  const resetTimer = useCallback((idx = modeIdx, ph: 'work' | 'break' = 'work') => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setSecondsLeft(MODES[idx][ph === 'work' ? 'work' : 'break'] * 60);
  }, [modeIdx]);

  useEffect(() => {
    resetTimer(modeIdx, phase);
  }, [modeIdx]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current!);
            setRunning(false);
            if (phase === 'work' && user) {
              const client = getSupabaseClient();
              client.from('pomodoro_sessions').insert({
                user_id: user.id,
                duration_minutes: mode.work,
                type: mode.label,
                completed: true,
                date: new Date().toISOString().split('T')[0],
              });
            }
            const nextPhase = phase === 'work' ? 'break' : 'work';
            setPhase(nextPhase);
            setSecondsLeft(MODES[modeIdx][nextPhase === 'work' ? 'work' : 'break'] * 60);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, phase, modeIdx]);

  const mins = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
  const secs = (secondsLeft % 60).toString().padStart(2, '0');

  const circumference = 2 * Math.PI * 44;
  const dashOffset = circumference * (1 - progress / 100);

  return (
    <GlassCard style={styles.card}>
      <Text style={styles.heading}>Pomodoro</Text>
      <View style={styles.modeRow}>
        {MODES.map((m, i) => (
          <Pressable
            key={m.label}
            style={[styles.modeBtn, modeIdx === i && styles.modeBtnActive]}
            onPress={() => { setModeIdx(i); setPhase('work'); }}
          >
            <Text style={[styles.modeTxt, modeIdx === i && styles.modeTxtActive]}>{m.label}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.timerCenter}>
        <Text style={[styles.phaseLabel, { color: phase === 'work' ? Colors.accent : Colors.success }]}>
          {phase === 'work' ? 'FOCUS' : 'BREAK'}
        </Text>
        <Text style={styles.time}>{mins}:{secs}</Text>
        <Text style={styles.progressTxt}>{Math.round(progress)}%</Text>
      </View>
      <View style={styles.controls}>
        <Pressable style={styles.ctrlBtn} onPress={() => resetTimer(modeIdx, phase)}>
          <MaterialIcons name="refresh" size={22} color={Colors.textMuted} />
        </Pressable>
        <Pressable style={styles.playBtn} onPress={() => setRunning(r => !r)}>
          <MaterialIcons name={running ? 'pause' : 'play-arrow'} size={28} color="#fff" />
        </Pressable>
        <Pressable
          style={styles.ctrlBtn}
          onPress={() => { const next = phase === 'work' ? 'break' : 'work'; setPhase(next); resetTimer(modeIdx, next); }}
        >
          <MaterialIcons name="skip-next" size={22} color={Colors.textMuted} />
        </Pressable>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.md },
  heading: { color: Colors.text, fontFamily: 'Arial', fontSize: Typography.sizes.lg, fontWeight: '700' },
  modeRow: { flexDirection: 'row', gap: Spacing.sm },
  modeBtn: { flex: 1, paddingVertical: Spacing.sm, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', backgroundColor: Colors.surfaceLight },
  modeBtnActive: { borderColor: Colors.accent, backgroundColor: 'rgba(41,182,246,0.12)' },
  modeTxt: { color: Colors.textMuted, fontFamily: 'Arial', fontSize: Typography.sizes.sm, fontWeight: '600' },
  modeTxtActive: { color: Colors.accent },
  timerCenter: { alignItems: 'center', paddingVertical: Spacing.md },
  phaseLabel: { fontFamily: 'Arial', fontSize: Typography.sizes.sm, fontWeight: '700', letterSpacing: 2 },
  time: { color: Colors.text, fontFamily: 'Arial', fontSize: 52, fontWeight: '700', marginVertical: Spacing.sm },
  progressTxt: { color: Colors.textMuted, fontFamily: 'Arial', fontSize: Typography.sizes.sm },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xl },
  ctrlBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.full, backgroundColor: Colors.surfaceLight },
  playBtn: { width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', ...{ shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 } },
});
