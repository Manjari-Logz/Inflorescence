import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';

interface WatercolorBackgroundProps {
  children: ReactNode;
}

export function WatercolorBackground({ children }: WatercolorBackgroundProps) {
  return (
    <View style={styles.root}>
      {/* Subtle layered circles to simulate a soft watercolor wash */}
      <View style={[styles.blob, styles.blobTopLeft]} />
      <View style={[styles.blob, styles.blobTopRight]} />
      <View style={[styles.blob, styles.blobBottomCenter]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000B29',
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.06,
  },
  blobTopLeft: {
    width: 300,
    height: 300,
    backgroundColor: '#3B82F6',
    top: -80,
    left: -80,
  },
  blobTopRight: {
    width: 240,
    height: 240,
    backgroundColor: '#8B5CF6',
    top: 60,
    right: -60,
  },
  blobBottomCenter: {
    width: 360,
    height: 360,
    backgroundColor: '#0EA5E9',
    bottom: -100,
    alignSelf: 'center',
  },
});
