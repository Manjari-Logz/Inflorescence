import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { MOOD_OPTIONS } from '@/services/moodService';

interface MoodPickerProps {
  selected?: string;
  onSelect: (mood: string, score: number) => void;
}

export function MoodPicker({ selected, onSelect }: MoodPickerProps) {
  return (
    <View style={styles.row}>
      {MOOD_OPTIONS.map(opt => (
        <Pressable
          key={opt.label}
          onPress={() => onSelect(opt.label, opt.score)}
          style={({ pressed }) => [
            styles.option,
            selected === opt.label && styles.selected,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.emoji}>{opt.emoji}</Text>
          <Text style={[styles.label, selected === opt.label && styles.selectedLabel]}>{opt.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.xs,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceLight,
    gap: Spacing.xs,
  },
  selected: {
    borderColor: Colors.accent,
    backgroundColor: 'rgba(41, 182, 246, 0.12)',
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
  emoji: {
    fontSize: 22,
  },
  label: {
    fontSize: Typography.sizes.xs,
    fontFamily: Typography.fontFamily,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  selectedLabel: {
    color: Colors.accent,
    fontWeight: '600',
  },
});
