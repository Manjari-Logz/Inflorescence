import { AuthRouter } from '@/template';
import { Redirect } from 'expo-router';

export default function RootScreen() {
  return (
    <AuthRouter loginRoute="/login" excludeRoutes={['/forgot-password', '/verify-otp', '/verify-email']}>
      <Redirect href="/(tabs)" />
    </AuthRouter>
  );
}
