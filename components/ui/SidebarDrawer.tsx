import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, Modal, Animated, Dimensions, ScrollView, TextInput, Keyboard
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Typography, Spacing, Radius } from '@/constants/theme';
import { useAuth } from '@/template';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.82;

interface SidebarDrawerProps {
  visible: boolean;
  onClose: () => void;
}

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  emoji: string;
}

const MENU_ITEMS: MenuItem[] = [
  { label: 'Dashboard', icon: 'dashboard', route: '/(tabs)/', emoji: '🏠' },
  { label: 'Study Chamber', icon: 'menu-book', route: '/(tabs)/study', emoji: '📚' },
  { label: 'Events & Hackathons', icon: 'event', route: '/(tabs)/events', emoji: '📅' },
  { label: 'Tasks', icon: 'check-circle-outline', route: '/(tabs)/tasks', emoji: '✅' },
  { label: 'Goals', icon: 'flag', route: '/(tabs)/goals', emoji: '🎯' },
  { label: 'Books', icon: 'book', route: '/modules/books', emoji: '📖' },
  { label: 'Podcasts', icon: 'headphones', route: '/modules/podcasts', emoji: '🎧' },
  { label: 'Placement Drive', icon: 'work', route: '/modules/placement', emoji: '💼' },
  { label: 'Exercise', icon: 'fitness-center', route: '/modules/exercise', emoji: '🏃' },
  { label: 'Daily Reflection', icon: 'edit-note', route: '/modules/reflection', emoji: '📝' },
  { label: 'Analytics', icon: 'analytics', route: '/modules/analytics', emoji: '📊' },
  { label: 'Badge Collection', icon: 'military-tech', route: '/modules/badges', emoji: '🏆' },
  { label: 'Custom Sections', icon: 'dashboard-customize', route: '/modules/custom-sections', emoji: '🧩' },
  { label: 'Profile', icon: 'person', route: '/(tabs)/profile', emoji: '⚙️' },
];

export function SidebarDrawer({ visible, onClose }: SidebarDrawerProps) {
  const insets = useSafeAreaInsets();
  const { colors, mode } = useAppTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setSearch(''); // Reset search when opening
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [visible]);

  const handleNavigate = (route: string) => {
    Keyboard.dismiss();
    onClose();
    setTimeout(() => {
      if (route.startsWith('/(tabs)')) {
        router.replace(route as any);
      } else {
        router.push(route as any);
      }
    }, 200);
  };

  const filteredItems = MENU_ITEMS.filter(item =>
    item.label.toLowerCase().includes(search.toLowerCase())
  );

  const displayName = user?.username ?? user?.email?.split('@')[0] ?? 'Champion';

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={onClose}
      animationType="none"
    >
      <View style={styles.container}>
        {/* Backdrop */}
        <Animated.View 
          style={[
            styles.backdrop, 
            { 
              opacity: fadeAnim,
              backgroundColor: colors.overlay 
            }
          ]}
        >
          <Pressable style={styles.pressableBackdrop} onPress={onClose} />
        </Animated.View>

        {/* Drawer Body */}
        <Animated.View
          style={[
            styles.drawer,
            {
              width: DRAWER_WIDTH,
              transform: [{ translateX: slideAnim }],
              backgroundColor: colors.glass,
              borderColor: colors.border,
              paddingTop: insets.top + Spacing.sm,
              paddingBottom: insets.bottom + Spacing.md,
            }
          ]}
        >
          {/* Logo Row */}
          <View style={styles.header}>
            <View style={styles.logoRow}>
              <Text style={[styles.logoText, { color: colors.text }]}>🌸 Inflorescence</Text>
              <Pressable onPress={onClose} hitSlop={12}>
                <MaterialIcons name="close" size={22} color={colors.textSecondary} />
              </Pressable>
            </View>

            {/* Search Bar */}
            <View style={[styles.searchContainer, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
              <MaterialIcons name="search" size={18} color={colors.textMuted} style={styles.searchIcon} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search modules..."
                placeholderTextColor={colors.textDim}
                style={[styles.searchInput, { color: colors.text }]}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {search.length > 0 && (
                <Pressable onPress={() => setSearch('')} hitSlop={8}>
                  <MaterialIcons name="cancel" size={16} color={colors.textMuted} />
                </Pressable>
              )}
            </View>
          </View>

          {/* Menu Items List */}
          <ScrollView 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {filteredItems.length === 0 ? (
              <View style={styles.noResults}>
                <Text style={[styles.noResultsText, { color: colors.textMuted }]}>No matching modules</Text>
              </View>
            ) : (
              filteredItems.map((item) => {
                const isSelected = pathname === item.route || 
                                  (item.route === '/(tabs)/' && pathname === '/');
                return (
                  <Pressable
                    key={item.label}
                    style={[
                      styles.menuItem,
                      isSelected && { 
                        backgroundColor: 'rgba(41,182,246,0.15)',
                        borderColor: colors.accent 
                      }
                    ]}
                    onPress={() => handleNavigate(item.route)}
                  >
                    <Text style={styles.menuEmoji}>{item.emoji}</Text>
                    <Text 
                      style={[
                        styles.menuLabel, 
                        { 
                          color: isSelected ? colors.accent : colors.text,
                          fontWeight: isSelected ? '700' : '500'
                        }
                      ]}
                    >
                      {item.label}
                    </Text>
                    {isSelected && (
                      <View style={[styles.activeIndicator, { backgroundColor: colors.accent }]} />
                    )}
                  </Pressable>
                );
              })
            )}
          </ScrollView>

          {/* Footer User Info */}
          <View style={[styles.footer, { borderTopColor: colors.borderLight }]}>
            <View style={styles.userRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{displayName.slice(0, 2).toUpperCase()}</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>{displayName}</Text>
                <Text style={[styles.userEmail, { color: colors.textMuted }]} numberOfLines={1}>{user?.email}</Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  },
  pressableBackdrop: {
    flex: 1,
  },
  drawer: {
    flex: 1,
    borderRightWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  header: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  logoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoText: {
    fontFamily: 'Arial',
    fontSize: 20,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    height: 40,
  },
  searchIcon: {
    marginRight: Spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Arial',
    fontSize: 14,
    padding: 0,
  },
  scrollContent: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    gap: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: Spacing.md,
  },
  menuEmoji: {
    fontSize: 18,
  },
  menuLabel: {
    fontFamily: 'Arial',
    fontSize: 14,
  },
  activeIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 'auto',
  },
  noResults: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  noResultsText: {
    fontFamily: 'Arial',
    fontSize: 14,
  },
  footer: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    marginTop: 'auto',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(41,182,246,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(41,182,246,0.3)',
  },
  avatarText: {
    color: '#0288D1',
    fontWeight: '700',
    fontSize: 13,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Arial',
  },
  userEmail: {
    fontSize: 11,
    fontFamily: 'Arial',
  },
});
