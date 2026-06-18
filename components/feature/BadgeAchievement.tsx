import React, { useEffect } from 'react';
import { View, Text, Modal, StyleSheet, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence, withTiming } from 'react-native-reanimated';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Typography, Spacing, Radius } from '@/constants/theme';
import { BADGE_EMOJIS } from '@/services/badgesService';

interface BadgeAchievementProps {
  visible: boolean;
  badgeType: string;
  badgeName: string;
  onDismiss: () => void;
}

export function BadgeAchievement({ visible, badgeType, badgeName, onDismiss }: BadgeAchievementProps) {
  const { colors } = useAppTheme();
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withSequence(
        withSpring(1.2, { damping: 8 }),
        withSpring(1, { damping: 12 }),
      );
    } else {
      opacity.value = 0;
      scale.value = 0;
    }
  }, [visible]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const badgeColor = colors.badge[badgeType] ?? colors.accent;
  const emoji = BADGE_EMOJIS[badgeType] ?? '🏅';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={onDismiss}>
        <Animated.View style={[styles.card, { backgroundColor: colors.surface, borderColor: badgeColor }, animStyle]}>
          <View style={[styles.glow, { backgroundColor: badgeColor + '22', borderColor: badgeColor }]}>
            <Text style={styles.emoji}>{emoji}</Text>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Achievement Unlocked!</Text>
          <Text style={[styles.badgeName, { color: badgeColor }]}>{badgeName}</Text>
          <Text style={[styles.sub, { color: colors.textMuted }]}>Tap anywhere to continue</Text>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  card: { width: '85%', borderRadius: Radius.xxl, borderWidth: 2, padding: Spacing.xxl, alignItems: 'center', gap: Spacing.md },
  glow: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', borderWidth: 3 },
  emoji: { fontSize: 48 },
  title: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.xl, fontWeight: '700' },
  badgeName: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.lg, fontWeight: '600' },
  sub: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.sm, marginTop: Spacing.sm },
});
