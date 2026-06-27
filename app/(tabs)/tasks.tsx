import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Modal,
  KeyboardAvoidingView, Platform, StatusBar, ActivityIndicator,
  TextInput, useWindowDimensions, Animated, FlatList, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Plus, Search, CheckCircle2, Circle, Clock, Bell,
  Trash2, CheckSquare, X, Edit2, Archive, RotateCcw,
  Menu, Folder, Inbox, ChevronRight, Sparkles, Award, Flame, Zap, BarChart2, AlertCircle, SlidersHorizontal
} from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useAlert } from '@/hooks/useAlert';
import { useTasks } from '@/hooks/useTasks';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useDrawer } from '@/contexts/DrawerContext';
import { useCustomSections } from '@/hooks/useModules';
import { useBadges } from '@/hooks/useBadges';
import { useNotifications } from '@/hooks/useNotifications';
import { useSafeTabBarHeight } from '@/hooks/useSafeTabBarHeight';
import { Spacing, Radius, Typography } from '@/constants/theme';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { AppInput } from '@/components/ui/AppInput';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { GlassCard } from '@/components/ui/GlassCard';
import { LinearGradient } from 'expo-linear-gradient';

// Supporting Redesign Components
import { ProgressRing } from '@/components/feature/tasks/ProgressRing';
import { ProductivityCharts } from '@/components/feature/tasks/ProductivityCharts';
import { TaskCard } from '@/components/feature/tasks/TaskCard';
import { Task, tasksService } from '@/services/tasksService';

const PRIORITY_VALUES = ['Low', 'Medium', 'High', 'Critical'] as const;
const DIFFICULTY_VALUES = ['Easy', 'Medium', 'Hard'] as const;

const PRIORITY_COLORS: Record<string, string> = {
  Low: '#4CAF50', Medium: '#7AA2E3', High: '#FFB74D', Critical: '#EF5350',
};

const FILTER_CHIPS = [
  { id: 'all', label: 'All' },
  { id: 'today', label: 'Today' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'completed', label: 'Completed' },
  { id: 'high', label: 'High Priority' },
  { id: 'personal', label: 'Personal' },
  { id: 'work', label: 'Work' },
];

const PRODUCTIVITY_QUOTES = [
  "Focus on being productive instead of busy.",
  "Your mind is for having ideas, not holding them.",
  "Done is better than perfect.",
  "Small daily improvements over time lead to stunning results.",
  "Action is the foundational key to all success.",
  "Stay focused, go after your dreams and keep moving toward your goals."
];

export default function TasksScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useSafeTabBarHeight();
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;
  const { openDrawer } = useDrawer();

  const { user } = useAuth();
  const { tasks, loading, addTask, updateTask, removeTask, completeTask, archiveTask, restoreTask } = useTasks();
  const { sections: customSections } = useCustomSections();
  const { badges } = useBadges();
  const { showAlert } = useAlert();
  const { notifications, unreadCount, markRead, deleteNotification, clearAll } = useNotifications();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Filter & Search states
  const [activeFilterId, setActiveFilterId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Gamification & Confetti Celebrations
  const [confettiActive, setConfettiActive] = useState(false);
  const confettiAnim = useRef(new Animated.Value(0)).current;

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [category, setCategory] = useState('General');
  const [priority, setPriority] = useState<typeof PRIORITY_VALUES[number]>('Medium');
  const [difficulty, setDifficulty] = useState<typeof DIFFICULTY_VALUES[number]>('Medium');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [progress, setProgress] = useState('0');
  
  // Recurrence and Reminder states
  const [repeatType, setRepeatType] = useState<'none' | 'daily'>('none');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('08:00');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Mobile Drawer State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerAnim = useRef(new Animated.Value(-280)).current;

  // Quote rotation on mount
  const motivationalQuote = useMemo(() => {
    const day = new Date().getDay();
    return PRODUCTIVITY_QUOTES[day % PRODUCTIVITY_QUOTES.length];
  }, []);

  useEffect(() => {
    Animated.timing(drawerAnim, {
      toValue: drawerOpen ? 0 : -280,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [drawerOpen]);

  const today = new Date();

  // Categories list including standard & custom section names
  const availableCategories = useMemo(() => {
    return ['General', 'Work', 'Personal', 'Study', ...customSections.map(s => s.name)];
  }, [customSections]);

  // Compute Gamification metrics
  const completedCount = useMemo(() => tasks.filter(t => tasksService.isCompletedForToday(t)).length, [tasks]);
  const totalActive = useMemo(() => tasks.filter(t => !tasksService.isCompletedForToday(t) && !t.archived).length, [tasks]);
  const overdueCount = useMemo(() => tasks.filter(t => !tasksService.isCompletedForToday(t) && !t.archived && t.deadline && new Date(t.deadline!) < today).length, [tasks]);
  const todayTasksCount = useMemo(() => tasks.filter(t => !tasksService.isCompletedForToday(t) && !t.archived && t.deadline && new Date(t.deadline).toDateString() === today.toDateString()).length, [tasks]);
  
  const xp = completedCount * 10;
  const level = Math.floor(xp / 100) + 1;
  const xpProgress = xp % 100;
  const productivityScore = useMemo(() => tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0, [completedCount, tasks.length]);

  // Calculate Streak
  const streakCount = useMemo(() => {
    const completedDates = tasks
      .filter(t => {
        if (t.repeatType === 'daily' && t.completedDates) {
          return t.completedDates.length > 0;
        }
        return t.completed && t.completed_at;
      })
      .flatMap(t => {
        if (t.repeatType === 'daily' && t.completedDates) {
          return t.completedDates;
        }
        return t.completed_at ? [new Date(t.completed_at).toISOString().split('T')[0]] : [];
      });
    
    const uniqueDates = new Set(completedDates);
    let streak = 0;
    let curr = new Date();
    
    if (!uniqueDates.has(curr.toDateString())) {
      curr.setDate(curr.getDate() - 1);
    }
    
    while (uniqueDates.has(curr.toDateString())) {
      streak++;
      curr.setDate(curr.getDate() - 1);
    }
    return streak;
  }, [tasks]);

  // Confetti trigger function
  const triggerCelebration = () => {
    setConfettiActive(true);
    confettiAnim.setValue(0);
    Animated.timing(confettiAnim, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }).start(() => setConfettiActive(false));
  };

  const confettiParticles = useMemo(() => {
    return Array.from({ length: 35 }).map((_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const velocity = Math.random() * 180 + 70;
      const size = Math.random() * 8 + 4;
      const color = ['#FFD700', '#FF5722', '#4CAF50', '#00BCD4', '#E91E63', '#7AA2E3'][Math.floor(Math.random() * 6)];
      return {
        id: i,
        size,
        color,
        x: Math.cos(angle) * velocity,
        y: Math.sin(angle) * velocity - 120,
      };
    });
  }, [confettiActive]);

  // Filter and Search logic
  const filtered = useMemo(() => {
    let list = tasks;
    if (searchQuery.trim()) {
      list = list.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    const matchingCustomSection = customSections.find(s => s.id === activeFilterId);
    if (matchingCustomSection) {
      return list.filter(t => !tasksService.isCompletedForToday(t) && !t.archived && t.category === matchingCustomSection.name);
    }

    switch (activeFilterId) {
      case 'all':
        return list.filter(t => !tasksService.isCompletedForToday(t) && !t.archived);
      case 'today':
        return list.filter(t => !tasksService.isCompletedForToday(t) && !t.archived && t.deadline && new Date(t.deadline).toDateString() === today.toDateString());
      case 'upcoming':
        return list.filter(t => !tasksService.isCompletedForToday(t) && !t.archived && t.deadline && new Date(t.deadline) > today);
      case 'completed':
        return list.filter(t => tasksService.isCompletedForToday(t) && !t.archived);
      case 'high':
        return list.filter(t => !tasksService.isCompletedForToday(t) && !t.archived && (t.priority === 'High' || t.priority === 'Critical'));
      case 'personal':
        return list.filter(t => !tasksService.isCompletedForToday(t) && !t.archived && t.category === 'Personal');
      case 'work':
        return list.filter(t => !tasksService.isCompletedForToday(t) && !t.archived && t.category === 'Work');
      case 'archived':
        return list.filter(t => t.archived);
      default:
        return list.filter(t => !tasksService.isCompletedForToday(t) && !t.archived);
    }
  }, [tasks, activeFilterId, searchQuery, customSections]);

  const resetForm = () => {
    setEditId(null); setTitle(''); setDescription(''); setDeadline('');
    setCategory('General'); setPriority('Medium'); setDifficulty('Medium');
    setEstimatedTime(''); setNotes(''); setProgress('0');
    setRepeatType('none'); setReminderEnabled(false); setReminderTime('08:00');
  };

  const openEdit = (task: Task) => {
    setEditId(task.id);
    setTitle(task.title);
    setDescription(task.description ?? '');
    setDeadline(task.deadline ?? '');
    setCategory(task.category);
    setPriority(task.priority);
    setDifficulty(task.difficulty ?? 'Medium');
    setEstimatedTime(task.estimated_time ? String(task.estimated_time) : '');
    setNotes(task.notes ?? '');
    setProgress(String(task.progress ?? 0));
    setRepeatType(task.repeatType ?? 'none');
    setReminderEnabled(task.reminderEnabled ?? false);
    setReminderTime(task.reminderTime ?? '08:00');
    setModal(true);
  };

  const handleSave = async () => {
    if (!title.trim()) { showAlert('Missing Title', 'Please enter a task title.'); return; }
    setSaving(true);
    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      deadline: deadline.trim() || undefined,
      category,
      priority,
      difficulty,
      estimated_time: estimatedTime ? parseInt(estimatedTime, 10) : undefined,
      notes: notes.trim() || undefined,
      progress: parseInt(progress, 10) || 0,
      completed: false,
      repeatType,
      reminderEnabled: repeatType === 'daily' ? reminderEnabled : false,
      reminderTime: repeatType === 'daily' && reminderEnabled ? reminderTime : undefined,
    };
    if (editId) {
      await updateTask(editId, payload);
    } else {
      await addTask(payload);
    }
    setSaving(false);
    setModal(false);
    resetForm();
  };

  const handleComplete = async (id: string) => {
    triggerCelebration();
    const result = await completeTask(id);
    if (result?.badge) {
      Alert.alert('Badge Earned!', `You unlocked the ${result.badgeName}! Keep going!`, [{ text: 'Awesome!', style: 'default' }]);
    }
  };

  const handleDelete = (id: string, taskTitle: string) => {
    Alert.alert('Delete Task', `Delete "${taskTitle}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeTask(id) },
    ]);
  };

  const handleClearCompleted = () => {
    const completedTasks = tasks.filter(t => t.completed);
    if (completedTasks.length === 0) {
      showAlert('Clear Tasks', 'No completed tasks to archive.');
      return;
    }
    Alert.alert('Archive Completed', `Archive all ${completedTasks.length} completed tasks?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Archive', style: 'default', onPress: async () => {
        for (const t of completedTasks) {
          await archiveTask(t.id);
        }
      }},
    ]);
  };

  const renderSidebarContent = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sidebarScroll}>
      <Text style={[styles.sidebarGroupTitle, { color: colors.textMuted }]}>Custom Layout Filters</Text>
      {FILTER_CHIPS.map(chip => {
        const isSelected = activeFilterId === chip.id;
        return (
          <Pressable
            key={chip.id}
            style={[styles.sidebarItem, isSelected && { backgroundColor: 'rgba(122, 162, 227, 0.12)', borderColor: 'rgba(122, 162, 227, 0.3)' }]}
            onPress={() => {
              setActiveFilterId(chip.id);
              setDrawerOpen(false);
            }}
          >
            <Folder size={18} color={isSelected ? colors.accent : colors.textMuted} strokeWidth={2} />
            <Text style={[styles.sidebarItemText, { color: isSelected ? colors.accent : colors.text }]}>{chip.label}</Text>
          </Pressable>
        );
      })}

      {customSections.length > 0 && (
        <>
          <Text style={[styles.sidebarGroupTitle, { color: colors.textMuted, marginTop: Spacing.lg }]}>My Sections</Text>
          {customSections.map(section => {
            const isSelected = activeFilterId === section.id;
            return (
              <Pressable
                key={section.id}
                style={[styles.sidebarItem, isSelected && { backgroundColor: 'rgba(122, 162, 227, 0.12)', borderColor: 'rgba(122, 162, 227, 0.3)' }]}
                onPress={() => {
                  setActiveFilterId(section.id);
                  setDrawerOpen(false);
                }}
              >
                <Folder size={18} color={isSelected ? colors.accent : section.color} strokeWidth={2} />
                <Text style={[styles.sidebarItemText, { color: isSelected ? colors.accent : colors.text }]} numberOfLines={1}>
                  {section.name}
                </Text>
              </Pressable>
            );
          })}
        </>
      )}
    </ScrollView>
  );

  // Modularized Header for FlatList
  const renderListHeader = () => (
    <View style={styles.listHeaderContainer}>
      {/* 1. Glassmorphic Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View style={styles.greetingCol}>
            <Text style={[styles.greetingText, { color: colors.textSecondary }]}>
              Hello, {user?.username || 'Explorer'}
            </Text>
            <Text style={[styles.dateText, { color: colors.text }]}>
              {today.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </Text>
            <Text style={[styles.quoteText, { color: colors.textMuted }]}>
              &ldquo;{motivationalQuote}&rdquo;
            </Text>
          </View>

          <View style={styles.headerProgressCol}>
            <ProgressRing
              progress={productivityScore}
              size={68}
              strokeWidth={6}
              activeColor={colors.accent}
              inactiveColor="rgba(255, 255, 255, 0.06)"
              textColor={colors.text}
            />
          </View>
        </View>

        <View style={styles.headerRowDivider} />
        
        <View style={styles.headerProfileRow}>
          <View style={styles.profileBadge}>
            <LinearGradient
              colors={[colors.accent, colors.primaryLighter || '#B8D5FF']}
              style={styles.profileAvatar}
            >
              <Text style={styles.profileAvatarText}>
                {(user?.username || 'E').charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>
            <Text style={[styles.profileBadgeName, { color: colors.text }]}>
              {user?.username || 'Offline Account'}
            </Text>
          </View>

          {/* Quick Action Buttons */}
          <View style={styles.quickActionsContainer}>
            <Pressable 
              style={[styles.quickActionButton, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]} 
              onPress={() => setActiveFilterId('high')}
              hitSlop={8}
            >
              <AlertCircle size={15} color={colors.error} />
            </Pressable>
            
            <Pressable 
              style={[styles.quickActionButton, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]} 
              onPress={handleClearCompleted}
              hitSlop={8}
            >
              <Trash2 size={15} color={colors.textSecondary} />
            </Pressable>

            <Pressable 
              style={[styles.quickActionButton, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]} 
              onPress={() => { resetForm(); setModal(true); }}
              hitSlop={8}
            >
              <Plus size={15} color={colors.accent} />
            </Pressable>
          </View>
        </View>
      </View>

      {/* 2. Horizontally Scrollable Compact Summary Cards */}
      <View style={styles.premiumSummaryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.premiumSummaryScroll}>
          <GlassCard style={[styles.premiumSummaryCard, { borderColor: 'rgba(96, 165, 250, 0.2)' }]} padding={12}>
            <Text style={[styles.premiumSummaryNum, { color: '#60A5FA' }]}>{totalActive}</Text>
            <Text style={styles.premiumSummaryLabel}>Pending</Text>
          </GlassCard>
          <GlassCard style={[styles.premiumSummaryCard, { borderColor: 'rgba(52, 211, 153, 0.2)' }]} padding={12}>
            <Text style={[styles.premiumSummaryNum, { color: '#34D399' }]}>{completedCount}</Text>
            <Text style={styles.premiumSummaryLabel}>Completed</Text>
          </GlassCard>
          <GlassCard style={[styles.premiumSummaryCard, { borderColor: 'rgba(239, 83, 80, 0.2)' }]} padding={12}>
            <Text style={[styles.premiumSummaryNum, { color: '#EF5350' }]}>{overdueCount}</Text>
            <Text style={styles.premiumSummaryLabel}>Overdue</Text>
          </GlassCard>
          <GlassCard style={[styles.premiumSummaryCard, { borderColor: 'rgba(255, 183, 77, 0.2)' }]} padding={12}>
            <Text style={[styles.premiumSummaryNum, { color: '#FFB74D' }]}>{todayTasksCount}</Text>
            <Text style={styles.premiumSummaryLabel}>Today's Tasks</Text>
          </GlassCard>
        </ScrollView>
      </View>

      {/* 3. Gamification System Card */}
      <View style={styles.gameCard}>
        <View style={styles.gameTop}>
          <View style={styles.levelBadge}>
            <Zap size={15} color={colors.accent} />
            <Text style={[styles.levelText, { color: colors.text }]}>Level {level}</Text>
          </View>
          {streakCount > 0 && (
            <View style={styles.streakBadge}>
              <Flame size={15} color="#FF9800" />
              <Text style={[styles.streakText, { color: colors.text }]}>{streakCount} Day Streak</Text>
            </View>
          )}
        </View>
        
        <View style={styles.xpProgressContainer}>
          <View style={styles.xpLabelRow}>
            <Text style={[styles.xpTextLabel, { color: colors.textSecondary }]}>Experience Points</Text>
            <Text style={[styles.xpPoints, { color: colors.accent }]}>{xpProgress} / 100 XP</Text>
          </View>
          <ProgressBar
            progress={xpProgress}
            height={6}
            color={colors.accent}
            backgroundColor="rgba(255, 255, 255, 0.05)"
          />
        </View>

        {/* Unlocked Badges Row */}
        {badges && badges.length > 0 && (
          <View style={styles.badgesListRow}>
            <Text style={[styles.badgesListTitle, { color: colors.textMuted }]}>Unlocked Badges</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgesScroll}>
              {badges.map((badge) => {
                const badgeColor = colors.badge[badge.type] || colors.accent;
                return (
                  <View key={badge.id} style={[styles.badgeIconBubble, { borderColor: badgeColor + '30', backgroundColor: badgeColor + '10' }]}>
                    <Award size={14} color={badgeColor} />
                    <Text style={[styles.badgeIconName, { color: colors.text }]} numberOfLines={1}>{badge.name}</Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );

  // List Empty Component Redesign
  const renderListEmpty = () => (
    <View style={styles.emptyCard}>
      <View style={styles.emptyIconContainer}>
        <Sparkles size={36} color={colors.accent} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No items matching filters</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
        {activeFilterId === 'completed' ? 'Great consistency! Start planning new milestones.' : 'Clear up items or click below to build new habits.'}
      </Text>
      <PrimaryButton
        title="Create Your First Task"
        onPress={() => { resetForm(); setModal(true); }}
        style={styles.emptyCta}
      />
    </View>
  );

  // List Footer Component Redesign
  const renderListFooter = () => (
    <View style={styles.listFooterContainer}>
      <View style={styles.chartsSection}>
        <ProductivityCharts tasks={tasks} colors={colors} />
      </View>
      <View style={{ height: insets.bottom + 120 }} />
    </View>
  );

  return (
    <LinearGradient
      colors={['#000B29', '#051944', '#000B29']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.root}
    >
      <View style={[styles.premiumTasksHeader, { paddingTop: insets.top + 12 }]}>
        {/* Row 1 */}
        <View style={styles.headerFirstRow}>
          <Pressable
            style={({ pressed }) => [styles.headerIconBtn, pressed && { opacity: 0.7 }]}
            onPress={openDrawer}
          >
            <Menu size={24} color="#FFFFFF" strokeWidth={2.5} />
          </Pressable>
          
          <Text style={styles.tasksHeaderTitle}>Tasks</Text>

          <Pressable
            style={({ pressed }) => [styles.headerIconBtn, pressed && { opacity: 0.7 }]}
            onPress={() => setNotificationsOpen(true)}
          >
            <Bell size={22} color="#FFFFFF" strokeWidth={2} />
            {unreadCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Row 2 */}
        <View style={styles.headerSecondRow}>
          <View style={styles.premiumSearchWrapper}>
            <Search size={18} color="#94A3B8" style={{ marginRight: 8 }} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search tasks..."
              placeholderTextColor="#64748B"
              style={{ flex: 1, color: '#FFFFFF', fontSize: 14, padding: 0 }}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                <X size={16} color="#94A3B8" />
              </Pressable>
            )}
          </View>
          <Pressable style={styles.filterToggleBtn}>
            <SlidersHorizontal size={18} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Row 3: Quick Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.premiumChipsScroll}>
          {FILTER_CHIPS.map(chip => {
            const isSelected = activeFilterId === chip.id;
            return (
              <Pressable
                key={chip.id}
                style={[
                  styles.premiumChip,
                  isSelected && { borderColor: '#3B82F6', backgroundColor: 'rgba(59, 130, 246, 0.15)' }
                ]}
                onPress={() => setActiveFilterId(chip.id)}
              >
                <Text style={[styles.premiumChipText, { color: isSelected ? '#3B82F6' : '#94A3B8' }]}>
                  {chip.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.contentContainer}>
        <StatusBar barStyle="light-content" />

        <View style={styles.mainLayout}>
          {/* Permanent Sidebar (Large Screens) */}
          {isLargeScreen && (
            <View style={[styles.largeSidebar, { borderColor: colors.border }]}>
              {renderSidebarContent()}
            </View>
          )}

          {/* High Performance Virtualized FlatList */}
          {loading ? (
            <View style={styles.center}><ActivityIndicator color={colors.accent} size="large" /></View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <View style={styles.flatListItemWrapper}>
                  <TaskCard
                    task={item}
                    colors={colors}
                    onComplete={handleComplete}
                    onDelete={handleDelete}
                    onEdit={openEdit}
                    onArchive={archiveTask}
                    onRestore={restoreTask}
                  />
                </View>
              )}
              ListHeaderComponent={renderListHeader}
              ListEmptyComponent={renderListEmpty}
              ListFooterComponent={renderListFooter}
              contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarHeight + 24 }]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              initialNumToRender={8}
              windowSize={5}
              maxToRenderPerBatch={10}
              removeClippedSubviews={Platform.OS === 'android'}
            />
          )}
        </View>

        {/* Floating Action Button (FAB) */}
        <Pressable
          style={({ pressed }) => [
            styles.fab,
            { backgroundColor: colors.accent },
            pressed && { opacity: 0.9, transform: [{ scale: 0.95 }] }
          ]}
          onPress={() => { resetForm(); setModal(true); }}
        >
          <LinearGradient
            colors={[colors.accent, colors.primaryLighter || '#B8D5FF']}
            style={StyleSheet.absoluteFillObject}
          />
          <Plus size={26} color="#FFFFFF" strokeWidth={2.5} />
        </Pressable>

        {/* Mobile Slide-out Drawer */}
        {!isLargeScreen && (
          <Modal transparent visible={drawerOpen} animationType="none" onRequestClose={() => setDrawerOpen(false)}>
            <View style={styles.drawerOverlay}>
              <Pressable style={StyleSheet.absoluteFill} onPress={() => setDrawerOpen(false)} />
              <Animated.View style={[styles.drawerBody, { backgroundColor: '#000B29', borderColor: 'rgba(255, 255, 255, 0.08)', transform: [{ translateX: drawerAnim }], paddingTop: insets.top + 16 }]}>
                <View style={styles.drawerHeader}>
                  <Text style={[styles.drawerTitle, { color: colors.text }]}>Navigation</Text>
                  <Pressable onPress={() => setDrawerOpen(false)} hitSlop={8}>
                    <X size={20} color={colors.textMuted} />
                  </Pressable>
                </View>
                {renderSidebarContent()}
              </Animated.View>
            </View>
          </Modal>
        )}

        {/* Confetti Celebration Overlay */}
        {confettiActive && (
          <View style={styles.confettiOverlay} pointerEvents="none">
            {confettiParticles.map(p => {
              const particleY = confettiAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, p.y],
              });
              const particleX = confettiAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, p.x],
              });
              const particleScale = confettiAnim.interpolate({
                inputRange: [0, 0.7, 1],
                outputRange: [1, 1, 0],
              });

              return (
                <Animated.View
                  key={p.id}
                  style={[
                    styles.confettiParticle,
                    {
                      width: p.size,
                      height: p.size,
                      borderRadius: p.size / 2,
                      backgroundColor: p.color,
                      transform: [
                        { translateX: particleX },
                        { translateY: particleY },
                        { scale: particleScale },
                      ],
                    },
                  ]}
                />
              );
            })}
          </View>
        )}

        {/* Animated Bottom Sheet Modal (Create/Edit Task) */}
        <Modal
          visible={modal}
          transparent
          animationType="slide"
          onRequestClose={() => { setModal(false); resetForm(); }}
        >
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <Pressable style={StyleSheet.absoluteFill} onPress={() => { setModal(false); resetForm(); }} />
            <View style={[styles.modalCard, { backgroundColor: '#091530', borderColor: 'rgba(255, 255, 255, 0.08)' }]}>
              {/* Drag indicator bar for premium bottom-sheet feeling */}
              <View style={styles.dragIndicator} />
              
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {editId ? 'Modify Task Details' : 'Design New Task'}
                </Text>
                <Pressable onPress={() => { setModal(false); resetForm(); }} hitSlop={8}>
                  <X size={20} color={colors.textMuted} />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <AppInput
                  label="Task Name *"
                  placeholder="Enter details..."
                  value={title}
                  onChangeText={setTitle}
                />
                
                <AppInput
                  label="Description"
                  placeholder="Provide supporting context..."
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={2}
                />

                {/* Calendar Date Picker */}
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Due Date</Text>
                <Pressable
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    borderRadius: Radius.md,
                    padding: Spacing.md,
                    marginBottom: Spacing.md,
                    justifyContent: 'center',
                  }}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={{ color: deadline ? '#FFFFFF' : '#94A3B8', fontSize: 14 }}>
                    {deadline ? new Date(deadline).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Select Date...'}
                  </Text>
                </Pressable>
                
                {showDatePicker && (
                  <DateTimePicker
                    value={deadline ? new Date(deadline) : new Date()}
                    mode="date"
                    display="default"
                    themeVariant="dark"
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) {
                        setDeadline(selectedDate.toISOString().split('T')[0]);
                      }
                    }}
                  />
                )}

                <AppInput
                  label="Allocated Estimated Duration (mins)"
                  placeholder="e.g. 45"
                  value={estimatedTime}
                  onChangeText={setEstimatedTime}
                  keyboardType="number-pad"
                />

                {editId && (
                  <AppInput
                    label="Current Progress Completion %"
                    placeholder="0-100"
                    value={progress}
                    onChangeText={setProgress}
                    keyboardType="number-pad"
                  />
                )}

                <AppInput
                  label="Detailed Notes"
                  placeholder="Notes, lists, or URLs..."
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={2}
                />

                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Priority Rating</Text>
                <View style={styles.chipRow}>
                  {PRIORITY_VALUES.map(p => (
                    <Pressable
                      key={p}
                      style={[
                        styles.chipItem,
                        { borderColor: 'rgba(255, 255, 255, 0.08)', backgroundColor: 'rgba(255, 255, 255, 0.02)' },
                        priority === p && { borderColor: PRIORITY_COLORS[p], backgroundColor: PRIORITY_COLORS[p] + '18' }
                      ]}
                      onPress={() => setPriority(p)}
                    >
                      <Text style={[styles.chipItemText, { color: priority === p ? PRIORITY_COLORS[p] : colors.textMuted }]}>
                        {p}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Difficulty Rating</Text>
                <View style={styles.chipRow}>
                  {DIFFICULTY_VALUES.map(d => (
                    <Pressable
                      key={d}
                      style={[
                        styles.chipItem,
                        { borderColor: 'rgba(255, 255, 255, 0.08)', backgroundColor: 'rgba(255, 255, 255, 0.02)' },
                        difficulty === d && { borderColor: colors.accent, backgroundColor: colors.accent + '18' }
                      ]}
                      onPress={() => setDifficulty(d)}
                    >
                      <Text style={[styles.chipItemText, { color: difficulty === d ? colors.accent : colors.textMuted }]}>
                        {d}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Category Tag</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.lg }}>
                  <View style={styles.chipRow}>
                    {availableCategories.map(c => (
                      <Pressable
                        key={c}
                        style={[
                          styles.chipItem,
                          { borderColor: 'rgba(255, 255, 255, 0.08)', backgroundColor: 'rgba(255, 255, 255, 0.02)' },
                          category === c && { borderColor: colors.accent, backgroundColor: colors.accent + '18' }
                        ]}
                        onPress={() => setCategory(c)}
                      >
                        <Text style={[styles.chipItemText, { color: category === c ? colors.accent : colors.textMuted }]}>
                          {c}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>

                {/* Recurrence Section */}
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Recurrence</Text>
                <View style={styles.chipRow}>
                  <Pressable
                    style={[
                      styles.chipItem,
                      { borderColor: 'rgba(255, 255, 255, 0.08)', backgroundColor: 'rgba(255, 255, 255, 0.02)' },
                      repeatType === 'none' && { borderColor: colors.accent, backgroundColor: colors.accent + '18' }
                    ]}
                    onPress={() => setRepeatType('none')}
                  >
                    <Text style={[styles.chipItemText, { color: repeatType === 'none' ? colors.accent : colors.textMuted }]}>
                      None
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.chipItem,
                      { borderColor: 'rgba(255, 255, 255, 0.08)', backgroundColor: 'rgba(255, 255, 255, 0.02)' },
                      repeatType === 'daily' && { borderColor: colors.accent, backgroundColor: colors.accent + '18' }
                    ]}
                    onPress={() => setRepeatType('daily')}
                  >
                    <Text style={[styles.chipItemText, { color: repeatType === 'daily' ? colors.accent : colors.textMuted }]}>
                      Every Day
                    </Text>
                  </Pressable>
                </View>

                {/* Reminder Section - Only show when recurrence is daily */}
                {repeatType === 'daily' && (
                  <>
                    <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginTop: Spacing.md }]}>Daily Reminder</Text>
                    <View style={[styles.reminderToggleRow, { borderColor: 'rgba(255, 255, 255, 0.08)' }]}>
                      <Text style={[styles.reminderToggleText, { color: colors.text }]}>Enable Daily Reminder</Text>
                      <Pressable
                        style={[
                          styles.reminderToggleSwitch,
                          reminderEnabled ? { backgroundColor: colors.accent } : { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
                        ]}
                        onPress={() => setReminderEnabled(!reminderEnabled)}
                        hitSlop={12}
                      >
                        <View style={[
                          styles.reminderToggleKnob,
                          reminderEnabled ? { transform: [{ translateX: 20 }] } : { transform: [{ translateX: 0 }] }
                        ]} />
                      </Pressable>
                    </View>

                    {reminderEnabled && (
                      <>
                        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Reminder Time</Text>
                        <Pressable
                          style={{
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            borderColor: 'rgba(255,255,255,0.1)',
                            borderWidth: 1,
                            borderRadius: Radius.md,
                            padding: Spacing.md,
                            marginBottom: Spacing.md,
                            justifyContent: 'center',
                          }}
                          onPress={() => setShowTimePicker(true)}
                        >
                          <Text style={{ color: '#FFFFFF', fontSize: 14 }}>{reminderTime}</Text>
                        </Pressable>
                        
                        {showTimePicker && (
                          <DateTimePicker
                            value={new Date(`2026-01-01T${reminderTime}:00`)}
                            mode="time"
                            display="default"
                            is24Hour={true}
                            themeVariant="dark"
                            onChange={(event, selectedTime) => {
                              setShowTimePicker(false);
                              if (selectedTime) {
                                const hours = String(selectedTime.getHours()).padStart(2, '0');
                                const minutes = String(selectedTime.getMinutes()).padStart(2, '0');
                                setReminderTime(`${hours}:${minutes}`);
                              }
                            }}
                          />
                        )}
                      </>
                    )}
                  </>
                )}

                <PrimaryButton
                  title={editId ? 'Commit Changes' : 'Publish Task'}
                  onPress={handleSave}
                  loading={saving}
                />
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
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
                        <Trash2 size={16} color="#EF4444" style={{ marginTop: 2 }} />
                      </Pressable>
                    </View>
                  )}
                />
              )}
            </View>
          </View>
        </Modal>

      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  // Premium Glass Top Header Bar
  premiumTasksHeader: {
    backgroundColor: 'rgba(0, 11, 41, 0.75)',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
    gap: 12,
  },
  headerFirstRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tasksHeaderTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  headerSecondRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  premiumSearchWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  filterToggleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  premiumChipsScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  premiumChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  premiumChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  premiumSummaryContainer: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  premiumSummaryScroll: {
    paddingHorizontal: Spacing.base,
    gap: 8,
  },
  premiumSummaryCard: {
    width: 105,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
  },
  premiumSummaryNum: {
    fontSize: 18,
    fontWeight: '800',
  },
  premiumSummaryLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
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
  modalSheet: {
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    borderWidth: 1,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  modalHandle: { width: 36, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.base },
  contentContainer: { flex: 1 },
  mainLayout: { flex: 1, flexDirection: 'row' },
  
  largeSidebar: {
    width: 240,
    borderRightWidth: 1,
    paddingVertical: Spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  sidebarScroll: { paddingHorizontal: Spacing.sm, gap: 6 },
  sidebarGroupTitle: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  sidebarItemText: { fontSize: 13, fontWeight: '600' },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    gap: Spacing.base,
  },
  flatListItemWrapper: {
    marginBottom: Spacing.xs,
  },

  listHeaderContainer: {
    gap: Spacing.base,
  },

  // Redesigned Glassmorphic Header Section
  headerCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuBtn: { width: 36, height: 36, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginRight: Spacing.sm },
  greetingCol: {
    flex: 1,
    gap: 3,
  },
  greetingText: {
    fontSize: 13,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  quoteText: {
    fontSize: 11,
    fontStyle: 'italic',
    lineHeight: 15,
    marginTop: 4,
  },
  headerProgressCol: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRowDivider: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerProfileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  profileAvatar: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  profileBadgeName: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Header Quick Actions
  quickActionsContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  quickActionButton: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Premium Grid Task Analytics
  analyticsSection: {
    gap: Spacing.sm,
  },
  analyticsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  analyticsCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: Spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  overdueAnalyticsCard: {
    borderColor: 'rgba(239, 83, 80, 0.25)',
    backgroundColor: 'rgba(239, 83, 80, 0.04)',
  },
  analyticsNum: {
    fontSize: 22,
    fontWeight: '800',
  },
  analyticsLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  
  // Weekly Productivity Card
  weeklyProductivityCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(122, 162, 227, 0.15)',
    padding: Spacing.md,
    overflow: 'hidden',
    position: 'relative',
    gap: 6,
  },
  weeklyProductivityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weeklyProductivityTitle: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  weeklyProductivityText: {
    fontSize: 12,
    lineHeight: 16.5,
  },

  // Gamification Card
  gameCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  gameTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(122, 162, 227, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    gap: 6,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '700',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    gap: 6,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '700',
  },
  xpProgressContainer: {
    gap: 6,
  },
  xpLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  xpTextLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  xpPoints: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgesListRow: {
    marginTop: Spacing.xs,
    gap: Spacing.sm,
  },
  badgesListTitle: {
    fontSize: 10.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badgesScroll: {
    gap: Spacing.sm,
    paddingVertical: 2,
  },
  badgeIconBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    gap: 6,
  },
  badgeIconName: {
    fontSize: 11.5,
    fontWeight: '600',
  },

  // Smart Search and Filters
  filterSection: {
    gap: Spacing.md,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  menuButton: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageHeading: {
    fontSize: 18,
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  chipsScroll: {
    gap: Spacing.xs,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12.5,
    fontWeight: '600',
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },

  // Redesigned Empty State
  emptyCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    marginTop: Spacing.base,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(122, 162, 227, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyCta: {
    marginTop: Spacing.xs,
    width: '100%',
  },

  // Footer & Charts
  listFooterContainer: {
    marginTop: Spacing.lg,
    gap: Spacing.base,
  },
  chartsSection: {
    marginTop: Spacing.sm,
  },

  // Floating Action Button
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7AA2E3',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    overflow: 'hidden',
  },

  // Confetti celebration
  confettiOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confettiParticle: {
    position: 'absolute',
  },

  // Drawer styles
  drawerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    flexDirection: 'row',
  },
  drawerBody: {
    width: 260,
    height: '100%',
    borderRightWidth: 1,
    paddingHorizontal: Spacing.sm,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  drawerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  modalCard: {
    width: '100%',
    maxHeight: '85%',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: Spacing.xl,
    paddingTop: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 12,
  },
  dragIndicator: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  calendarHelperRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  calendarHelperBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  calendarHelperText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  chipItem: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  chipItemText: {
    fontSize: 12.5,
    fontWeight: '600',
  },

  // Reminder Toggle Styles
  reminderToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  reminderToggleText: {
    fontSize: 14,
    fontWeight: '500',
  },
  reminderToggleSwitch: {
    width: 48,
    height: 26,
    borderRadius: 13,
    padding: 2,
  },
  reminderToggleKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
  },

  // Time Picker Styles
  timePickerRow: {
    gap: Spacing.sm,
  },
  timePickerInput: {
    flex: 1,
    height: 44,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    fontSize: 14,
  },
  timePickerHelper: {
    fontSize: 11,
    marginTop: 2,
  },
});
