import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Pressable, StatusBar, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useAlert } from '@/hooks/useAlert';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Typography, Spacing, Radius } from '@/constants/theme';
import { AppInput } from '@/components/ui/AppInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { resetPassword, operationLoading } = useAuth();
  const { showAlert } = useAlert();
  const [email, setEmail] = useState('');

  const handleReset = async () => {
    if (!email.trim()) { showAlert('Email Required', 'Enter your email address.'); return; }
    const { error } = await resetPassword(email.trim());
    if (error) { showAlert('Error', error); return; }
    Alert.alert('Check Your Email', 'A password reset link has been sent to your email.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <KeyboardAvoidingView style={[styles.root, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle={colors.text === '#FFFFFF' ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 }]}>
        <Pressable onPress={() => router.back()} style={styles.backLink}>
          <Text style={[styles.backText, { color: colors.accent }]}>← Back to Sign In</Text>
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>Forgot Password</Text>
        <Text style={[styles.sub, { color: colors.textMuted }]}>Enter your email and we&apos;ll send a reset link.</Text>
        <View style={[styles.card, { backgroundColor: colors.glass, borderColor: colors.border }]}>
          <AppInput label="Email" placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
          <PrimaryButton title="Send Reset Link" onPress={handleReset} loading={operationLoading} style={{ marginTop: Spacing.md }} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.base },
  backLink: { marginBottom: Spacing.xl },
  backText: { fontSize: Typography.sizes.base, fontWeight: '600' },
  title: { fontSize: Typography.sizes.xxxl, fontWeight: '700', textAlign: 'center', marginBottom: Spacing.sm },
  sub: { fontSize: Typography.sizes.base, textAlign: 'center', marginTop: Spacing.sm, marginBottom: Spacing.xxl },
  card: { borderRadius: Radius.xl, borderWidth: 1, padding: Spacing.xl },
});
