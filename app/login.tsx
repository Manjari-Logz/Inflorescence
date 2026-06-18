import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, KeyboardAvoidingView,
  Platform, Pressable, StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth, useAlert } from '@/template';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { AppInput } from '@/components/ui/AppInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';

export default function LoginScreen() {
  const { signInWithPassword, signUpWithPassword, operationLoading } = useAuth();
  const { showAlert } = useAlert();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password) { showAlert('Missing Fields', 'Please enter email and password.'); return; }
    const { error } = await signInWithPassword(email.trim(), password);
    if (error) showAlert('Login Failed', error);
  };

  const handleRegister = async () => {
    if (!email.trim() || !password) { showAlert('Missing Fields', 'Please fill all fields.'); return; }
    if (password !== confirmPassword) { showAlert('Password Mismatch', 'Passwords do not match.'); return; }
    if (password.length < 6) { showAlert('Weak Password', 'Password must be at least 6 characters.'); return; }
    const { error, needsEmailConfirmation } = await signUpWithPassword(email.trim(), password);
    if (error) { showAlert('Registration Failed', error); return; }
    if (needsEmailConfirmation) showAlert('Check Your Email', 'A confirmation link has been sent to your email.');
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={[styles.heroSection, { paddingTop: insets.top + 20 }]}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoEmoji}>🌸</Text>
          </View>
          <Text style={styles.appName}>Inflorescence</Text>
          <Text style={styles.tagline}>Your Personal Life Operating System</Text>
        </View>

        {/* Auth Card */}
        <View style={styles.card}>
          {/* Tab Toggle */}
          <View style={styles.tabRow}>
            <Pressable
              style={[styles.tab, mode === 'login' && styles.activeTab]}
              onPress={() => setMode('login')}
            >
              <Text style={[styles.tabText, mode === 'login' && styles.activeTabText]}>Sign In</Text>
            </Pressable>
            <Pressable
              style={[styles.tab, mode === 'register' && styles.activeTab]}
              onPress={() => setMode('register')}
            >
              <Text style={[styles.tabText, mode === 'register' && styles.activeTabText]}>Sign Up</Text>
            </Pressable>
          </View>

          <Text style={styles.cardTitle}>
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </Text>
          <Text style={styles.cardSubtitle}>
            {mode === 'login'
              ? 'Sign in to continue your journey'
              : 'Start your productivity journey today'}
          </Text>

          <View style={styles.form}>
            <AppInput
              label="Email"
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            <AppInput
              label="Password"
              placeholder="Min 6 characters"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            {mode === 'register' ? (
              <AppInput
                label="Confirm Password"
                placeholder="Re-enter password"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            ) : null}

            <PrimaryButton
              title={mode === 'login' ? 'Sign In' : 'Create Account'}
              onPress={mode === 'login' ? handleLogin : handleRegister}
              loading={operationLoading}
              style={styles.submitBtn}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>
              {mode === 'login' ? 'New to Inflorescence? ' : 'Already have an account? '}
            </Text>
            <Pressable onPress={() => setMode(mode === 'login' ? 'register' : 'login')}>
              <Text style={styles.switchLink}>{mode === 'login' ? 'Sign Up' : 'Sign In'}</Text>
            </Pressable>
          </View>
        </View>

        {/* Feature Pills */}
        <View style={styles.features}>
          {['🏆 Gamified', '📚 Study', '🎯 Goals', '📅 Events', '😊 Mood'].map(f => (
            <View key={f} style={styles.featurePill}>
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.base,
  },
  heroSection: {
    alignItems: 'center',
    paddingBottom: Spacing.xxl,
  },
  logoContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(41, 182, 246, 0.12)',
    borderWidth: 2,
    borderColor: Colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.base,
  },
  logoEmoji: {
    fontSize: 44,
  },
  appName: {
    color: Colors.text,
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.xxxl,
    fontWeight: Typography.weights.bold,
    letterSpacing: 0.5,
  },
  tagline: {
    color: Colors.textSecondary,
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.sm,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  card: {
    backgroundColor: Colors.glass,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceLight,
    borderRadius: Radius.md,
    padding: 4,
    marginBottom: Spacing.xl,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: Radius.sm,
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    color: Colors.textMuted,
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
  },
  activeTabText: {
    color: Colors.text,
    fontWeight: Typography.weights.semibold,
  },
  cardTitle: {
    color: Colors.text,
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.xs,
  },
  cardSubtitle: {
    color: Colors.textMuted,
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.sm,
    marginBottom: Spacing.xl,
  },
  form: {
    gap: Spacing.xs,
  },
  submitBtn: {
    marginTop: Spacing.sm,
    width: '100%',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  switchText: {
    color: Colors.textMuted,
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.sm,
  },
  switchLink: {
    color: Colors.accent,
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
  features: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  featurePill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceLight,
  },
  featureText: {
    color: Colors.textSecondary,
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.sm,
  },
});
