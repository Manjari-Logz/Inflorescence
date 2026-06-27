import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Modal, StatusBar, Dimensions, TextInput, FlatList, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Svg, Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Bell, Search, CheckCircle2, Clock, Flame, Star,
  BookOpen, Activity, Trophy, Target, ChevronRight,
  Timer, X, Wallet, Menu, Sparkles, Trash2, CheckCircle, Sun, Sunset, Moon, Calendar
} from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useAlert } from '@/hooks/useAlert';
import { useTasks } from '@/hooks/useTasks';
import { useBadges } from '@/hooks/useBadges';
import { useEvents } from '@/hooks/useEvents';
import { useBooks, useExercise, useMoneyVault, useCustomSections } from '@/hooks/useModules';
import { useGoals } from '@/hooks/useGoals';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useDrawer } from '@/contexts/DrawerContext';
import { useNotifications } from '@/hooks/useNotifications';
import { useHabits } from '@/hooks/useHabits';
import { useStudy } from '@/hooks/useStudy';
import { useNotes } from '@/hooks/useNotes';
import { useSafeTabBarHeight } from '@/hooks/useSafeTabBarHeight';
import { Typography, Spacing, Radius, Colors } from '@/constants/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { PomodoroTimer } from '@/components/feature/PomodoroTimer';
import { BadgeAchievement } from '@/components/feature/BadgeAchievement';

const { width } = Dimensions.get('window');

function getGreeting() {
  const h = new Date().getHours();
  const GreetingIcons = {
    morning: Sun,
    afternoon: Sunset,
    evening: Moon
  };
  if (h < 12) return { text: 'Good Morning', icon: GreetingIcons.morning, quote: "Every morning starts a new page in your story. Make it a great one today!" };
  if (h < 17) return { text: 'Good Afternoon', icon: GreetingIcons.afternoon, quote: "Keep the momentum going. You're doing amazing things!" };
  return { text: 'Good Evening', icon: GreetingIcons.evening, quote: "Reflect on your wins, rest well, and prepare for tomorrow's opportunities." };
}

function CircularProgress({ size, strokeWidth, progress, color }: { size: number, strokeWidth: number, progress: number, color: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.max(0, Math.min(progress, 100)) / 100) * circumference;

  return (
    <Svg width={size} height={size}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="rgba(255, 255, 255, 0.08)"
        strokeWidth={strokeWidth}
        fill="transparent"
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        fill="transparent"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { openDrawer } = useDrawer();
  const { user } = useAuth();
  const { tasks } = useTasks();
  const { badges } = useBadges();
  const { hackathons } = useEvents();
  const { books } = useBooks();
  const { logs: exerciseLogs } = useExercise();
  const { expenses, settings: moneySettings } = useMoneyVault();
  const { shortGoals } = useGoals();
  const { showAlert } = useAlert();
  
  // New hooks for search & notifications
  const { notifications, unreadCount, markRead, deleteNotification, clearAll } = useNotifications();
  const { habits } = useHabits();
  const { domains } = useStudy();
  const { notes } = useNotes();
  const { sections } = useCustomSections();
  const tabBarHeight = useSafeTabBarHeight();

  const [pomodoroModal, setPomodoroModal] = useState(false);
  const [badgePreview, setBadgePreview] = useState<{ type: string; name: string } | null>(null);
  
  // Search & Notification modal states
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const today = new Date();
  const { text: greetingText, icon: GreetingIcon, quote: motivationQuote } = getGreeting();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const displayName = user?.username ?? user?.email?.split('@')[0] ?? 'there';

  const todayTasks = tasks.filter(t => {
    if (t.completed) return false;
    if (!t.deadline) return false;
    return new Date(t.deadline).toDateString() === today.toDateString();
  });

  const completedToday = tasks.filter(t => {
    if (!t.completed || !t.completed_at) return false;
    return new Date(t.completed_at).toDateString() === today.toDateString();
  });

  // Reading stats
  const readingProgress = books.length > 0 ? Math.round((books.filter(b => b.status === 'completed').length / books.length) * 100) : 0;

  // Exercise stats
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const weeklyCalories = exerciseLogs.filter(l => new Date(l.date) >= weekAgo).reduce((a, l) => a + l.calories, 0);

  // Money balance
  const totalBalance = moneySettings ? (moneySettings.cash_in_hand + moneySettings.wallet_balance + moneySettings.bank_balance) : 0;

  // Goals
  const completedGoals = shortGoals.filter(g => g.completed).length;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const upcomingEvents = hackathons
    .filter(h => h.end_date && new Date(h.end_date) >= today)
    .sort((a, b) => new Date(a.end_date!).getTime() - new Date(b.end_date!).getTime())
    .slice(0, 2);

  const priorityColor = (p: string) => Colors.priority[p] ?? colors.accent;

  const moduleShortcuts = [
    { label: 'Study', icon: BookOpen, route: '/(tabs)/study', color: '#60A5FA' },
    { label: 'Events', icon: Calendar, route: '/(tabs)/events', color: '#FBBF24' },
    { label: 'Books', icon: BookOpen, route: '/modules/books', color: '#A78BFA' },
    { label: 'Exercise', icon: Activity, route: '/modules/exercise', color: '#34D399' },
    { label: 'Money', icon: Wallet, route: '/modules/money-vault', color: '#F59E0B' },
    { label: 'Goals', icon: Target, route: '/(tabs)/goals', color: '#F472B6' },
  ];

  // In-memory real-time search filtering
  const [searchResults, setSearchResults] = useState<{
    tasks: any[];
    goals: any[];
    habits: any[];
    study: any[];
    books: any[];
    events: any[];
    sections: any[];
    notes: any[];
  }>({
    tasks: [],
    goals: [],
    habits: [],
    study: [],
    books: [],
    events: [],
    sections: [],
    notes: [],
  });

  const filterSearchResults = (query: string) => {
    const q = query.toLowerCase();
    if (!q) {
      setSearchResults({ tasks: [], goals: [], habits: [], study: [], books: [], events: [], sections: [], notes: [] });
      return;
    }
    setSearchResults({
      tasks: tasks.filter(t => t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q))),
      goals: shortGoals.filter(g => g.title.toLowerCase().includes(q)),
      habits: habits.filter(h => h.name.toLowerCase().includes(q)),
      study: domains.filter(d => d.name.toLowerCase().includes(q)),
      books: books.filter(b => b.title.toLowerCase().includes(q) || (b.author && b.author.toLowerCase().includes(q))),
      events: hackathons.filter(ev => ev.name.toLowerCase().includes(q) || (ev.theme && ev.theme.toLowerCase().includes(q))),
      sections: sections.filter(s => s.name.toLowerCase().includes(q)),
      notes: notes.filter(n => n.title.toLowerCase().includes(q) || (n.content && n.content.toLowerCase().includes(q))),
    });
  };

  useEffect(() => {
    filterSearchResults(searchQuery);
  }, [searchQuery, tasks, shortGoals, habits, domains, books, hackathons, sections, notes]);

  return (
    <View style={[styles.root, { backgroundColor: '#000B29' }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Top Header Bar */}
      <View style={[styles.topHeaderBar, { paddingTop: insets.top + 6 }]}>
        <Pressable
          style={({ pressed }) => [styles.headerIconBtn, pressed && { opacity: 0.7 }]}
          onPress={openDrawer}
        >
          <Menu size={24} color="#FFFFFF" strokeWidth={2.5} />
        </Pressable>
        
        <Pressable
          style={styles.headerSearchWrapper}
          onPress={() => setGlobalSearchOpen(true)}
        >
          <Search size={16} color="#94A3B8" />
          <Text style={styles.headerSearchText}>Search anything...</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.headerIconBtn, pressed && { opacity: 0.7 }]}
          onPress={() => setNotificationsOpen(true)}
        >
          <Bell size={24} color="#FFFFFF" strokeWidth={2} />
          {unreadCount > 0 && (
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: Spacing.xs, paddingBottom: tabBarHeight + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting Section below Header */}
        <View style={styles.greetingSection}>
          <View style={styles.greetingRow}>
            <GreetingIcon size={14} color="#94A3B8" strokeWidth={2} />
            <Text style={[styles.greeting, { color: '#94A3B8' }]}>{greetingText}</Text>
          </View>
          <Text style={[styles.name, { color: '#FFFFFF' }]}>
            {displayName.charAt(0).toUpperCase() + displayName.slice(1)}
          </Text>
          <Text style={[styles.date, { color: '#64748B' }]}>{dateStr}</Text>
        </View>

        {/* Dynamic Motivation & Progress Rings */}
        <LinearGradient
          colors={['rgba(29, 78, 216, 0.25)', 'rgba(139, 92, 246, 0.15)']}
          style={styles.heroBanner}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.heroLeft}>
            <Text style={styles.heroQuoteHeader}>Daily Focus</Text>
            <Text style={styles.heroQuote} numberOfLines={3}>"{motivationQuote}"</Text>
            <View style={styles.heroStatsRow}>
              <View style={styles.heroMiniStat}>
                <Flame size={14} color="#FBBF24" />
                <Text style={styles.heroMiniStatText}>Streak: {badges.length > 0 ? badges.length * 2 : 1} days</Text>
              </View>
            </View>
          </View>
          <View style={styles.heroRight}>
            <View style={styles.ringWrapper}>
              <CircularProgress size={82} strokeWidth={8} progress={completionRate} color="#3B82F6" />
              <View style={styles.ringInnerWrapper}>
                <CircularProgress size={62} strokeWidth={8} progress={readingProgress || 35} color="#A78BFA" />
              </View>
              <View style={styles.ringTextContainer}>
                <Text style={styles.ringCenterText}>{completionRate}%</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* AI Coach Assistant Card */}
        <GlassCard style={styles.aiCoachCard} padding={16}>
          <View style={styles.aiCoachHeader}>
            <View style={styles.aiIconWrapper}>
              <Sparkles size={16} color="#A78BFA" />
            </View>
            <Text style={styles.aiCoachTitle}>AI Productive Coach</Text>
          </View>
          <Text style={styles.aiCoachText}>
            You completed {completedToday.length} tasks today! Focus on your goals by scheduling a {25}-min Pomodoro timer. You can do this!
          </Text>
        </GlassCard>

        {/* Quick Shortcuts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.shortcutGrid}>
            {moduleShortcuts.map((m, i) => (
              <Pressable
                key={i}
                style={({ pressed }) => [
                  styles.shortcutCard,
                  { backgroundColor: 'rgba(255, 255, 255, 0.03)', borderColor: 'rgba(255, 255, 255, 0.06)' },
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() => router.push(m.route as any)}
              >
                <View style={[styles.shortcutIcon, { backgroundColor: m.color + '15' }]}>
                  <m.icon size={20} color={m.color} strokeWidth={2} />
                </View>
                <Text style={styles.shortcutLabel}>{m.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Focus Timer CTA */}
        <Pressable
          style={[styles.focusCard, { backgroundColor: 'rgba(255, 255, 255, 0.03)', borderColor: 'rgba(255, 255, 255, 0.06)' }]}
          onPress={() => setPomodoroModal(true)}
        >
          <View style={[styles.focusIcon, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
            <Timer size={20} color="#3B82F6" strokeWidth={2} />
          </View>
          <View style={styles.focusText}>
            <Text style={styles.focusTitle}>Focus Study Chamber</Text>
            <Text style={styles.focusSub}>Start Pomodoro focus session</Text>
          </View>
          <ChevronRight size={18} color="#64748B" strokeWidth={2} />
        </Pressable>

        {/* Today's Priorities */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Priorities</Text>
            <Pressable onPress={() => router.push('/(tabs)/tasks')} style={styles.seeAllBtn}>
              <Text style={styles.seeAll}>See all</Text>
              <ChevronRight size={14} color="#3B82F6" strokeWidth={2} />
            </Pressable>
          </View>
          {todayTasks.length === 0 ? (
            <GlassCard style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', borderColor: 'rgba(255, 255, 255, 0.05)' }} padding={20}>
              <View style={styles.emptyState}>
                <CheckCircle2 size={32} color="#10B981" strokeWidth={1.5} />
                <Text style={styles.emptyTitle}>All caught up!</Text>
                <Text style={styles.emptySubtitle}>No pending tasks due today.</Text>
              </View>
            </GlassCard>
          ) : (
            <GlassCard style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', borderColor: 'rgba(255, 255, 255, 0.05)' }} padding={0}>
              {todayTasks.slice(0, 3).map((t, idx) => (
                <View key={t.id}>
                  {idx > 0 && <View style={styles.divider} />}
                  <View style={styles.taskRow}>
                    <View style={[styles.taskPriorityDot, { backgroundColor: priorityColor(t.priority) }]} />
                    <View style={styles.taskContent}>
                      <Text style={styles.taskTitle} numberOfLines={1}>{t.title}</Text>
                      {t.deadline && (
                        <View style={styles.taskMeta}>
                          <Clock size={11} color="#64748B" strokeWidth={2} />
                          <Text style={styles.taskDeadline}>
                            {new Date(t.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={[styles.priorityChip, { borderColor: priorityColor(t.priority) }]}>
                      <Text style={[styles.priorityChipText, { color: priorityColor(t.priority) }]}>{t.priority}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </GlassCard>
          )}
        </View>

        {/* Upcoming Deadlines */}
        {upcomingEvents.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Deadlines</Text>
            </View>
            <GlassCard style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', borderColor: 'rgba(255, 255, 255, 0.05)' }} padding={0}>
              {upcomingEvents.map((h, idx) => {
                const daysLeft = h.end_date
                  ? Math.ceil((new Date(h.end_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                  : null;
                return (
                  <View key={h.id}>
                    {idx > 0 && <View style={styles.divider} />}
                    <View style={styles.eventRow}>
                      <View style={[styles.eventDot, { backgroundColor: daysLeft !== null && daysLeft <= 3 ? '#EF4444' : '#FBBF24' }]} />
                      <Text style={styles.eventName} numberOfLines={1}>{h.name}</Text>
                      {daysLeft !== null && (
                        <Text style={[styles.eventDays, { color: daysLeft <= 3 ? '#EF4444' : '#94A3B8' }]}>
                          {daysLeft === 0 ? 'Today' : `${daysLeft}d left`}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </GlassCard>
          </View>
        )}
      </ScrollView>

      {/* Global Search Modal */}
      <Modal visible={globalSearchOpen} animationType="slide" transparent onRequestClose={() => setGlobalSearchOpen(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setGlobalSearchOpen(false)} />
          <View style={[styles.modalSheet, { height: '80%', backgroundColor: '#091535', borderColor: 'rgba(255,255,255,0.08)' }]}>
            <View style={styles.modalHandle} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF' }}>Search Space</Text>
              <Pressable onPress={() => setGlobalSearchOpen(false)}>
                <X size={20} color="#94A3B8" />
              </Pressable>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 12, marginVertical: 12, height: 44 }}>
              <Search size={16} color="#94A3B8" style={{ marginRight: 8 }} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search tasks, goals, habits, notes..."
                placeholderTextColor="#64748B"
                style={{ flex: 1, color: '#FFFFFF', fontSize: 14 }}
                autoFocus
              />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {searchQuery.length === 0 ? (
                <Text style={{ color: '#64748B', textAlign: 'center', marginVertical: 20 }}>Type anything to start searching...</Text>
              ) : (
                <View style={{ gap: 16 }}>
                  {searchResults.tasks.length > 0 && (
                    <View>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#60A5FA', textTransform: 'uppercase', marginBottom: 6 }}>Tasks</Text>
                      {searchResults.tasks.map(t => (
                        <Pressable key={t.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.02)' }} onPress={() => { setGlobalSearchOpen(false); router.push('/(tabs)/tasks'); }}>
                          <CheckCircle size={16} color="#60A5FA" />
                          <Text style={{ color: '#FFFFFF', fontSize: 14 }} numberOfLines={1}>{t.title}</Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                  {searchResults.goals.length > 0 && (
                    <View>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#F472B6', textTransform: 'uppercase', marginBottom: 6 }}>Goals</Text>
                      {searchResults.goals.map(g => (
                        <Pressable key={g.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.02)' }} onPress={() => { setGlobalSearchOpen(false); router.push('/(tabs)/goals'); }}>
                          <Target size={16} color="#F472B6" />
                          <Text style={{ color: '#FFFFFF', fontSize: 14 }} numberOfLines={1}>{g.title}</Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                  {searchResults.notes.length > 0 && (
                    <View>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#34D399', textTransform: 'uppercase', marginBottom: 6 }}>Notes</Text>
                      {searchResults.notes.map(n => (
                        <Pressable key={n.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.02)' }} onPress={() => { setGlobalSearchOpen(false); router.push('/modules/notes'); }}>
                          <BookOpen size={16} color="#34D399" />
                          <Text style={{ color: '#FFFFFF', fontSize: 14 }} numberOfLines={1}>{n.title}</Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                  {Object.values(searchResults).every(arr => arr.length === 0) && (
                    <Text style={{ color: '#64748B', textAlign: 'center', marginVertical: 20 }}>No results found for "{searchQuery}"</Text>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Notifications Modal */}
      <Modal visible={notificationsOpen} animationType="slide" transparent onRequestClose={() => setNotificationsOpen(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setNotificationsOpen(false)} />
          <View style={[styles.modalSheet, { height: '75%', backgroundColor: '#091535', borderColor: 'rgba(255,255,255,0.08)' }]}>
            <View style={styles.modalHandle} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF' }}>Notifications</Text>
              <Pressable onPress={() => { clearAll(); }}>
                <Text style={{ fontSize: 13, color: '#EF4444', fontWeight: '600' }}>Clear All</Text>
              </Pressable>
            </View>

            {notifications.length === 0 ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                <Bell size={32} color="#64748B" />
                <Text style={{ color: '#64748B', fontSize: 14 }}>All caught up!</Text>
              </View>
            ) : (
              <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' }}>
                    <Pressable
                      style={{ flex: 1, gap: 4 }}
                      onPress={async () => {
                        await markRead(item.id);
                        setNotificationsOpen(false);
                        if (item.title.toLowerCase().includes('task')) router.push('/(tabs)/tasks');
                        else if (item.title.toLowerCase().includes('goal')) router.push('/(tabs)/goals');
                        else if (item.title.toLowerCase().includes('book')) router.push('/modules/books');
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        {!item.is_read && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#3B82F6' }} />}
                        <Text style={{ color: item.is_read ? '#94A3B8' : '#FFFFFF', fontWeight: item.is_read ? '500' : '700', fontSize: 14 }}>{item.title}</Text>
                      </View>
                      {item.body && <Text style={{ color: '#64748B', fontSize: 12 }}>{item.body}</Text>}
                    </Pressable>
                    <Pressable onPress={() => deleteNotification(item.id)} style={{ padding: 4 }}>
                      <Trash2 size={16} color="#EF4444" />
                    </Pressable>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Pomodoro Modal */}
      <Modal visible={pomodoroModal} transparent animationType="slide" onRequestClose={() => setPomodoroModal(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setPomodoroModal(false)} />
          <View style={[styles.modalSheet, { backgroundColor: '#091535', borderColor: 'rgba(255, 255, 255, 0.08)' }]}>
            <View style={styles.modalHandle} />
            <Pressable style={styles.modalClose} onPress={() => setPomodoroModal(false)}>
              <X size={20} color="#94A3B8" strokeWidth={2} />
            </Pressable>
            <PomodoroTimer />
          </View>
        </View>
      </Modal>

      <BadgeAchievement
        visible={!!badgePreview}
        badgeType={badgePreview?.type ?? ''}
        badgeName={badgePreview?.name ?? ''}
        onDismiss={() => setBadgePreview(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.base },

  // Premium Glass Top Header Bar
  topHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.sm,
    backgroundColor: 'rgba(0, 11, 41, 0.6)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    gap: Spacing.md,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerSearchWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  headerSearchText: {
    fontSize: 13,
    color: '#94A3B8',
  },
  bellBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  bellBadgeText: {
    fontSize: 9,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  greetingSection: {
    paddingHorizontal: Spacing.base,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  greetingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  greeting: { fontSize: 13, fontWeight: '500' },
  name: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  date: { fontSize: 12, marginTop: 2 },

  // Hero Motivation & Progress rings
  heroBanner: {
    flexDirection: 'row',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  heroLeft: { flex: 1, justifyContent: 'center', paddingRight: Spacing.sm },
  heroQuoteHeader: { fontSize: 13, color: '#93C5FD', fontWeight: '700', textTransform: 'uppercase', marginBottom: 6 },
  heroQuote: { fontSize: 14, color: '#E2E8F0', fontWeight: '500', lineHeight: 20 },
  heroStatsRow: { flexDirection: 'row', marginTop: 12, gap: 10 },
  heroMiniStat: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  heroMiniStatText: { color: '#E2E8F0', fontSize: 11, fontWeight: '600' },
  heroRight: { justifyContent: 'center', alignItems: 'center', width: 90 },

  // Ring Wrapper
  ringWrapper: { width: 82, height: 82, justifyContent: 'center', alignItems: 'center' },
  ringInnerWrapper: { position: 'absolute', width: 62, height: 62, justifyContent: 'center', alignItems: 'center' },
  ringTextContainer: { position: 'absolute', justifyContent: 'center', alignItems: 'center' },
  ringCenterText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },

  // AI Coach Card
  aiCoachCard: {
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderColor: 'rgba(139, 92, 246, 0.15)',
    borderWidth: 1,
    borderRadius: Radius.lg,
    marginBottom: Spacing.base,
  },
  aiCoachHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  aiIconWrapper: { width: 24, height: 24, borderRadius: 6, backgroundColor: 'rgba(139, 92, 246, 0.15)', alignItems: 'center', justifyContent: 'center' },
  aiCoachTitle: { color: '#D8B4FE', fontWeight: '700', fontSize: 13 },
  aiCoachText: { color: '#C084FC', fontSize: 12, lineHeight: 18, fontWeight: '500' },

  // Section
  section: { marginBottom: Spacing.base },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#F1F5F9' },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAll: { fontSize: 13, color: '#3B82F6', fontWeight: '600' },

  // Empty state
  emptyState: { alignItems: 'center', gap: Spacing.xs, paddingVertical: Spacing.md },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#F1F5F9' },
  emptySubtitle: { fontSize: 12, color: '#64748B', textAlign: 'center' },

  // Task rows
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.04)', marginHorizontal: Spacing.base },
  taskRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: 12, gap: Spacing.md },
  taskPriorityDot: { width: 6, height: 6, borderRadius: 3 },
  taskContent: { flex: 1, gap: 2 },
  taskTitle: { fontSize: 14, fontWeight: '600', color: '#F1F5F9' },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  taskDeadline: { fontSize: 11, color: '#64748B' },
  priorityChip: { borderWidth: 1, borderRadius: Radius.full, paddingHorizontal: 6, paddingVertical: 1 },
  priorityChipText: { fontSize: 10, fontWeight: '700' },

  // Event rows
  eventRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: 12, gap: Spacing.md },
  eventDot: { width: 6, height: 6, borderRadius: 3 },
  eventName: { flex: 1, fontSize: 14, fontWeight: '600', color: '#F1F5F9' },
  eventDays: { fontSize: 12, fontWeight: '600' },

  // Shortcuts
  shortcutGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  shortcutCard: {
    width: (width - Spacing.base * 2 - 16) / 3,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  shortcutIcon: { width: 42, height: 42, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  shortcutLabel: { fontSize: 11, fontWeight: '600', color: '#E2E8F0', textAlign: 'center' },

  // Focus card
  focusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.base,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.base,
  },
  focusIcon: { width: 40, height: 40, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  focusText: { flex: 1 },
  focusTitle: { fontSize: 14, fontWeight: '700', color: '#F1F5F9' },
  focusSub: { fontSize: 12, color: '#64748B', marginTop: 1 },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.65)' },
  modalSheet: {
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    borderWidth: 1,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  modalHandle: { width: 36, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.base },
  modalClose: { alignSelf: 'flex-end', padding: Spacing.xs },
});

