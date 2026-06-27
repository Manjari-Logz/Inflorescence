import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Pressable, StatusBar } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useAlert } from '@/hooks/useAlert';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Typography, Spacing, Radius } from '@/constants/theme';
import { AppInput } from '@/components/ui/AppInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';

export default function VerifyOTPScreen() {
  const router = useRouter();
  const { email: paramEmail } = useLocalSearchParams<{ email?: string }>();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { verifyOTPAndLogin, resendOTP, operationLoading } = useAuth();
  const { showAlert } = useAlert();
  const [email, setEmail] = useState(paramEmail ?? '');
  const [otp, setOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleVerify = async () => {
    console.log('[VerifyOTP] Verify button pressed');
    console.log('[VerifyOTP] Email:', email);
    if (!email.trim() || !otp.trim()) { showAlert('Required', 'Enter email and OTP code.'); return; }
    const { error, user } = await verifyOTPAndLogin(email.trim(), otp.trim());
    console.log('[VerifyOTP] Verification result:', { error, hasUser: !!user });
    if (error) { showAlert('Verification Failed', error); return; }
    if (user) {
      console.log('[VerifyOTP] Verification successful, navigating to /(tabs)');
      router.replace('/(tabs)');
    }
  };

  const handleResend = async () => {
    if (!email.trim()) { showAlert('Email Required', 'Enter your email first.'); return; }
    if (resendCooldown > 0) return;
    const { error } = await resendOTP(email.trim());
    if (error) { showAlert('Error', error); return; }
    showAlert('OTP Sent', 'A new verification code has been sent.');
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown(c => {
        if (c <= 1) { clearInterval(interval); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  return (
    <KeyboardAvoidingView style={[styles.root, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle={colors.text === '#FFFFFF' ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 }]}>
        <Pressable onPress={() => router.back()}><Text style={[styles.backText, { color: colors.accent }]}>← Back</Text></Pressable>
        <Text style={[styles.title, { color: colors.text }]}>Verify OTP</Text>
        <Text style={[styles.sub, { color: colors.textMuted }]}>Enter the 6-digit code sent to your email.</Text>
        <View style={[styles.card, { backgroundColor: colors.glass, borderColor: colors.border }]}>
          <AppInput label="Email" placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
          <AppInput label="OTP Code" placeholder="123456" keyboardType="number-pad" value={otp} onChangeText={setOtp} maxLength={6} />
          <PrimaryButton title="Verify & Sign In" onPress={handleVerify} loading={operationLoading} style={{ marginTop: Spacing.md }} />
          <Pressable onPress={handleResend} disabled={resendCooldown > 0} style={styles.resendRow}>
            <Text style={[styles.resendText, { color: resendCooldown > 0 ? colors.textDim : colors.accent }]}>
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.base },
  backText: { fontSize: Typography.sizes.base, fontWeight: '600', marginBottom: Spacing.xl },
  emoji: { fontSize: 0, height: 0 },
  title: { fontSize: Typography.sizes.xxxl, fontWeight: '700', textAlign: 'center', marginBottom: Spacing.sm },
  sub: { fontSize: Typography.sizes.base, textAlign: 'center', marginTop: Spacing.sm, marginBottom: Spacing.xxl },
  card: { borderRadius: Radius.xl, borderWidth: 1, padding: Spacing.xl },
  resendRow: { alignItems: 'center', marginTop: Spacing.lg },
  resendText: { fontSize: Typography.sizes.base, fontWeight: '600' },
});
