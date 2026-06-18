import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Typography, Spacing } from '@/constants/theme';

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
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { borderColor: colors.border }]}>
          <MaterialIcons name="arrow-back" size={22} color={colors.accent} />
        </Pressable>
      ) : <View style={styles.backBtn} />}
      <View style={styles.titleBlock}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text> : null}
      </View>
      {rightAction ?? <View style={styles.backBtn} />}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, gap: Spacing.sm },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, borderWidth: 1 },
  titleBlock: { flex: 1 },
  title: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.xl, fontWeight: '700' },
  subtitle: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.sm, marginTop: 2 },
});
