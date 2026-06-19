import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Typography, Spacing, Radius } from '@/constants/theme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  style?: ViewStyle;
}

export function ScreenHeader({ title, subtitle, showBack = true, rightAction, style }: ScreenHeaderProps) {
  const router = useRouter();
  const { colors } = useAppTheme();

  return (
    <View style={[styles.header, style]}>
      {showBack ? (
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { borderColor: colors.border, backgroundColor: colors.surfaceLight }]}>
          <ArrowLeft size={20} color={colors.text} />
        </Pressable>
      ) : <View style={styles.placeholder} />}
      <View style={styles.titleBlock}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text> : null}
      </View>
      {rightAction ?? <View style={styles.placeholder} />}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  placeholder: { width: 40, height: 40 },
  titleBlock: { flex: 1 },
  title: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
  },
  subtitle: {
    fontSize: Typography.sizes.sm,
    marginTop: 2,
  },
});
