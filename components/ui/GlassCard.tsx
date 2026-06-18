import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius, Shadows } from '@/constants/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  glow?: boolean;
  padding?: number;
}

export function GlassCard({ children, style, glow = false, padding = 16 }: GlassCardProps) {
  return (
    <View style={[styles.card, glow && styles.glow, { padding }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.glass,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  glow: {
    borderColor: Colors.borderStrong,
    ...Shadows.glow,
  },
});
