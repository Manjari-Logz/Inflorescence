import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  Award, Crown, Heart, Activity, Target, BookOpen,
  GraduationCap, Sparkles, Flame, Star,
} from 'lucide-react-native';
import { Colors, Typography, Radius, Spacing } from '@/constants/theme';

interface BadgePillProps {
  type: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
}

const BADGE_ICONS: Record<string, React.ComponentType<any>> = {
  bronze: Award,
  silver: Award,
  gold: Award,
  diamond: Sparkles,
  master: Crown,
  legend: Star,
  heart: Heart,
  focus: Target,
  health: Activity,
  motivation: Flame,
  reader: BookOpen,
  scholar: GraduationCap,
};

export function BadgePill({ type, name, size = 'md' }: BadgePillProps) {
  const color = Colors.badge[type] ?? Colors.primaryLight;
  const BadgeIcon = BADGE_ICONS[type] ?? Award;
  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 24 : 18;
  const textSize = size === 'sm' ? Typography.sizes.xs : size === 'lg' ? Typography.sizes.md : Typography.sizes.sm;
  const pad = size === 'sm' ? 6 : size === 'lg' ? 12 : 8;

  return (
    <View style={[styles.pill, { borderColor: color + '50', backgroundColor: color + '12', paddingHorizontal: pad, paddingVertical: pad / 2 }]}>
      <BadgeIcon size={iconSize} color={color} strokeWidth={2} />
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
  },
  name: {
    fontWeight: '600',
  },
});
