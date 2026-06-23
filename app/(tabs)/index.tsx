import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Modal, StatusBar,
  TextInput, ActivityIndicator, Animated, Dimensions, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Bell, Search, CheckCircle2, Clock, Flame, Star,
  BookOpen, Activity, Trophy, Target, ChevronRight,
  Timer, TrendingUp, Calendar, Sun, Sunset, Moon,
  X, Wallet, Menu, FileText, Check, Trash2, CheckCircle, CheckSquare,
} from 'lucide-react-native';
import { useAuth, useAlert } from '@/template';
import { useTasks } from '@/hooks/useTasks';
import { useBadges } from '@/hooks/useBadges';
import { useEvents } from '@/hooks/useEvents';
import { useBooks } from '@/hooks/useModules';
import { useExercise } from '@/hooks/useModules';
import { useMoneyVault } from '@/hooks/useModules';
import { useGoals } from '@/hooks/useGoals';
import { useHabits } from '@/hooks/useHabits';
import { useNotes } from '@/hooks/useNotes';
import { useNotifications } from '@/hooks/useNotifications';
import { useSearch } from '@/contexts/SearchContext';
import { useDrawer } from '@/contexts/DrawerContext';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Typography, Spacing, Radius, Colors } from '@/constants/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { PomodoroTimer } from '@/components/feature/PomodoroTimer';
import { SidebarDrawer } from '@/components/ui/SidebarDrawer';
import { WatercolorBackground } from '@/components/ui/WatercolorBackground';
import { AppInput } from '@/components/ui/AppInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';

const { width, height } = Dimensions.get('window');

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good Morning', icon: Sun };
  if (h < 17) return { text: 'Good Afternoon', icon: Sunset };
  return { text: 'Good Evening', icon: Moon };
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { user } = useAuth();
  const { tasks, addTask } = useTasks();
  const { badges } = useBadges();
  const { hackathons } = useEvents();
  const { books } = useBooks();
  const { logs: exerciseLogs } = useExercise();
  const { expenses, settings: moneySettings } = useMoneyVault();
  const { shortGoals, addShortGoal } = useGoals();
  const { addHabit } = useHabits();
  const { addNote } = useNotes();
  const { notifications, unreadCount, markRead, markAllRead, deleteNotification } = useNotifications();
  const { isSearchVisible, openSearch, closeSearch, searchQuery, setSearchQuery, results, recentSearches, addRecentSearch, clearRecentSearches } = useSearch();
  const { isDrawerOpen, openDrawer, closeDrawer } = useDrawer();
  const { showAlert } = useAlert();

  // Modals visibility states
  const [pomodoroModal, setPomodoroModal] = useState(false);
  const [notificationDrawer, setNotificationDrawer] = useState(false);
  const [taskModal, setTaskModal] = useState(false);
  const [goalModal, setGoalModal] = useState(false);
  const [habitModal, setHabitModal] = useState(false);
  const [noteModal, setNoteModal] = useState(false);

  // Quick Action form inputs
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskDeadline, setTaskDeadline] = useState('');
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDeadline, setGoalDeadline] = useState('');
  const [habitName, setHabitName] = useState('');
  const [habitDesc, setHabitDesc] = useState('');
  const [habitFreq, setHabitFreq] = useState('Daily');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [savingAction, setSavingAction] = useState(false);

  // Notification Drawer Animation
  const notifAnim = useRef(new Animated.Value(width)).current;

  useEffect(() => {
    Animated.timing(notifAnim, {
      toValue: notificationDrawer ? 0 : width,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [notificationDrawer]);

  const today = new Date();
  const { text: greetingText, icon: GreetingIcon } = getGreeting();
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

  const readingProgress = books.length > 0 ? Math.round((books.filter(b => b.status === 'completed').length / books.length) * 100) : 0;
  const currentlyReading = books.filter(b => b.status === 'reading').length;

  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const weeklyExercise = exerciseLogs.filter(l => new Date(l.date) >= weekAgo);
  const weeklyCalories = weeklyExercise.reduce((a, l) => a + l.calories, 0);

  const todayStr = today.toISOString().split('T')[0];
  const todaySpend = expenses.filter(e => e.date === todayStr).reduce((a, e) => a + e.amount, 0);
  const totalBalance = moneySettings.cash_in_hand + moneySettings.wallet_balance + moneySettings.bank_balance;

  const completedGoals = shortGoals.filter(g => g.completed).length;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const upcomingEvents = hackathons
    .filter(h => h.end_date && new Date(h.end_date) >= today)
    .sort((a, b) => new Date(a.end_date!).getTime() - new Date(b.end_date!).getTime())
    .slice(0, 3);

  const priorityColor = (p: string) => Colors.priority[p] ?? colors.accent;

  const quickStats = [
    { label: "Today's Tasks", value: todayTasks.length, icon: CheckCircle2, color: colors.accent },
    { label: 'Done Today', value: completedToday.length, icon: Star, color: Colors.success },
    { label: 'Total Badges', value: badges.length, icon: Trophy, color: Colors.warning },
    { label: 'Completion', value: `${completionRate}%`, icon: TrendingUp, color: '#8B5CF6' },
  ];

  // Quick Action Submission handlers
  const handleAddTask = async () => {
    if (!taskTitle.trim()) { showAlert('Required', 'Please enter a task title.'); return; }
    setSavingAction(true);
    await addTask({
      title: taskTitle.trim(),
      description: taskDesc.trim() || undefined,
      deadline: taskDeadline.trim() || undefined,
      category: 'General',
      priority: 'Medium',
      completed: false,
      progress: 0,
    });
    setSavingAction(false);
    setTaskModal(false);
    setTaskTitle('');
    setTaskDesc('');
    setTaskDeadline('');
  };

  const handleAddGoal = async () => {
    if (!goalTitle.trim()) { showAlert('Required', 'Please enter a goal title.'); return; }
    setSavingAction(true);
    await addShortGoal({
      title: goalTitle.trim(),
      due_date: goalDeadline.trim() || undefined,
      completed: false,
      progress: 0,
      checklist: [],
    });
    setSavingAction(false);
    setGoalModal(false);
    setGoalTitle('');
    setGoalDeadline('');
  };

  const handleAddHabit = async () => {
    if (!habitName.trim()) { showAlert('Required', 'Please enter a habit name.'); return; }
    setSavingAction(true);
    await addHabit(habitName.trim(), habitDesc.trim() || undefined, habitFreq.toLowerCase());
    setSavingAction(false);
    setHabitModal(false);
    setHabitName('');
    setHabitDesc('');
  };

  const handleAddNote = async () => {
    if (!noteTitle.trim()) { showAlert('Required', 'Please enter a note title.'); return; }
    setSavingAction(true);
    await addNote(noteTitle.trim(), noteContent.trim() || undefined);
    setSavingAction(false);
    setNoteModal(false);
    setNoteTitle('');
    setNoteContent('');
  };

  const handleSearchSelect = (route: string) => {
    closeSearch();
    router.push(route as any);
  };

  return (
    <WatercolorBackground>
      <View style={styles.root}>
        <StatusBar barStyle="light-content" />
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100, paddingTop: insets.top + Spacing.sm }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeftRow}>
              <Pressable onPress={openDrawer} style={[styles.menuBtn, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]} hitSlop={12}>
                <Menu size={20} color={colors.text} strokeWidth={2} />
              </Pressable>
              <View style={styles.headerLeft}>
                <View style={styles.greetingRow}>
                  <GreetingIcon size={14} color={colors.textMuted} strokeWidth={2} />
                  <Text style={[styles.greeting, { color: colors.textMuted }]}>{greetingText},</Text>
                </View>
                <Text style={[styles.name, { color: colors.text }]}>
                  {displayName.charAt(0).toUpperCase() + displayName.slice(1)}
                </Text>
                <Text style={[styles.date, { color: colors.textMuted }]}>{dateStr}</Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              <Pressable
                style={[styles.iconBtn, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}
                onPress={openSearch}
                hitSlop={8}
              >
                <Search size={18} color={colors.textMuted} strokeWidth={2} />
              </Pressable>
              <Pressable
                style={[styles.iconBtn, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}
                onPress={() => setNotificationDrawer(true)}
                hitSlop={8}
              >
                <Bell size={18} color={colors.textMuted} strokeWidth={2} />
                {unreadCount > 0 && (
                  <View style={[styles.badgeContainer, { backgroundColor: colors.error }]}>
                    <Text style={styles.badgeText}>{unreadCount}</Text>
                  </View>
                )}
              </Pressable>
            </View>
          </View>

          {/* Overall Progress Banner */}
          <GlassCard style={[styles.progressBanner, { backgroundColor: colors.accent }]} padding={20}>
            <View style={styles.progressBannerTop}>
              <View>
                <Text style={styles.progressBannerTitle}>Overall Progress</Text>
                <Text style={styles.progressBannerSub}>{completedTasks} of {totalTasks} tasks done</Text>
              </View>
              <Text style={styles.progressBannerPct}>{completionRate}%</Text>
            </View>
            <View style={styles.progressBannerBar}>
              <View style={[styles.progressBannerFill, { width: `${completionRate}%` }]} />
            </View>
          </GlassCard>

          {/* Quick Actions Panel */}
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: Spacing.sm }]}>Quick Actions</Text>
          <View style={styles.quickActionsRow}>
            <Pressable style={styles.quickActionItem} onPress={() => setTaskModal(true)}>
              <View style={[styles.quickActionIcon, { backgroundColor: colors.accent + '15', borderColor: colors.accent + '30' }]}>
                <CheckSquare size={20} color={colors.accent} strokeWidth={2} />
              </View>
              <Text style={[styles.quickActionLabel, { color: colors.text }]}>+ Task</Text>
            </Pressable>
            <Pressable style={styles.quickActionItem} onPress={() => setGoalModal(true)}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#4CAF5015', borderColor: '#4CAF5030' }]}>
                <Target size={20} color="#4CAF50" strokeWidth={2} />
              </View>
              <Text style={[styles.quickActionLabel, { color: colors.text }]}>+ Goal</Text>
            </Pressable>
            <Pressable style={styles.quickActionItem} onPress={() => setHabitModal(true)}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#FFB74D15', borderColor: '#FFB74D30' }]}>
                <Flame size={20} color="#FFB74D" strokeWidth={2} />
              </View>
              <Text style={[styles.quickActionLabel, { color: colors.text }]}>+ Habit</Text>
            </Pressable>
            <Pressable style={styles.quickActionItem} onPress={() => setNoteModal(true)}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#8B5CF615', borderColor: '#8B5CF630' }]}>
                <FileText size={20} color="#8B5CF6" strokeWidth={2} />
              </View>
              <Text style={[styles.quickActionLabel, { color: colors.text }]}>+ Note</Text>
            </Pressable>
          </View>

          {/* Quick Stats Grid */}
          <View style={styles.statsGrid}>
            {quickStats.map((s, i) => (
              <GlassCard key={i} style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]} padding={14}>
                <View style={[styles.statIconBox, { backgroundColor: s.color + '18' }]}>
                  <s.icon size={18} color={s.color} strokeWidth={2} />
                </View>
                <Text style={[styles.statValue, { color: colors.text }]}>{s.value}</Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>{s.label}</Text>
              </GlassCard>
            ))}
          </View>

          {/* Today's Priorities */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Today's Priorities</Text>
              <Pressable onPress={() => router.push('/(tabs)/tasks')} style={styles.seeAllBtn}>
                <Text style={[styles.seeAll, { color: colors.accent }]}>See all</Text>
                <ChevronRight size={14} color={colors.accent} strokeWidth={2} />
              </Pressable>
            </View>
            {todayTasks.length === 0 ? (
              <GlassCard style={{ backgroundColor: colors.surface, borderColor: colors.border }} padding={20}>
                <View style={styles.emptyState}>
                  <CheckCircle2 size={32} color="#4CAF50" strokeWidth={1.5} />
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>All clear for today</Text>
                  <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>No tasks due today. Great work!</Text>
                </View>
              </GlassCard>
            ) : (
              <GlassCard style={{ backgroundColor: colors.surface, borderColor: colors.border }} padding={0}>
                {todayTasks.slice(0, 4).map((t, idx) => (
                  <View key={t.id}>
                    {idx > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                    <View style={styles.taskRow}>
                      <View style={[styles.taskPriorityDot, { backgroundColor: priorityColor(t.priority) }]} />
                      <View style={styles.taskContentBody}>
                        <Text style={[styles.taskTitle, { color: colors.text }]} numberOfLines={1}>{t.title}</Text>
                        {t.deadline && (
                          <View style={styles.taskMeta}>
                            <Clock size={11} color={colors.textMuted} strokeWidth={2} />
                            <Text style={[styles.taskDeadline, { color: colors.textMuted }]}>
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
                {todayTasks.length > 4 && (
                  <Pressable style={[styles.moreRow, { borderTopWidth: 1, borderTopColor: colors.border }]} onPress={() => router.push('/(tabs)/tasks')}>
                    <Text style={[styles.moreText, { color: colors.accent }]}>+{todayTasks.length - 4} more tasks</Text>
                  </Pressable>
                )}
              </GlassCard>
            )}
          </View>

          {/* Focus Timer CTA */}
          <Pressable
            style={[styles.focusCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setPomodoroModal(true)}
          >
            <View style={[styles.focusIcon, { backgroundColor: colors.accent + '18' }]}>
              <Timer size={22} color={colors.accent} strokeWidth={2} />
            </View>
            <View style={styles.focusText}>
              <Text style={[styles.focusTitle, { color: colors.text }]}>Focus Timer</Text>
              <Text style={[styles.focusSub, { color: colors.textMuted }]}>Start a Pomodoro session</Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} strokeWidth={2} />
          </Pressable>
        </ScrollView>

        {/* Global Sidebar Drawer Component */}
        <SidebarDrawer visible={isDrawerOpen} onClose={closeDrawer} />

        {/* Global Search Modal Overlay */}
        <Modal visible={isSearchVisible} transparent animationType="fade" onRequestClose={closeSearch}>
          <View style={styles.searchOverlayContainer}>
            <Pressable style={StyleSheet.absoluteFill} onPress={closeSearch} />
            <View style={[styles.searchDrawerBody, { backgroundColor: colors.surface, borderColor: colors.border, paddingTop: insets.top + 16 }]}>
              <View style={styles.searchHeaderRow}>
                <View style={[styles.searchFieldWrapper, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
                  <Search size={18} color={colors.textMuted} strokeWidth={2} />
                  <TextInput
                    style={[styles.searchFieldInput, { color: colors.text }]}
                    placeholder="Search tasks, habits, goals, notes..."
                    placeholderTextColor={colors.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoFocus
                  />
                  {searchQuery.length > 0 && (
                    <Pressable onPress={() => setSearchQuery('')}>
                      <X size={16} color={colors.textMuted} strokeWidth={2} />
                    </Pressable>
                  )}
                </View>
                <Pressable onPress={closeSearch} style={styles.closeSearchBtn}>
                  <Text style={{ color: colors.accent, fontWeight: '600' }}>Cancel</Text>
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.searchResultsScroll}>
                {searchQuery.trim() === '' ? (
                  recentSearches.length > 0 && (
                    <View style={styles.recentSearchesContainer}>
                      <View style={styles.recentHeaderRow}>
                        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '700' }}>RECENT SEARCHES</Text>
                        <Pressable onPress={clearRecentSearches}>
                          <Text style={{ color: colors.error, fontSize: 12 }}>Clear</Text>
                        </Pressable>
                      </View>
                      {recentSearches.map((q, idx) => (
                        <Pressable key={idx} style={styles.recentSearchItem} onPress={() => { setSearchQuery(q); addRecentSearch(q); }}>
                          <Clock size={14} color={colors.textMuted} />
                          <Text style={{ color: colors.text, marginLeft: Spacing.sm }}>{q}</Text>
                        </Pressable>
                      ))}
                    </View>
                  )
                ) : results.length === 0 ? (
                  <View style={styles.searchEmpty}>
                    <Text style={{ color: colors.textMuted }}>No matching results found.</Text>
                  </View>
                ) : (
                  results.map(item => (
                    <Pressable
                      key={item.id}
                      style={[styles.searchResultRow, { borderBottomColor: colors.borderLight }]}
                      onPress={() => {
                        addRecentSearch(searchQuery);
                        handleSearchSelect(item.route);
                      }}
                    >
                      <View style={[styles.searchResultTypeBadge, { backgroundColor: item.type === 'task' ? colors.accent + '20' : item.type === 'habit' ? '#FFB74D20' : '#8B5CF620' }]}>
                        <Text style={{ fontSize: 9, fontWeight: '700', color: item.type === 'task' ? colors.accent : item.type === 'habit' ? '#FFB74D' : '#8B5CF6' }}>
                          {item.type.toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.searchResultTitle, { color: colors.text }]}>{item.title}</Text>
                        {item.subtitle && <Text style={{ fontSize: 12, color: colors.textMuted }} numberOfLines={1}>{item.subtitle}</Text>}
                      </View>
                      <ChevronRight size={16} color={colors.textDim} />
                    </Pressable>
                  ))
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Notifications Slide-out Drawer */}
        <Modal transparent visible={notificationDrawer} animationType="none" onRequestClose={() => setNotificationDrawer(false)}>
          <View style={styles.drawerOverlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setNotificationDrawer(false)} />
            <Animated.View style={[styles.drawerBodyRight, { backgroundColor: colors.surface, borderColor: colors.border, transform: [{ translateX: notifAnim }], paddingTop: insets.top + 16 }]}>
              <View style={styles.drawerHeaderRight}>
                <Text style={[styles.drawerTitleRight, { color: colors.text }]}>Notification Center</Text>
                <Pressable onPress={() => setNotificationDrawer(false)} hitSlop={8}>
                  <X size={20} color={colors.textMuted} strokeWidth={2} />
                </Pressable>
              </View>

              <View style={styles.notifActionsRow}>
                <Pressable onPress={markAllRead} style={styles.notifActionBtn}>
                  <CheckCheckIcon color={colors.accent} />
                  <Text style={{ color: colors.accent, fontSize: 13, fontWeight: '600', marginLeft: 4 }}>Mark all as read</Text>
                </Pressable>
              </View>

              <ScrollView contentContainerStyle={styles.notifListScroll} showsVerticalScrollIndicator={false}>
                {notifications.length === 0 ? (
                  <View style={styles.notifEmpty}>
                    <Bell size={40} color={colors.textDim} strokeWidth={1.5} />
                    <Text style={{ color: colors.textMuted, marginTop: 8 }}>All caught up!</Text>
                  </View>
                ) : (
                  notifications.map(n => (
                    <Pressable
                      key={n.id}
                      style={[styles.notifCard, { backgroundColor: n.is_read ? 'transparent' : colors.surfaceLight, borderColor: colors.border }]}
                      onPress={() => markRead(n.id)}
                    >
                      <View style={styles.notifCardTop}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.notifCardTitle, { color: colors.text, fontWeight: n.is_read ? '500' : '700' }]}>{n.title}</Text>
                          {n.body && <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>{n.body}</Text>}
                        </View>
                        <Pressable onPress={() => deleteNotification(n.id)} style={styles.deleteNotifBtn} hitSlop={12}>
                          <Trash2 size={14} color={colors.textDim} />
                        </Pressable>
                      </View>
                      <Text style={{ color: colors.textDim, fontSize: 10, marginTop: 6 }}>
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date(n.created_at).toLocaleDateString()}
                      </Text>
                    </Pressable>
                  ))
                )}
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>

        {/* Focus Timer Modal */}
        <Modal visible={pomodoroModal} transparent animationType="fade" onRequestClose={() => setPomodoroModal(false)}>
          <View style={styles.modalOverlayCentered}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setPomodoroModal(false)} />
            <View style={[styles.modalCardCentered, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Focus Timer</Text>
                <Pressable onPress={() => setPomodoroModal(false)} hitSlop={8}>
                  <X size={20} color={colors.textMuted} strokeWidth={2} />
                </Pressable>
              </View>
              <PomodoroTimer />
            </View>
          </View>
        </Modal>

        {/* Quick Action: New Task Modal */}
        <Modal visible={taskModal} transparent animationType="fade" onRequestClose={() => setTaskModal(false)}>
          <KeyboardAvoidingView style={styles.modalOverlayCentered} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setTaskModal(false)} />
            <View style={[styles.modalCardCentered, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>New Task</Text>
                <Pressable onPress={() => setTaskModal(false)} hitSlop={8}>
                  <X size={20} color={colors.textMuted} strokeWidth={2} />
                </Pressable>
              </View>
              <AppInput label="Task Title *" placeholder="What needs to be done?" value={taskTitle} onChangeText={setTaskTitle} />
              <AppInput label="Description" placeholder="Add descriptions..." value={taskDesc} onChangeText={setTaskDesc} multiline />
              <AppInput label="Deadline (YYYY-MM-DD)" placeholder="e.g. 2025-12-31" value={taskDeadline} onChangeText={setTaskDeadline} />
              <PrimaryButton title="Create Task" onPress={handleAddTask} loading={savingAction} style={{ marginTop: Spacing.md }} />
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Quick Action: New Goal Modal */}
        <Modal visible={goalModal} transparent animationType="fade" onRequestClose={() => setGoalModal(false)}>
          <KeyboardAvoidingView style={styles.modalOverlayCentered} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setGoalModal(false)} />
            <View style={[styles.modalCardCentered, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>New Short-term Goal</Text>
                <Pressable onPress={() => setGoalModal(false)} hitSlop={8}>
                  <X size={20} color={colors.textMuted} strokeWidth={2} />
                </Pressable>
              </View>
              <AppInput label="Goal Title *" placeholder="e.g. Finish reading book..." value={goalTitle} onChangeText={setGoalTitle} />
              <AppInput label="Deadline (YYYY-MM-DD)" placeholder="e.g. 2025-12-31" value={goalDeadline} onChangeText={setGoalDeadline} />
              <PrimaryButton title="Create Goal" onPress={handleAddGoal} loading={savingAction} style={{ marginTop: Spacing.md }} />
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Quick Action: New Habit Modal */}
        <Modal visible={habitModal} transparent animationType="fade" onRequestClose={() => setHabitModal(false)}>
          <KeyboardAvoidingView style={styles.modalOverlayCentered} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setHabitModal(false)} />
            <View style={[styles.modalCardCentered, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>New Habit</Text>
                <Pressable onPress={() => setHabitModal(false)} hitSlop={8}>
                  <X size={20} color={colors.textMuted} strokeWidth={2} />
                </Pressable>
              </View>
              <AppInput label="Habit Name *" placeholder="e.g. Daily Coding, Meditate..." value={habitName} onChangeText={setHabitName} />
              <AppInput label="Description" placeholder="Add descriptions..." value={habitDesc} onChangeText={setHabitDesc} />
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Frequency</Text>
              <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm }}>
                {['Daily', 'Weekly'].map(f => (
                  <Pressable
                    key={f}
                    style={[styles.freqBtn, { borderColor: colors.border, backgroundColor: colors.surfaceLight }, habitFreq === f && { borderColor: colors.accent, backgroundColor: colors.accent + '15' }]}
                    onPress={() => setHabitFreq(f)}
                  >
                    <Text style={{ color: habitFreq === f ? colors.accent : colors.textMuted, fontWeight: '600' }}>{f}</Text>
                  </Pressable>
                ))}
              </View>
              <PrimaryButton title="Create Habit" onPress={handleAddHabit} loading={savingAction} style={{ marginTop: Spacing.md }} />
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Quick Action: New Note Modal */}
        <Modal visible={noteModal} transparent animationType="fade" onRequestClose={() => setNoteModal(false)}>
          <KeyboardAvoidingView style={styles.modalOverlayCentered} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setNoteModal(false)} />
            <View style={[styles.modalCardCentered, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>New Note</Text>
                <Pressable onPress={() => setNoteModal(false)} hitSlop={8}>
                  <X size={20} color={colors.textMuted} strokeWidth={2} />
                </Pressable>
              </View>
              <AppInput label="Title *" placeholder="e.g. Meeting notes..." value={noteTitle} onChangeText={setNoteTitle} />
              <AppInput label="Content" placeholder="Supports markdown formatting..." value={noteContent} onChangeText={setNoteContent} multiline numberOfLines={5} style={{ minHeight: 90 }} />
              <PrimaryButton title="Create Note" onPress={handleAddNote} loading={savingAction} style={{ marginTop: Spacing.md }} />
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </WatercolorBackground>
  );
}

// Simple helper icon component
function CheckCheckIcon({ color }: { color: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Check size={14} color={color} strokeWidth={2.5} />
      <Check size={14} color={color} strokeWidth={2.5} style={{ marginLeft: -8 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.base },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  headerLeftRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  menuBtn: { width: 38, height: 38, borderRadius: Radius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  headerLeft: { flex: 1 },
  headerRight: { flexDirection: 'row', gap: Spacing.sm },
  greetingRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 },
  greeting: { fontSize: Typography.sizes.sm },
  name: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, lineHeight: 22 },
  date: { fontSize: Typography.sizes.xs },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgeContainer: {
    position: 'absolute',
    top: -4,
    right: -4,
    borderRadius: 8,
    paddingHorizontal: 4,
    height: 16,
    minWidth: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },

  // Progress Banner
  progressBanner: {
    marginBottom: Spacing.base,
    borderColor: 'transparent',
    borderRadius: Radius.lg,
  },
  progressBannerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  progressBannerTitle: { color: '#fff', fontSize: Typography.sizes.base, fontWeight: Typography.weights.semibold },
  progressBannerSub: { color: 'rgba(255,255,255,0.7)', fontSize: Typography.sizes.sm, marginTop: 2 },
  progressBannerPct: { color: '#fff', fontSize: Typography.sizes.xxxl, fontWeight: Typography.weights.bold },
  progressBannerBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 3, overflow: 'hidden' },
  progressBannerFill: { height: '100%', backgroundColor: '#fff', borderRadius: 3 },

  // Quick Actions
  quickActionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.lg },
  quickActionItem: { alignItems: 'center', flex: 1 },
  quickActionIcon: { width: 50, height: 50, borderRadius: Radius.lg, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xs },
  quickActionLabel: { fontSize: 12, fontWeight: '600' },

  // Stats Grid
  statsGrid: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg, flexWrap: 'wrap' },
  statCard: { flex: 1, minWidth: '45%', gap: 6 },
  statIconBox: { width: 34, height: 34, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold },
  statLabel: { fontSize: Typography.sizes.xs },

  // Section
  section: { marginBottom: Spacing.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAll: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.medium },

  // Empty state
  emptyState: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm },
  emptyTitle: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.semibold },
  emptySubtitle: { fontSize: Typography.sizes.sm, textAlign: 'center' },

  // Task row
  divider: { height: 1, marginHorizontal: Spacing.base },
  taskRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: 14, gap: Spacing.md },
  taskPriorityDot: { width: 8, height: 8, borderRadius: 4 },
  taskContentBody: { flex: 1, gap: 3 },
  taskTitle: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.medium },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  taskDeadline: { fontSize: Typography.sizes.xs },
  priorityChip: { borderWidth: 1, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  priorityChipText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.semibold },
  moreRow: { padding: Spacing.md, alignItems: 'center' },
  moreText: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.medium },

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
  focusIcon: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  focusText: { flex: 1 },
  focusTitle: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.semibold },
  focusSub: { fontSize: Typography.sizes.sm, marginTop: 2 },

  // Modals Overlay Centered
  modalOverlayCentered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(3, 10, 22, 0.75)', padding: Spacing.xl },
  modalCardCentered: { width: '100%', borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.xl, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  modalTitle: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold },
  fieldLabel: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, marginBottom: Spacing.sm },
  freqBtn: { flex: 1, paddingVertical: 10, borderRadius: Radius.md, borderWidth: 1, alignItems: 'center' },

  // Search Modal/Drawer overlay
  searchOverlayContainer: { flex: 1, backgroundColor: 'rgba(3, 10, 22, 0.75)' },
  searchDrawerBody: { flex: 1, paddingHorizontal: Spacing.base },
  searchHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md, gap: Spacing.sm },
  searchFieldWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: Spacing.md, height: 44, gap: Spacing.sm },
  searchFieldInput: { flex: 1, fontSize: 16, padding: 0 },
  closeSearchBtn: { paddingVertical: 8, paddingHorizontal: 4 },
  searchResultsScroll: { gap: Spacing.xs },
  searchEmpty: { paddingVertical: Spacing.xxl, alignItems: 'center' },
  searchResultRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: 1, gap: Spacing.md },
  searchResultTitle: { fontSize: Typography.sizes.base, fontWeight: '600' },
  searchResultTypeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.sm },
  recentSearchesContainer: { paddingHorizontal: Spacing.xs, gap: Spacing.sm },
  recentHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.xs },
  recentSearchItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm },

  // Notifications Drawer
  drawerOverlay: { flex: 1, backgroundColor: 'rgba(3,10,22,0.6)', flexDirection: 'row', justifyContent: 'flex-end' },
  drawerBodyRight: { width: 300, height: '100%', borderLeftWidth: 1, paddingHorizontal: Spacing.base },
  drawerHeaderRight: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  drawerTitleRight: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold },
  notifActionsRow: { paddingBottom: Spacing.sm, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)', marginBottom: Spacing.md },
  notifActionBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' },
  notifListScroll: { gap: Spacing.sm, paddingBottom: 60 },
  notifEmpty: { paddingVertical: 80, alignItems: 'center', justifyContent: 'center' },
  notifCard: { borderWidth: 1, borderRadius: Radius.md, padding: Spacing.md },
  notifCardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  notifCardTitle: { fontSize: Typography.sizes.base, flex: 1 },
  deleteNotifBtn: { padding: 2 },
});
