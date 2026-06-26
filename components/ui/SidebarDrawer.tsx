import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, Pressable, Modal, Animated, Dimensions, ScrollView, TextInput, Keyboard
} from 'react-native';
import {
  X,
  Search,
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Flag,
  Book,
  Headphones,
  Briefcase,
  Activity,
  Edit3,
  TrendingUp,
  Award,
  LayoutGrid,
  User,
  Wallet,
  History,
  Folder,
} from 'lucide-react-native';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Typography, Spacing, Radius } from '@/constants/theme';
import { useAuth } from '@/template';
import { useCustomSections } from '@/hooks/useModules';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.82;

interface SidebarDrawerProps {
  visible: boolean;
  onClose: () => void;
}

interface MenuItem {
  label: string;
  icon: React.ComponentType<any>;
  route: string;
}

const MENU_ITEMS: MenuItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, route: '/(tabs)/' },
  { label: 'Study Chamber', icon: BookOpen, route: '/(tabs)/study' },
  { label: 'Events & Hackathons', icon: CalendarDays, route: '/(tabs)/events' },
  { label: 'Tasks', icon: CheckCircle2, route: '/(tabs)/tasks' },
  { label: 'Goals', icon: Flag, route: '/(tabs)/goals' },
  { label: 'Books', icon: Book, route: '/modules/books' },
  { label: 'Podcasts', icon: Headphones, route: '/modules/podcasts' },
  { label: 'Placement Drive', icon: Briefcase, route: '/modules/placement' },
  { label: 'Exercise', icon: Activity, route: '/modules/exercise' },
  { label: 'Money Vault', icon: Wallet, route: '/modules/money-vault' },
  { label: 'Daily Reflection', icon: Edit3, route: '/modules/reflection' },
  { label: 'Analytics', icon: TrendingUp, route: '/modules/analytics' },
  { label: 'Badge Collection', icon: Award, route: '/modules/badges' },
  { label: 'Custom Sections', icon: LayoutGrid, route: '/modules/custom-sections' },
  { label: 'Task History', icon: History, route: '/modules/history' },
  { label: 'Profile', icon: User, route: '/(tabs)/profile' },
];

export function SidebarDrawer({ visible, onClose }: SidebarDrawerProps) {
  const insets = useSafeAreaInsets();
  const { colors, mode } = useAppTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { sections } = useCustomSections();
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

  // Build dynamic menu items including custom sections
  const allMenuItems = useMemo(() => {
    const customSectionItems: MenuItem[] = sections.map(section => ({
      label: section.name,
      icon: Folder,
      route: `/modules/custom-sections/${section.id}`,
    }));

    // Insert custom sections before "Custom Sections" management item
    const customSectionsIndex = MENU_ITEMS.findIndex(item => item.label === 'Custom Sections');
    if (customSectionsIndex >= 0) {
      return [
        ...MENU_ITEMS.slice(0, customSectionsIndex),
        ...customSectionItems,
        ...MENU_ITEMS.slice(customSectionsIndex)
      ];
    }
    return [...MENU_ITEMS, ...customSectionItems];
  }, [sections]);

  const filteredItems = allMenuItems.filter(item =>
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
              <Text style={[styles.logoText, { color: colors.text }]}>Inflorescence</Text>
              <Pressable onPress={onClose} hitSlop={12}>
                <X size={22} color={colors.textSecondary} />
              </Pressable>
            </View>

            {/* Search Bar */}
            <View style={[styles.searchContainer, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
              <Search size={18} color={colors.textMuted} strokeWidth={2} />
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
                  <X size={16} color={colors.textMuted} strokeWidth={2} />
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
                        backgroundColor: colors.accent + '18',
                        borderColor: colors.accent + '40' 
                      }
                    ]}
                    onPress={() => handleNavigate(item.route)}
                  >
                    <View style={styles.menuIconWrapper}>
                    <item.icon size={18} color={isSelected ? colors.accent : colors.textMuted} />
                  </View>
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
  menuIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
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
    fontWeight: '700',
    fontSize: 13,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 13,
    fontWeight: '600',
  },
  userEmail: {
    fontSize: 11,
  },
});
