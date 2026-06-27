import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { ArrowLeft, Menu } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useDrawer } from '@/contexts/DrawerContext';
import { Typography, Spacing, Radius } from '@/constants/theme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  showMenu?: boolean;
  rightAction?: React.ReactNode;
  style?: ViewStyle;
}

export function ScreenHeader({ title, subtitle, showBack = true, showMenu = false, rightAction, style }: ScreenHeaderProps) {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { openDrawer } = useDrawer();

  return (
    <View style={[styles.header, style]}>
      {showMenu ? (
        <Pressable
          onPress={openDrawer}
          style={[styles.backBtn, { borderColor: 'rgba(255, 255, 255, 0.08)', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 20 }]}
        >
          <Menu size={22} color="#FFFFFF" strokeWidth={2.5} />
        </Pressable>
      ) : showBack ? (
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
