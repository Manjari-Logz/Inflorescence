import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Radius } from '@/constants/theme';

interface ProgressBarProps {
  progress: number; // 0–100
  color?: string;
  height?: number;
  backgroundColor?: string;
}

export function ProgressBar({ progress, color = Colors.accent, height = 6, backgroundColor = Colors.surfaceLighter }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, progress));
  return (
    <View style={[styles.track, { height, backgroundColor, borderRadius: height / 2 }]}>
      <View
        style={[
          styles.fill,
          { width: `${clamped}%`, backgroundColor: color, borderRadius: height / 2 },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
