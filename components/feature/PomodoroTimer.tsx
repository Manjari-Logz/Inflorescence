import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { RotateCcw, Play, Pause, SkipForward } from 'lucide-react-native';
import supabase from '@/lib/supabase';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { useAuth } from '@/hooks/useAuth';

const MODES = [
  { label: '25/5', work: 25, break: 5 },
  { label: '50/10', work: 50, break: 10 },
  { label: 'Custom', work: 30, break: 5 },
];

export function PomodoroTimer() {
  const { user } = useAuth();
  const { colors } = useAppTheme();
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

  useEffect(() => { resetTimer(modeIdx, phase); }, [modeIdx]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current!);
            setRunning(false);
            if (phase === 'work' && user) {
              supabase.from('pomodoro_sessions').insert({
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
  const phaseColor = phase === 'work' ? colors.accent : Colors.success;

  return (
    <GlassCard style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.heading, { color: colors.text }]}>Focus Timer</Text>

      <View style={styles.modeRow}>
        {MODES.map((m, i) => (
          <Pressable
            key={m.label}
            style={[
              styles.modeBtn,
              { borderColor: colors.border, backgroundColor: colors.surfaceLight },
              modeIdx === i && { borderColor: colors.accent, backgroundColor: colors.accent + '18' },
            ]}
            onPress={() => { setModeIdx(i); setPhase('work'); }}
          >
            <Text style={[styles.modeTxt, { color: modeIdx === i ? colors.accent : colors.textMuted }]}>{m.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.timerCenter}>
        <View style={[styles.phaseTag, { backgroundColor: phaseColor + '18', borderColor: phaseColor + '40' }]}>
          <Text style={[styles.phaseLabel, { color: phaseColor }]}>
            {phase === 'work' ? 'FOCUS' : 'BREAK'}
          </Text>
        </View>
        <Text style={[styles.time, { color: colors.text }]}>{mins}:{secs}</Text>
        <View style={[styles.progressTrack, { backgroundColor: colors.surfaceLight }]}>
          <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: phaseColor }]} />
        </View>
      </View>

      <View style={styles.controls}>
        <Pressable style={[styles.ctrlBtn, { backgroundColor: colors.surfaceLight }]} onPress={() => resetTimer(modeIdx, phase)}>
          <RotateCcw size={18} color={colors.textMuted} strokeWidth={2} />
        </Pressable>
        <Pressable style={[styles.playBtn, { backgroundColor: colors.accent }]} onPress={() => setRunning(r => !r)}>
          {running
            ? <Pause size={26} color="#fff" strokeWidth={2} />
            : <Play size={26} color="#fff" strokeWidth={2} fill="#fff" />
          }
        </Pressable>
        <Pressable
          style={[styles.ctrlBtn, { backgroundColor: colors.surfaceLight }]}
          onPress={() => { const next = phase === 'work' ? 'break' : 'work'; setPhase(next); resetTimer(modeIdx, next); }}
        >
          <SkipForward size={18} color={colors.textMuted} strokeWidth={2} />
        </Pressable>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.md },
  heading: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold },
  modeRow: { flexDirection: 'row', gap: Spacing.sm },
  modeBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  modeTxt: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold },
  timerCenter: { alignItems: 'center', paddingVertical: Spacing.sm, gap: Spacing.md },
  phaseTag: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  phaseLabel: { fontSize: Typography.sizes.xs, fontWeight: '700', letterSpacing: 1.5 },
  time: { fontSize: 56, fontWeight: '700', letterSpacing: -2 },
  progressTrack: { width: '100%', height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xl },
  ctrlBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
  },
  playBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
});
