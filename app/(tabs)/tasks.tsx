import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Modal,
  KeyboardAvoidingView, Platform, StatusBar, ActivityIndicator,
  TextInput, useWindowDimensions, Animated, FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Plus, Search, CheckCircle2, Circle, Clock, Bell,
  Trash2, CheckSquare, X, Edit2, Archive, RotateCcw,
  Menu, Folder, Inbox, ChevronRight, Sparkles, Award, Flame, Zap
} from 'lucide-react-native';
import { useAuth, useAlert } from '@/template';
import { useTasks } from '@/hooks/useTasks';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useCustomSections } from '@/hooks/useModules';
import { Spacing, Radius, Typography } from '@/constants/theme';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { AppInput } from '@/components/ui/AppInput';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { LinearGradient } from 'expo-linear-gradient';

// Supporting Redesign Components
import { ProgressRing } from '@/components/feature/tasks/ProgressRing';
import { ProductivityCharts } from '@/components/feature/tasks/ProductivityCharts';
import { TaskCard } from '@/components/feature/tasks/TaskCard';
import { Task } from '@/services/tasksService';

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
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;

  const { user } = useAuth();
  const { tasks, loading, addTask, updateTask, removeTask, completeTask, archiveTask, restoreTask } = useTasks();
  const { sections: customSections } = useCustomSections();
  const { showAlert } = useAlert();

  // Redesign state
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
  const completedCount = useMemo(() => tasks.filter(t => t.completed).length, [tasks]);
  const totalActive = useMemo(() => tasks.filter(t => !t.completed && !t.archived).length, [tasks]);
  const overdueCount = useMemo(() => tasks.filter(t => !t.completed && !t.archived && t.deadline && new Date(t.deadline!) < today).length, [tasks]);
  
  const xp = completedCount * 10;
  const level = Math.floor(xp / 100) + 1;
  const xpProgress = xp % 100;

  // Calculate Streak
  const streakCount = useMemo(() => {
    const completedDates = tasks
      .filter(t => t.completed && t.completed_at)
      .map(t => new Date(t.completed_at!).toDateString());
    
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
      return list.filter(t => !t.completed && !t.archived && t.category === matchingCustomSection.name);
    }

    switch (activeFilterId) {
      case 'all':
        return list.filter(t => !t.completed && !t.archived);
      case 'today':
        return list.filter(t => !t.completed && !t.archived && t.deadline && new Date(t.deadline).toDateString() === today.toDateString());
      case 'upcoming':
        return list.filter(t => !t.completed && !t.archived && t.deadline && new Date(t.deadline) > today);
      case 'completed':
        return list.filter(t => t.completed && !t.archived);
      case 'high':
        return list.filter(t => !t.completed && !t.archived && (t.priority === 'High' || t.priority === 'Critical'));
      case 'personal':
        return list.filter(t => !t.completed && !t.archived && t.category === 'Personal');
      case 'work':
        return list.filter(t => !t.completed && !t.archived && t.category === 'Work');
      case 'archived':
        return list.filter(t => t.archived);
      default:
        return list.filter(t => !t.completed && !t.archived);
    }
  }, [tasks, activeFilterId, searchQuery, customSections]);

  const resetForm = () => {
    setEditId(null); setTitle(''); setDescription(''); setDeadline('');
    setCategory('General'); setPriority('Medium'); setDifficulty('Medium');
    setEstimatedTime(''); setNotes(''); setProgress('0');
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
      showAlert('Badge Earned!', `You unlocked the ${result.badgeName}! Keep going!`, [{ text: 'Awesome!', style: 'default' }]);
    }
  };

  const handleDelete = (id: string, taskTitle: string) => {
    showAlert('Delete Task', `Delete "${taskTitle}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeTask(id) },
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

  return (
    <LinearGradient
      colors={['#000B29', '#051944', '#000B29']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.root}
    >
      <View style={[styles.contentContainer, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" />

        <View style={styles.mainLayout}>
          {/* Permanent Sidebar (Large Screens) */}
          {isLargeScreen && (
            <View style={[styles.largeSidebar, { borderColor: colors.border }]}>
              {renderSidebarContent()}
            </View>
          )}

          {/* Core Dashboard */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {/* 1. Header Section */}
            <View style={[styles.headerCard, { backgroundColor: 'rgba(255, 255, 255, 0.03)', borderColor: colors.border }]}>
              <View style={styles.headerTop}>
                {/* Greeting & Date */}
                <View style={styles.greetingCol}>
                  <Text style={[styles.greetingText, { color: colors.textSecondary }]}>
                    Hello, {user?.username || 'Explorer'}
                  </Text>
                  <Text style={[styles.dateText, { color: colors.text }]}>
                    {today.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </Text>
                  <Text style={[styles.quoteText, { color: colors.textMuted }]}>
                    "{motivationalQuote}"
                  </Text>
                </View>

                {/* Progress Ring & Ring stats */}
                <View style={styles.headerProgressCol}>
                  <ProgressRing
                    progress={tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0}
                    size={68}
                    strokeWidth={6}
                    activeColor={colors.accent}
                    inactiveColor="rgba(255, 255, 255, 0.06)"
                  />
                </View>
              </View>

              {/* Avatar and Notification Bell */}
              <View style={[styles.headerRowDivider, { borderTopColor: colors.borderLight }]} />
              
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

                <View style={styles.notificationBellContainer}>
                  <Pressable style={[styles.bellButton, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
                    <Bell size={18} color={colors.text} />
                    <View style={styles.bellBadge} />
                  </Pressable>
                </View>
              </View>
            </View>

            {/* 2. Task Overview Carousel */}
            <View style={styles.statsCarouselSection}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsScroll}>
                {/* Stats items */}
                <View style={[styles.statsCard, { backgroundColor: 'rgba(255, 255, 255, 0.03)', borderColor: colors.border }]}>
                  <Text style={[styles.statsNum, { color: colors.accent }]}>{totalActive}</Text>
                  <Text style={[styles.statsLabel, { color: colors.textMuted }]}>Active</Text>
                </View>

                <View style={[styles.statsCard, { backgroundColor: 'rgba(255, 255, 255, 0.03)', borderColor: colors.border }]}>
                  <Text style={[styles.statsNum, { color: '#4CAF50' }]}>{completedCount}</Text>
                  <Text style={[styles.statsLabel, { color: colors.textMuted }]}>Completed</Text>
                </View>

                <View style={[styles.statsCard, { backgroundColor: 'rgba(255, 255, 255, 0.03)', borderColor: colors.border }]}>
                  <Text style={[styles.statsNum, { color: '#FFB74D' }]}>
                    {tasks.filter(t => !t.completed && !t.archived && t.deadline && new Date(t.deadline).toDateString() === today.toDateString()).length}
                  </Text>
                  <Text style={[styles.statsLabel, { color: colors.textMuted }]}>Today's</Text>
                </View>

                <View style={[styles.statsCard, { backgroundColor: 'rgba(255, 255, 255, 0.03)', borderColor: colors.border }]}>
                  <Text style={[styles.statsNum, { color: '#EF5350' }]}>{overdueCount}</Text>
                  <Text style={[styles.statsLabel, { color: colors.textMuted }]}>Overdue</Text>
                </View>

                <View style={[styles.statsCard, { backgroundColor: 'rgba(255, 255, 255, 0.03)', borderColor: colors.border }]}>
                  <Text style={[styles.statsNum, { color: colors.text }]}>
                    {tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0}%
                  </Text>
                  <Text style={[styles.statsLabel, { color: colors.textMuted }]}>Progress</Text>
                </View>
              </ScrollView>
            </View>

            {/* 8. Gamification details */}
            <View style={[styles.gameCard, { backgroundColor: 'rgba(255, 255, 255, 0.03)', borderColor: colors.border }]}>
              <View style={styles.gameTop}>
                <View style={styles.levelBadge}>
                  <Zap size={16} color={colors.accent} />
                  <Text style={[styles.levelText, { color: colors.text }]}>Level {level}</Text>
                </View>
                {streakCount > 0 && (
                  <View style={styles.streakBadge}>
                    <Flame size={16} color="#FF9800" />
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
            </View>

            {/* 3. Search and Chip Filters */}
            <View style={styles.filterSection}>
              {!isLargeScreen && (
                <View style={styles.menuRow}>
                  <Pressable onPress={() => setDrawerOpen(true)} style={[styles.menuButton, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]} hitSlop={12}>
                    <Menu size={20} color={colors.text} />
                  </Pressable>
                  <Text style={[styles.pageHeading, { color: colors.text }]}>Task Board</Text>
                </View>
              )}

              {/* Glassmorphic Search Bar */}
              <View style={[styles.searchBar, { backgroundColor: 'rgba(255, 255, 255, 0.03)', borderColor: colors.border }]}>
                <Search size={16} color={colors.textMuted} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="Search and explore tasks..."
                  placeholderTextColor={colors.textDim}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                    <X size={16} color={colors.textMuted} />
                  </Pressable>
                )}
              </View>

              {/* Horizontal filter chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
                {FILTER_CHIPS.map(chip => {
                  const isSelected = activeFilterId === chip.id;
                  return (
                    <Pressable
                      key={chip.id}
                      style={[
                        styles.chip,
                        { borderColor: colors.border, backgroundColor: 'rgba(255, 255, 255, 0.03)' },
                        isSelected && { borderColor: colors.accent, backgroundColor: 'rgba(122, 162, 227, 0.15)' }
                      ]}
                      onPress={() => setActiveFilterId(chip.id)}
                    >
                      <Text style={[styles.chipText, { color: isSelected ? colors.accent : colors.textMuted }]}>
                        {chip.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* 4. Task List Redesign */}
            {loading ? (
              <View style={styles.center}><ActivityIndicator color={colors.accent} size="large" /></View>
            ) : filtered.length === 0 ? (
              /* 9. Empty State Redesign */
              <View style={[styles.empty, { backgroundColor: 'rgba(255, 255, 255, 0.02)', borderColor: colors.border }]}>
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
            ) : (
              <View style={styles.tasksList}>
                {filtered.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    colors={colors}
                    onComplete={handleComplete}
                    onDelete={handleDelete}
                    onEdit={openEdit}
                    onArchive={archiveTask}
                    onRestore={restoreTask}
                  />
                ))}
              </View>
            )}

            {/* 7. Productivity Dashboard Panel */}
            <View style={styles.chartsSection}>
              <ProductivityCharts tasks={tasks} colors={colors} />
            </View>

            <View style={{ height: insets.bottom + 120 }} />
          </ScrollView>
        </View>

        {/* 5. Modern Floating Action Button (FAB) */}
        <Pressable
          style={({ pressed }) => [
            styles.fab,
            { backgroundColor: colors.accent },
            pressed && { opacity: 0.9 }
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
              <Animated.View style={[styles.drawerBody, { backgroundColor: '#000B29', borderColor: colors.border, transform: [{ translateX: drawerAnim }], paddingTop: insets.top + 16 }]}>
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

        {/* 6. Slide-up Modal Sheet (Create/Edit Task) */}
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
            <View style={[styles.modalCard, { backgroundColor: '#0A1530', borderColor: colors.border }]}>
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

                {/* Calendar Date Row Helper */}
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Due Date Calendar Helper</Text>
                <View style={styles.calendarHelperRow}>
                  <Pressable
                    style={[styles.calendarHelperBtn, deadline === today.toISOString().split('T')[0] && { backgroundColor: colors.accent }]}
                    onPress={() => setDeadline(today.toISOString().split('T')[0])}
                  >
                    <Text style={[styles.calendarHelperText, { color: deadline === today.toISOString().split('T')[0] ? '#fff' : colors.text }]}>Today</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.calendarHelperBtn, deadline === new Date(Date.now() + 86400000).toISOString().split('T')[0] && { backgroundColor: colors.accent }]}
                    onPress={() => setDeadline(new Date(Date.now() + 86400000).toISOString().split('T')[0])}
                  >
                    <Text style={[styles.calendarHelperText, { color: deadline === new Date(Date.now() + 86400000).toISOString().split('T')[0] ? '#fff' : colors.text }]}>Tomorrow</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.calendarHelperBtn, deadline === '' && { backgroundColor: colors.accent }]}
                    onPress={() => setDeadline('')}
                  >
                    <Text style={[styles.calendarHelperText, { color: deadline === '' ? '#fff' : colors.text }]}>None</Text>
                  </Pressable>
                </View>

                <AppInput
                  label="Specific Deadline (YYYY-MM-DD)"
                  placeholder="e.g. 2026-12-31"
                  value={deadline}
                  onChangeText={setDeadline}
                />

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
                        { borderColor: colors.border, backgroundColor: 'rgba(255, 255, 255, 0.03)' },
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
                        { borderColor: colors.border, backgroundColor: 'rgba(255, 255, 255, 0.03)' },
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
                          { borderColor: colors.border, backgroundColor: 'rgba(255, 255, 255, 0.03)' },
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

                <PrimaryButton
                  title={editId ? 'Commit Changes' : 'Publish Task'}
                  onPress={handleSave}
                  loading={saving}
                />
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
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

  // Header Section
  headerCard: {
    borderRadius: Radius.xxl,
    borderWidth: 1,
    padding: Spacing.xl,
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
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
    marginTop: 2,
  },
  headerProgressCol: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRowDivider: {
    borderTopWidth: 1,
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
  notificationBellContainer: {
    position: 'relative',
  },
  bellButton: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF5350',
  },

  // Carousel Stats Section
  statsCarouselSection: {
    marginHorizontal: -Spacing.base,
  },
  statsScroll: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
  },
  statsCard: {
    width: 100,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.md,
    gap: 4,
    alignItems: 'center',
  },
  statsNum: {
    fontSize: 22,
    fontWeight: '800',
  },
  statsLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  // Gamification card
  gameCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
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
    borderRadius: Radius.xl,
    borderWidth: 1,
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

  // Task list
  tasksList: {
    gap: Spacing.xs,
  },
  center: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty state
  empty: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
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

  // Charts
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
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
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
});

