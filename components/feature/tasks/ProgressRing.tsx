import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  progress: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  activeColor?: string;
  inactiveColor?: string;
  textColor?: string;
}

export function ProgressRing({
  progress,
  size = 64,
  strokeWidth = 6,
  activeColor = '#7AA2E3',
  inactiveColor = 'rgba(255, 255, 255, 0.08)',
  textColor = '#FFFFFF',
}: ProgressRingProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: isNaN(progress) ? 0 : Math.min(100, Math.max(0, progress)),
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [progress]);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Background Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={inactiveColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Active Circle */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={activeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.textContainer}>
        <Text style={[styles.text, { color: textColor }]}>
          {Math.round(progress)}%
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
});
