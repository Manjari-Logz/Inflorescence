import React from 'react';
import { StyleSheet, View, Dimensions, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface WatercolorBackgroundProps {
  children: React.ReactNode;
}

export function WatercolorBackground({ children }: WatercolorBackgroundProps) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      {/* Base deep navy background */}
      <View style={styles.baseBg} />

      {/* Main subtle diagonal ambient gradient */}
      <LinearGradient
        colors={['#06142A', '#0B1F3A', '#06142A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Ambient Blob 1 - Top Right Glowing blue */}
      <View style={styles.blobContainer} pointerEvents="none">
        <LinearGradient
          colors={['rgba(122, 162, 227, 0.12)', 'rgba(11, 31, 58, 0)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[styles.blob, styles.blob1]}
        />
      </View>

      {/* Ambient Blob 2 - Center Left Glowing deep teal/navy */}
      <View style={styles.blobContainer} pointerEvents="none">
        <LinearGradient
          colors={['rgba(184, 213, 255, 0.08)', 'rgba(6, 20, 42, 0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.blob, styles.blob2]}
        />
      </View>

      {/* Ambient Blob 3 - Bottom Right Glowing */}
      <View style={styles.blobContainer} pointerEvents="none">
        <LinearGradient
          colors={['rgba(122, 162, 227, 0.06)', 'rgba(11, 31, 58, 0)']}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          style={[styles.blob, styles.blob3]}
        />
      </View>

      {/* Content wrapper */}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#06142A',
  },
  baseBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#06142A',
  },
  blobContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
  },
  blob1: {
    width: width * 0.9,
    height: width * 0.9,
    top: -height * 0.1,
    right: -width * 0.2,
  },
  blob2: {
    width: width * 0.8,
    height: width * 0.8,
    top: height * 0.3,
    left: -width * 0.3,
  },
  blob3: {
    width: width * 1.0,
    height: width * 1.0,
    bottom: -height * 0.15,
    right: -width * 0.3,
  },
  content: {
    flex: 1,
  },
});
