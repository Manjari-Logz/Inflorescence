import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Radius, Spacing } from '@/constants/theme';
import { BADGE_EMOJIS } from '@/services/badgesService';

interface BadgePillProps {
  type: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function BadgePill({ type, name, size = 'md' }: BadgePillProps) {
  const color = Colors.badge[type] ?? Colors.primaryLight;
  const emoji = BADGE_EMOJIS[type] ?? '🏅';

  const fontSize = size === 'sm' ? 14 : size === 'lg' ? 28 : 20;
  const textSize = size === 'sm' ? Typography.sizes.xs : size === 'lg' ? Typography.sizes.md : Typography.sizes.sm;
  const pad = size === 'sm' ? 6 : size === 'lg' ? 12 : 8;

  return (
    <View style={[styles.pill, { borderColor: color, paddingHorizontal: pad, paddingVertical: pad / 2 }]}>
      <Text style={{ fontSize }}>{emoji}</Text>
      {name ? <Text style={[styles.name, { fontSize: textSize, color }]}>{name}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.full,
    borderWidth: 1,
    gap: Spacing.xs,
    backgroundColor: 'rgba(41, 182, 246, 0.08)',
  },
  name: {
    fontFamily: 'Arial',
    fontWeight: '600',
  },
});
