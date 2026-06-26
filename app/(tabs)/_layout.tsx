import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, CheckSquare, Target, Flame, Timer, User } from 'lucide-react-native';
import { useAppTheme } from '@/hooks/useAppTheme';

function TabIcon({ icon: Icon, color, size }: { icon: any; color: string; size: number }) {
  return <Icon size={size} color={color} strokeWidth={2} />;
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

  const tabBarHeight = Platform.select({
    ios: insets.bottom + 56,
    android: insets.bottom + 56,
    default: 64,
  });

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: tabBarHeight,
          paddingTop: 6,
          paddingBottom: Platform.select({ ios: insets.bottom + 4, android: insets.bottom + 4, default: 8 }),
          paddingHorizontal: 4,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarItemStyle: { paddingVertical: 2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <TabIcon icon={Home} color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color, size }) => <TabIcon icon={CheckSquare} color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: 'Goals',
          tabBarIcon: ({ color, size }) => <TabIcon icon={Target} color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="habits"
        options={{
          title: 'Habits',
          tabBarIcon: ({ color, size }) => <TabIcon icon={Flame} color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="focus"
        options={{
          title: 'Focus',
          tabBarIcon: ({ color, size }) => <TabIcon icon={Timer} color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <TabIcon icon={User} color={color} size={size} />,
        }}
      />
      {/* Hidden tabs accessible via navigation */}
      <Tabs.Screen name="events" options={{ href: null }} />
      <Tabs.Screen name="study" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({});
