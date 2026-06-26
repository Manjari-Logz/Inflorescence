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
import { NotificationInitializer } from '@/components/feature/NotificationInitializer';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AlertProvider>
        <SafeAreaProvider>
          <AuthProvider>
            <BadgesProvider>
              <TasksProvider>
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
              </TasksProvider>
            </BadgesProvider>
          </AuthProvider>
        </SafeAreaProvider>
      </AlertProvider>
    </ThemeProvider>
  );
}
