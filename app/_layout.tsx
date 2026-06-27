import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AlertProvider } from '@/hooks/useAlert';
import { AuthProvider } from '@/hooks/useAuth';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { DrawerProvider } from '@/contexts/DrawerContext';
import { NotificationsProvider } from '@/contexts/NotificationsContext';
import { TasksProvider } from '@/contexts/TasksContext';
import { EventsProvider } from '@/contexts/EventsContext';
import { StudyProvider } from '@/contexts/StudyContext';
import { GoalsProvider } from '@/contexts/GoalsContext';
import { HabitsProvider } from '@/contexts/HabitsContext';
import { BadgesProvider } from '@/contexts/BadgesContext';
import { MoodProvider } from '@/contexts/MoodContext';
import { BooksProvider } from '@/contexts/BooksContext';
import { PodcastProvider } from '@/contexts/PodcastContext';
import { PlacementProvider } from '@/contexts/PlacementContext';
import { CustomSectionsProvider } from '@/contexts/CustomSectionsContext';
import { ExerciseProvider } from '@/contexts/ExerciseContext';
import { ReflectionProvider } from '@/contexts/ReflectionContext';
import { MoneyVaultProvider } from '@/contexts/MoneyVaultContext';
import { NotesProvider } from '@/contexts/NotesContext';
import { NotificationInitializer } from '@/components/feature/NotificationInitializer';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AlertProvider>
        <SafeAreaProvider>
          <AuthProvider>
            <DrawerProvider>
              <NotificationsProvider>
                <BadgesProvider>
                  <TasksProvider>
                    <EventsProvider>
                      <StudyProvider>
                        <GoalsProvider>
                          <HabitsProvider>
                            <MoodProvider>
                              <BooksProvider>
                                <PodcastProvider>
                                  <PlacementProvider>
                                    <CustomSectionsProvider>
                                      <ExerciseProvider>
                                        <ReflectionProvider>
                                          <MoneyVaultProvider>
                                            <NotesProvider>
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
                                            </NotesProvider>
                                          </MoneyVaultProvider>
                                        </ReflectionProvider>
                                      </ExerciseProvider>
                                    </CustomSectionsProvider>
                                  </PlacementProvider>
                                </PodcastProvider>
                              </BooksProvider>
                            </MoodProvider>
                          </HabitsProvider>
                        </GoalsProvider>
                      </StudyProvider>
                    </EventsProvider>
                  </TasksProvider>
                </BadgesProvider>
              </NotificationsProvider>
            </DrawerProvider>
          </AuthProvider>
        </SafeAreaProvider>
      </AlertProvider>
    </ThemeProvider>
  );
}
