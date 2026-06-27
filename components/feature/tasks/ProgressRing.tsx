import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  progress: number; // 0–100
  size?: number;
  strokeWidth?: number;
  activeColor?: string;
  inactiveColor?: string;
  textColor?: string;
}

export function ProgressRing({
  progress,
  size = 68,
  strokeWidth = 6,
  activeColor = '#7AA2E3',
  inactiveColor = 'rgba(255, 255, 255, 0.06)',
  textColor = '#FFFFFF',
}: ProgressRingProps) {
  const clampedProgress = isNaN(progress) ? 0 : Math.min(100, Math.max(0, progress));
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: clampedProgress,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [clampedProgress, animatedValue]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });
  const center = size / 2;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        {/* Background track */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={inactiveColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress arc */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={activeColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${center}, ${center}`}
        />
      </Svg>
      <Text style={{ color: textColor, fontSize: size * 0.22, fontWeight: '700' }}>
        {Math.round(clampedProgress)}%
      </Text>
    </View>
  );
}
