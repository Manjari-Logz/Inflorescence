import React, { useEffect, useRef } from 'react';
import {
  View, StyleSheet, Modal, Animated, Pressable,
  TouchableWithoutFeedback, Dimensions, KeyboardAvoidingView, Platform
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Radius, Spacing } from '@/constants/theme';

interface CenteredModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function CenteredModal({ visible, onClose, children }: CenteredModalProps) {
  const { colors } = useAppTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={onClose}
      animationType="none"
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          {/* Backdrop Blur */}
          <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFillObject}>
            <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
          </BlurView>

          {/* Centered Modal Content Card */}
          <Animated.View
            style={[
              styles.contentCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <TouchableWithoutFeedback>
              <View style={styles.childrenWrapper}>
                {children}
              </View>
            </TouchableWithoutFeedback>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const { width } = Dimensions.get('window');
const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  contentCard: {
    width: width > 500 ? 460 : '100%',
    borderRadius: Radius.lg,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
    overflow: 'hidden',
  },
  childrenWrapper: {
    padding: Spacing.xl,
  },
});
