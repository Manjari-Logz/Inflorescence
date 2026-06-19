import React, { useEffect } from 'react';
import { View, Text, Modal, StyleSheet, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence, withTiming } from 'react-native-reanimated';
import { Award } from 'lucide-react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Typography, Spacing, Radius } from '@/constants/theme';

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
        withSpring(1.15, { damping: 8 }),
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

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={onDismiss}>
        <Animated.View style={[styles.card, { backgroundColor: colors.surface, borderColor: badgeColor }, animStyle]}>
          <View style={[styles.iconCircle, { backgroundColor: badgeColor + '18', borderColor: badgeColor + '40' }]}>
            <Award size={48} color={badgeColor} strokeWidth={1.5} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Achievement Unlocked</Text>
          <Text style={[styles.badgeName, { color: badgeColor }]}>{badgeName}</Text>
          <Text style={[styles.sub, { color: colors.textMuted }]}>Tap anywhere to continue</Text>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  card: {
    width: '85%',
    borderRadius: Radius.xxl,
    borderWidth: 1,
    padding: Spacing.xxl,
    alignItems: 'center',
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  title: { fontSize: Typography.sizes.xl, fontWeight: '700' },
  badgeName: { fontSize: Typography.sizes.lg, fontWeight: '600' },
  sub: { fontSize: Typography.sizes.sm, marginTop: Spacing.sm },
});
