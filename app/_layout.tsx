import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AlertProvider, AuthProvider } from '@/template';
import { TasksProvider } from '@/contexts/TasksContext';
import { EventsProvider } from '@/contexts/EventsContext';
import { StudyProvider } from '@/contexts/StudyContext';
import { GoalsProvider } from '@/contexts/GoalsContext';
import { BadgesProvider } from '@/contexts/BadgesContext';
import { MoodProvider } from '@/contexts/MoodContext';

export default function RootLayout() {
  return (
    <AlertProvider>
      <SafeAreaProvider>
        <AuthProvider>
          <BadgesProvider>
            <TasksProvider>
              <EventsProvider>
                <StudyProvider>
                  <GoalsProvider>
                    <MoodProvider>
                      <Stack screenOptions={{ headerShown: false }}>
                        <Stack.Screen name="index" />
                        <Stack.Screen name="login" />
                        <Stack.Screen name="(tabs)" />
                      </Stack>
                    </MoodProvider>
                  </GoalsProvider>
                </StudyProvider>
              </EventsProvider>
            </TasksProvider>
          </BadgesProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </AlertProvider>
  );
}
