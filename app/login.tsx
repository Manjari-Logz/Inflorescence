import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, KeyboardAvoidingView,
  Platform, Pressable, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth, useAlert } from '@/template';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Typography, Spacing, Radius } from '@/constants/theme';
import { AppInput } from '@/components/ui/AppInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';

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
    if (needsEmailConfirmation) router.push({ pathname: '/verify-email', params: { email: email.trim() } });
  };

  const handleSendOTP = async () => {
    if (!email.trim()) { showAlert('Email Required', 'Enter your email address.'); return; }
    const { error } = await sendOTP(email.trim());
    if (error) { showAlert('Error', error); return; }
    router.push({ pathname: '/verify-otp', params: { email: email.trim() } });
  };

  return (
    <KeyboardAvoidingView style={[styles.root, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle={colors.text === '#FFFFFF' ? 'light-content' : 'dark-content'} />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.heroSection, { paddingTop: insets.top + 20 }]}>
          <View style={[styles.logoContainer, { borderColor: colors.borderStrong, backgroundColor: colors.primary + '22' }]}>
            <Text style={styles.logoEmoji}>🌸</Text>
          </View>
          <Text style={[styles.appName, { color: colors.text }]}>Inflorescence</Text>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>Your Personal Growth Operating System</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.glass, borderColor: colors.border }]}>
          <View style={[styles.tabRow, { backgroundColor: colors.surfaceLight }]}>
            {(['login', 'register', 'otp'] as const).map(m => (
              <Pressable key={m} style={[styles.tab, mode === m && { backgroundColor: colors.primary }]} onPress={() => setMode(m)}>
                <Text style={[styles.tabText, { color: mode === m ? '#fff' : colors.textMuted }]}>
                  {m === 'login' ? 'Sign In' : m === 'register' ? 'Sign Up' : 'OTP'}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.cardTitle, { color: colors.text }]}>
            {mode === 'login' ? 'Welcome back' : mode === 'register' ? 'Create account' : 'Sign in with OTP'}
          </Text>
          <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>
            {mode === 'otp' ? 'We\'ll send a verification code to your email' : mode === 'login' ? 'Sign in to continue your journey' : 'Start your productivity journey today'}
          </Text>

          <View style={styles.form}>
            <AppInput label="Email" placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
            {mode !== 'otp' ? (
              <AppInput label="Password" placeholder="Min 6 characters" secureTextEntry value={password} onChangeText={setPassword} />
            ) : null}
            {mode === 'register' ? (
              <AppInput label="Confirm Password" placeholder="Re-enter password" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />
            ) : null}

            <PrimaryButton
              title={mode === 'login' ? 'Sign In' : mode === 'register' ? 'Create Account' : 'Send OTP Code'}
              onPress={mode === 'login' ? handleLogin : mode === 'register' ? handleRegister : handleSendOTP}
              loading={operationLoading}
              style={styles.submitBtn}
            />

            {mode === 'login' ? (
              <Pressable onPress={() => router.push('/forgot-password')} style={styles.forgotRow}>
                <Text style={[styles.forgotText, { color: colors.accent }]}>Forgot Password?</Text>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.switchRow}>
            <Text style={[styles.switchText, { color: colors.textMuted }]}>
              {mode === 'login' ? 'New to Inflorescence? ' : 'Already have an account? '}
            </Text>
            <Pressable onPress={() => setMode(mode === 'login' ? 'register' : 'login')}>
              <Text style={[styles.switchLink, { color: colors.accent }]}>{mode === 'login' ? 'Sign Up' : 'Sign In'}</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.features}>
          {['🏆 Badges', '📚 Study', '🎯 Goals', '📅 Events', '😊 Mood', '📖 Books'].map(f => (
            <View key={f} style={[styles.featurePill, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
              <Text style={[styles.featureText, { color: colors.textSecondary }]}>{f}</Text>
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
  heroSection: { alignItems: 'center', paddingBottom: Spacing.xxl },
  logoContainer: { width: 88, height: 88, borderRadius: 44, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.base },
  logoEmoji: { fontSize: 44 },
  appName: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.xxxl, fontWeight: Typography.weights.bold, letterSpacing: 0.5 },
  tagline: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.sm, marginTop: Spacing.xs, textAlign: 'center' },
  card: { borderRadius: Radius.xl, borderWidth: 1, padding: Spacing.xl, marginBottom: Spacing.xl },
  tabRow: { flexDirection: 'row', borderRadius: Radius.md, padding: 4, marginBottom: Spacing.xl },
  tab: { flex: 1, paddingVertical: Spacing.sm, alignItems: 'center', borderRadius: Radius.sm },
  tabText: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.sm, fontWeight: Typography.weights.medium },
  cardTitle: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, marginBottom: Spacing.xs },
  cardSubtitle: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.sm, marginBottom: Spacing.xl },
  form: { gap: Spacing.xs },
  submitBtn: { marginTop: Spacing.sm, width: '100%' },
  forgotRow: { alignItems: 'center', marginTop: Spacing.md },
  forgotText: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.sm, fontWeight: '600' },
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.lg },
  switchText: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.sm },
  switchLink: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold },
  features: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing.sm },
  featurePill: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.full, borderWidth: 1 },
  featureText: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.sm },
});
