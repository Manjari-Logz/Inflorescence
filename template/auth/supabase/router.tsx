// @ts-nocheck
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useAuth } from './hook';

const DefaultLoadingScreen = () => (
  <View style={styles.defaultContainer}>
    <Text style={styles.defaultText}>Loading...</Text>
  </View>
);

interface AuthRouterProps {
  children: React.ReactNode;
  loginRoute?: string;
  loadingComponent?: React.ComponentType;
  excludeRoutes?: string[];
}

export function AuthRouter({
  children,
  loginRoute = '/login',
  loadingComponent: LoadingComponent = DefaultLoadingScreen,
  excludeRoutes = []
}: AuthRouterProps) {
  const { user, loading, initialized } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [timedOut, setTimedOut] = React.useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      console.warn('[AuthRouter] Loading timed out. Forcing app to render.');
      setTimedOut(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const isEffectiveLoading = (loading || !initialized) && !timedOut;

  useEffect(() => {
    if (isEffectiveLoading) {
      return;
    }

    const isLoginRoute = pathname === loginRoute;
    const isExcludedRoute = excludeRoutes.some(route => 
      pathname.startsWith(route)
    );

    const effectiveUser = user || ((global as any).isOfflineMode ? { id: 'offline-user' } : null);

    const action = !effectiveUser && !isLoginRoute && !isExcludedRoute ? 'redirect_to_login' :
                   effectiveUser && isLoginRoute ? 'redirect_to_home' : 'no_action';

    if (action === 'redirect_to_login') {
      router.push(loginRoute);
    } else if (action === 'redirect_to_home') {
      router.replace('/');
    }
  }, [user?.id, loading, initialized, timedOut, pathname, loginRoute, excludeRoutes, router]);

  if (isEffectiveLoading) {
    return <LoadingComponent />;
  }

  const isLoginRoute = pathname === loginRoute;
  const isExcludedRoute = excludeRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  const effectiveUser = user || ((global as any).isOfflineMode ? { id: 'offline-user' } : null);
  
  if (isLoginRoute || isExcludedRoute || effectiveUser) {
    return <>{children}</>;
  }

  return <LoadingComponent />;
}

const styles = StyleSheet.create({
  defaultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#050D1A',
  },
  defaultText: {
    fontSize: 18,
    color: '#94A3B8',
  },
});