import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, KeyboardAvoidingView,
  Platform, Pressable, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Zap, BookOpen, CheckSquare, Target, Activity, Trophy } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useAlert } from '@/hooks/useAlert';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Typography, Spacing, Radius } from '@/constants/theme';
import { AppInput } from '@/components/ui/AppInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';

const FEATURES = [
  { label: 'Tasks', icon: CheckSquare, color: '#3B82F6' },
  { label: 'Study', icon: BookOpen, color: '#8B5CF6' },
  { label: 'Goals', icon: Target, color: '#22C55E' },
  { label: 'Exercise', icon: Activity, color: '#F59E0B' },
  { label: 'Badges', icon: Trophy, color: '#F59E0B' },
];

export default function LoginScreen() {
  const router = useRouter();
  const { signInWithPassword, signUpWithPassword, sendOTP, operationLoading } = useAuth();
  const { showAlert } = useAlert();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'login' | 'register' | 'otp'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleLogin = async () => {
    console.log('[Login] Login button pressed');
    console.log('[Login] Email:', email);
    console.log('[Login] operationLoading:', operationLoading);
    if (!email.trim() || !password) { showAlert('Missing Fields', 'Please enter email and password.'); return; }
    const result = await signInWithPassword(email.trim(), password);
    console.log('[Login] Login result:', result);
    if (result.error) {
      showAlert('Login Failed', result.error);
    } else if (result.user) {
      console.log('[Login] Login successful, navigating to /(tabs)');
      router.replace('/(tabs)');
    }
  };

  const handleRegister = async () => {
    console.log('[Login] Signup button pressed');
    console.log('[Login] Email:', email);
    console.log('[Login] operationLoading:', operationLoading);
    if (!email.trim() || !password) { showAlert('Missing Fields', 'Please fill all fields.'); return; }
    if (password !== confirmPassword) { showAlert('Password Mismatch', 'Passwords do not match.'); return; }
    if (password.length < 6) { showAlert('Weak Password', 'Password must be at least 6 characters.'); return; }
    const result = await signUpWithPassword(email.trim(), password);
    console.log('[Login] Signup result:', result);
    if (result.error) { showAlert('Registration Failed', result.error); return; }
    if (result.needsEmailConfirmation) {
      console.log('[Login] Email confirmation required, navigating to /verify-email');
      router.push({ pathname: '/verify-email', params: { email: email.trim() } });
    } else {
      console.log('[Login] Email confirmation disabled, auto-entering app');
      console.log('[Login] Navigating to /(tabs)');
      router.replace('/(tabs)');
    }
  };

  const handleSendOTP = async () => {
    console.log('[Login] Send OTP button pressed');
    console.log('[Login] Email:', email);
    console.log('[Login] operationLoading:', operationLoading);
    if (!email.trim()) { showAlert('Email Required', 'Enter your email address.'); return; }
    const result = await sendOTP(email.trim());
    console.log('[Login] Send OTP result:', result);
    if (result.error) { showAlert('Error', result.error); return; }
    console.log('[Login] Navigating to /verify-otp');
    router.push({ pathname: '/verify-otp', params: { email: email.trim() } });
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle={colors.text === '#F1F5F9' ? 'light-content' : 'dark-content'} />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32, paddingTop: insets.top + 20 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo / Hero */}
        <View style={styles.hero}>
          <View style={[styles.logoMark, { backgroundColor: colors.accent + '18', borderColor: colors.accent + '30' }]}>
            <Zap size={32} color={colors.accent} strokeWidth={2} />
          </View>
          <Text style={[styles.appName, { color: colors.text }]}>Inflorescence</Text>
          <Text style={[styles.tagline, { color: colors.textMuted }]}>Personal Growth Operating System</Text>
        </View>

        {/* Auth Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Tab switcher */}
          <View style={[styles.tabRow, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
            {(['login', 'register', 'otp'] as const).map(m => (
              <Pressable
                key={m}
                style={[styles.tab, mode === m && { backgroundColor: colors.accent }]}
                onPress={() => setMode(m)}
              >
                <Text style={[styles.tabText, { color: mode === m ? '#fff' : colors.textMuted }]}>
                  {m === 'login' ? 'Sign In' : m === 'register' ? 'Sign Up' : 'OTP'}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.cardTitle, { color: colors.text }]}>
            {mode === 'login' ? 'Welcome back' : mode === 'register' ? 'Create account' : 'Magic link'}
          </Text>
          <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>
            {mode === 'otp'
              ? 'We\'ll send a verification code to your email'
              : mode === 'login'
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
            {mode !== 'otp' && (
              <AppInput
                label="Password"
                placeholder="Min 6 characters"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            )}
            {mode === 'register' && (
              <AppInput
                label="Confirm Password"
                placeholder="Re-enter password"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            )}

            <PrimaryButton
              title={mode === 'login' ? 'Sign In' : mode === 'register' ? 'Create Account' : 'Send Code'}
              onPress={mode === 'login' ? handleLogin : mode === 'register' ? handleRegister : handleSendOTP}
              loading={operationLoading}
              style={styles.submitBtn}
            />

            {mode === 'login' && (
              <Pressable onPress={() => router.push('/forgot-password')} style={styles.forgotRow}>
                <Text style={[styles.forgotText, { color: colors.accent }]}>Forgot password?</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.switchRow}>
            <Text style={[styles.switchText, { color: colors.textMuted }]}>
              {mode === 'login' ? 'New here? ' : 'Already have an account? '}
            </Text>
            <Pressable onPress={() => setMode(mode === 'login' ? 'register' : 'login')}>
              <Text style={[styles.switchLink, { color: colors.accent }]}>
                {mode === 'login' ? 'Sign Up' : 'Sign In'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Feature Chips */}
        <View style={styles.featuresRow}>
          {FEATURES.map(f => (
            <View key={f.label} style={[styles.featureChip, { backgroundColor: f.color + '12', borderColor: f.color + '30' }]}>
              <f.icon size={12} color={f.color} strokeWidth={2} />
              <Text style={[styles.featureText, { color: f.color }]}>{f.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.base },

  hero: { alignItems: 'center', paddingBottom: Spacing.xxl, gap: Spacing.sm },
  logoMark: {
    width: 72,
    height: 72,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  appName: {
    fontSize: Typography.sizes.xxxl,
    fontWeight: Typography.weights.bold,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: Typography.sizes.sm,
    textAlign: 'center',
  },

  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  tabRow: {
    flexDirection: 'row',
    borderRadius: Radius.md,
    padding: 4,
    marginBottom: Spacing.xl,
    borderWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: Radius.sm,
  },
  tabText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
  cardTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.xs,
  },
  cardSubtitle: {
    fontSize: Typography.sizes.sm,
    marginBottom: Spacing.xl,
    lineHeight: 20,
  },
  form: { gap: Spacing.xs },
  submitBtn: { marginTop: Spacing.sm, width: '100%' },
  forgotRow: { alignItems: 'center', marginTop: Spacing.md },
  forgotText: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold },
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.lg },
  switchText: { fontSize: Typography.sizes.sm },
  switchLink: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold },

  featuresRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing.sm },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  featureText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.semibold },
});
