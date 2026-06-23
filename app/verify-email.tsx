import React from 'react';
import { View, Text, StyleSheet, Pressable, StatusBar } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Typography, Spacing, Radius } from '@/constants/theme';
import { PrimaryButton } from '@/components/ui/PrimaryButton';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + 40, paddingBottom: insets.bottom + 32 }]}>
      <StatusBar barStyle={colors.text === '#F1F5F9' ? 'light-content' : 'dark-content'} />
      <View style={[styles.card, { backgroundColor: colors.glass, borderColor: colors.border }]}>
        <View style={[styles.iconBox, { backgroundColor: colors.accent + '18', borderColor: colors.accent + '30' }]}>
          <Text style={[styles.iconText, { color: colors.accent }]}>@</Text>
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Verify Your Email</Text>
        <Text style={[styles.sub, { color: colors.textMuted }]}>
          We sent a confirmation link to{'\n'}
          <Text style={{ color: colors.accent, fontWeight: '600' }}>{email ?? 'your email'}</Text>
        </Text>
        <Text style={[styles.hint, { color: colors.textDim }]}>Click the link in your email, then sign in. Or use OTP verification instead.</Text>
        <PrimaryButton title="Sign In with OTP" onPress={() => router.push({ pathname: '/verify-otp', params: { email: email ?? '' } })} style={{ width: '100%', marginTop: Spacing.lg }} />
        <Pressable onPress={() => router.replace('/login')} style={{ marginTop: Spacing.md }}>
          <Text style={[styles.link, { color: colors.accent }]}>Back to Sign In</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: Spacing.base, justifyContent: 'center' },
  card: { borderRadius: Radius.xl, borderWidth: 1, padding: Spacing.xxl, alignItems: 'center' },
  iconBox: { width: 72, height: 72, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg },
  iconText: { fontSize: 28, fontWeight: '700' },
  title: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.xxl, fontWeight: '700', textAlign: 'center' },
  sub: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.base, textAlign: 'center', marginTop: Spacing.md, lineHeight: 24 },
  hint: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.sm, textAlign: 'center', marginTop: Spacing.lg },
  link: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.base, fontWeight: '600' },
});
