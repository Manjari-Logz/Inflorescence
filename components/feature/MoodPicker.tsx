import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Typography, Spacing, Radius } from '@/constants/theme';
import { MOOD_OPTIONS } from '@/services/moodService';

interface MoodPickerProps {
  selected?: string;
  onSelect: (mood: string, score: number) => void;
}

const MOOD_COLORS: Record<string, string> = {
  'Very Sad': '#6366F1',
  'Sad': '#8B5CF6',
  'Neutral': '#64748B',
  'Good': '#3B82F6',
  'Happy': '#F59E0B',
};

export function MoodPicker({ selected, onSelect }: MoodPickerProps) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.row}>
      {MOOD_OPTIONS.map(opt => {
        const moodColor = MOOD_COLORS[opt.label] ?? colors.accent;
        const isSelected = selected === opt.label;
        return (
          <Pressable
            key={opt.label}
            onPress={() => onSelect(opt.label, opt.score)}
            style={({ pressed }) => [
              styles.option,
              { borderColor: isSelected ? moodColor : colors.border, backgroundColor: isSelected ? moodColor + '18' : colors.surfaceLight },
              pressed && styles.pressed,
            ]}
          >
            <View style={[styles.dot, { backgroundColor: moodColor }]} />
            <Text style={[styles.label, { color: isSelected ? moodColor : colors.textMuted, fontWeight: isSelected ? '700' : '400' }]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  option: {
    flex: 1,
    minWidth: 60,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  label: {
    fontSize: Typography.sizes.xs,
    textAlign: 'center',
  },
});
