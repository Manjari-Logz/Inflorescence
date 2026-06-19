import React, { useState } from 'react';
import { View, Pressable, StyleSheet, Modal, Text, Platform } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Home, CheckSquare, TrendingUp, Compass, User,
  Plus, X, BookOpen, Dumbbell, Trophy, Layers, ListTodo, Wallet,
} from 'lucide-react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Spacing, Radius, Typography } from '@/constants/theme';

function TabIcon({ icon: Icon, color, size }: { icon: any; color: string; size: number }) {
  return <Icon size={size} color={color} strokeWidth={2} />;
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const router = useRouter();
  const [fabOpen, setFabOpen] = useState(false);

  const tabBarHeight = Platform.select({ ios: insets.bottom + 56, android: insets.bottom + 56, default: 64 });

  const fabActions = [
    { label: 'Add Task', icon: ListTodo, route: '/(tabs)/tasks', color: colors.accent },
    { label: 'Add Book', icon: BookOpen, route: '/modules/books', color: '#8B5CF6' },
    { label: 'Log Exercise', icon: Dumbbell, route: '/modules/exercise', color: '#22C55E' },
    { label: 'Log Expense', icon: Wallet, route: '/modules/money-vault', color: '#F59E0B' },
    { label: 'Add Event', icon: Trophy, route: '/(tabs)/events', color: '#F59E0B' },
    { label: 'Custom Section', icon: Layers, route: '/modules/custom-sections', color: '#06B6D4' },
  ];

  return (
    <>
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
          name="study"
          options={{
            title: '',
            tabBarIcon: () => <View style={styles.fabPlaceholder} />,
            tabBarButton: () => (
              <Pressable
                style={[styles.fabBtn, { backgroundColor: colors.accent }]}
                onPress={() => setFabOpen(true)}
              >
                <Plus size={26} color="#fff" strokeWidth={2.5} />
              </Pressable>
            ),
          }}
        />
        <Tabs.Screen
          name="goals"
          options={{
            title: 'Progress',
            tabBarIcon: ({ color, size }) => <TabIcon icon={TrendingUp} color={color} size={size} />,
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
      </Tabs>

      {/* FAB Modal */}
      <Modal visible={fabOpen} transparent animationType="fade" onRequestClose={() => setFabOpen(false)}>
        <Pressable style={styles.fabOverlay} onPress={() => setFabOpen(false)}>
          <View style={[styles.fabMenu, { backgroundColor: colors.surface, borderColor: colors.border, marginBottom: tabBarHeight + 8 }]}>
            {fabActions.map((action, idx) => (
              <Pressable
                key={idx}
                style={({ pressed }) => [styles.fabAction, pressed && { opacity: 0.7 }]}
                onPress={() => {
                  setFabOpen(false);
                  router.push(action.route as any);
                }}
              >
                <View style={[styles.fabActionIcon, { backgroundColor: action.color + '18' }]}>
                  <action.icon size={20} color={action.color} strokeWidth={2} />
                </View>
                <Text style={[styles.fabActionLabel, { color: colors.text }]}>{action.label}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable style={[styles.fabClose, { backgroundColor: colors.error }]} onPress={() => setFabOpen(false)}>
            <X size={22} color="#fff" strokeWidth={2.5} />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fabPlaceholder: { width: 56, height: 56 },
  fabBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  fabMenu: {
    width: '100%',
    borderRadius: Radius.xl,
    borderWidth: 1,
    paddingVertical: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  fabAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  fabActionIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabActionLabel: {
    fontSize: Typography.sizes.base,
    fontWeight: '600',
  },
  fabClose: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
