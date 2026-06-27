import { useAuth } from '@/hooks/useAuth';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';

export default function RootScreen() {
  const { user, loading } = useAuth();

  if (loading) {
    console.log('[Index] Loading auth state...');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (user) {
    console.log('[Index] User authenticated, redirecting to /(tabs)');
    return <Redirect href="/(tabs)" />;
  }

  console.log('[Index] User not authenticated, redirecting to /login');
  return <Redirect href="/login" />;
}
