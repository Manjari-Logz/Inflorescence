import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AlertProvider, AuthProvider } from '@/template';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { TasksProvider } from '@/contexts/TasksContext';
import { EventsProvider } from '@/contexts/EventsContext';
import { StudyProvider } from '@/contexts/StudyContext';
import { GoalsProvider } from '@/contexts/GoalsContext';
import { BadgesProvider } from '@/contexts/BadgesContext';
import { MoodProvider } from '@/contexts/MoodContext';
import { BooksProvider } from '@/contexts/BooksContext';
import { PodcastProvider } from '@/contexts/PodcastContext';
import { PlacementProvider } from '@/contexts/PlacementContext';
import { CustomSectionsProvider } from '@/contexts/CustomSectionsContext';
import { ExerciseProvider } from '@/contexts/ExerciseContext';
import { ReflectionProvider } from '@/contexts/ReflectionContext';
import { MoneyVaultProvider } from '@/contexts/MoneyVaultContext';
import { HabitsProvider } from '@/contexts/HabitsContext';
import { NotesProvider } from '@/contexts/NotesContext';
import { NotificationsProvider } from '@/contexts/NotificationsContext';
import { DrawerProvider } from '@/contexts/DrawerContext';
import { SearchProvider } from '@/contexts/SearchContext';
import { NotificationInitializer } from '@/components/feature/NotificationInitializer';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { AlertTriangle, RefreshCw } from 'lucide-react-native';
import { ErrorBoundaryProps } from 'expo-router';

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View style={styles.errorContainer}>
      <View style={styles.errorContent}>
        <View style={styles.errorIconContainer}>
          <AlertTriangle size={40} color="#EF4444" />
        </View>
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorDescription}>
          The application encountered an unexpected issue and cannot render. You can try reloading or check the details below.
        </Text>
        <ScrollView style={styles.errorScroll}>
          <Text style={styles.errorDetailsText}>{error.stack || error.message || 'No stack trace available'}</Text>
        </ScrollView>
        <TouchableOpacity style={styles.retryButton} onPress={retry} activeOpacity={0.8}>
          <RefreshCw size={18} color="#FFFFFF" />
          <Text style={styles.retryButtonText}>Reload App</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AlertProvider>
        <AuthProvider>
          <TasksProvider>
            <ThemeProvider>
              <NotificationsProvider>
                <HabitsProvider>
                  <NotesProvider>
                    <DrawerProvider>
                      <BadgesProvider>
                        <EventsProvider>
                          <StudyProvider>
                            <GoalsProvider>
                              <MoodProvider>
                                <BooksProvider>
                                  <PodcastProvider>
                                    <PlacementProvider>
                                      <CustomSectionsProvider>
                                        <ExerciseProvider>
                                          <ReflectionProvider>
                                            <MoneyVaultProvider>
                                              <SearchProvider>
                                                <NotificationInitializer />
                                                <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
                                                  <Stack.Screen name="index" />
                                                  <Stack.Screen name="login" />
                                                  <Stack.Screen name="forgot-password" />
                                                  <Stack.Screen name="verify-otp" />
                                                  <Stack.Screen name="verify-email" />
                                                  <Stack.Screen name="(tabs)" />
                                                  <Stack.Screen name="modules" options={{ animation: 'slide_from_right' }} />
                                                </Stack>
                                              </SearchProvider>
                                            </MoneyVaultProvider>
                                          </ReflectionProvider>
                                        </ExerciseProvider>
                                      </CustomSectionsProvider>
                                    </PlacementProvider>
                                  </PodcastProvider>
                                </BooksProvider>
                              </MoodProvider>
                            </GoalsProvider>
                          </StudyProvider>
                        </EventsProvider>
                      </BadgesProvider>
                    </DrawerProvider>
                  </NotesProvider>
                </HabitsProvider>
              </NotificationsProvider>
            </ThemeProvider>
          </TasksProvider>
        </AuthProvider>
      </AlertProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: '#050D1A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorContent: {
    alignItems: 'center',
    maxWidth: 340,
    width: '100%',
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorDescription: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  errorScroll: {
    maxHeight: 180,
    width: '100%',
    backgroundColor: '#0B1528',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 12,
    marginBottom: 28,
  },
  errorDetailsText: {
    fontFamily: Platform.select({ ios: 'CourierNewPSMT', android: 'monospace', default: 'monospace' }),
    fontSize: 12,
    color: '#EF4444',
  },
  retryButton: {
    backgroundColor: '#0288D1',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#0288D1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
});
