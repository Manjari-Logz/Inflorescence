import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, StatusBar, Modal,
  KeyboardAvoidingView, Platform, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Award, CheckCircle2, Flag, Zap, Moon, Sun, LogOut,
  ChevronRight, BookOpen, BarChart2, Trophy, Settings,
  GraduationCap, Shield, Bell, Download, User, Wallet,
  Dumbbell, Headphones, Briefcase, Layers, PenLine, LayoutGrid,
  Edit2, X, Camera, Mail, Phone, MapPin, Calendar, GraduationCap as GradCap,
  Globe, Save, Menu,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useAlert } from '@/hooks/useAlert';
import { useTasks } from '@/hooks/useTasks';
import { useBadges } from '@/hooks/useBadges';
import { useGoals } from '@/hooks/useGoals';
import { useEvents } from '@/hooks/useEvents';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useDrawer } from '@/contexts/DrawerContext';
import { Typography, Spacing, Radius, MODULE_ROUTES, Colors } from '@/constants/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { AppInput } from '@/components/ui/AppInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { BADGE_MILESTONES } from '@/services/badgesService';

function getLevelInfo(completedTasks: number) {
  if (completedTasks >= 1000) return { label: 'Legend', color: Colors.error, xp: 1000 };
  if (completedTasks >= 500) return { label: 'Master', color: '#A855F7', xp: 500 };
  if (completedTasks >= 250) return { label: 'Diamond', color: Colors.accent, xp: 250 };
  if (completedTasks >= 100) return { label: 'Gold', color: Colors.warning, xp: 100 };
  if (completedTasks >= 50) return { label: 'Silver', color: '#94A3B8', xp: 50 };
  if (completedTasks >= 10) return { label: 'Bronze', color: '#CD7F32', xp: 10 };
  return { label: 'Beginner', color: Colors.success, xp: 0 };
}

const MODULE_ICON_MAP: Record<string, any> = {
  books: BookOpen,
  podcasts: Headphones,
  placement: Briefcase,
  custom: Layers,
  exercise: Dumbbell,
  money: Wallet,
  reflection: PenLine,
  analytics: BarChart2,
  badges: Trophy,
};

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, mode, toggleTheme } = useAppTheme();
  const { openDrawer } = useDrawer();
  const { user, logout, updateProfile } = useAuth();
  const { showAlert } = useAlert();
  const { tasks } = useTasks();
  const { badges } = useBadges();
  const { shortGoals, longGoals, dreams } = useGoals();
  const { hackathons } = useEvents();

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: user?.user_metadata?.full_name || '',
    username: user?.username || '',
    bio: user?.user_metadata?.bio || '',
    phone: user?.user_metadata?.phone || '',
    location: user?.user_metadata?.location || '',
    college: user?.user_metadata?.college || '',
    department: user?.user_metadata?.department || '',
    year_of_study: user?.user_metadata?.year_of_study || '',
    skills: user?.user_metadata?.skills || '',
    interests: user?.user_metadata?.interests || '',
    github: user?.user_metadata?.github || '',
    linkedin: user?.user_metadata?.linkedin || '',
    portfolio: user?.user_metadata?.portfolio || '',
  });

  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const completedGoals = shortGoals.filter(g => g.completed).length;
  const levelInfo = getLevelInfo(completedTasks);

  const nextMilestone = BADGE_MILESTONES.find(m => m.count > completedTasks);
  const prevMilestone = BADGE_MILESTONES.filter(m => m.count <= completedTasks).pop();
  const badgeProgress = nextMilestone
    ? ((completedTasks - (prevMilestone?.count ?? 0)) / (nextMilestone.count - (prevMilestone?.count ?? 0))) * 100
    : 100;

  const displayName = user?.username ?? user?.email?.split('@')[0] ?? 'Champion';
  const initials = displayName.slice(0, 2).toUpperCase();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await updateProfile(editForm);
      if (error) {
        showAlert('Error', error);
      } else {
        setEditModalVisible(false);
        showAlert('Success', 'Profile updated successfully');
      }
    } catch (error) {
      showAlert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const statsData = [
    { label: 'Tasks Done', value: completedTasks, color: Colors.success },
    { label: 'Total Tasks', value: totalTasks, color: colors.accent },
    { label: 'Badges', value: badges.length, color: Colors.warning },
    { label: 'Goals Set', value: shortGoals.length + longGoals.length, color: '#8B5CF6' },
    { label: 'Dreams', value: dreams.length, color: Colors.error },
    { label: 'Events', value: hackathons.length, color: Colors.warning },
  ];

  const settingsItems = [
    { label: 'Edit Profile', icon: Edit2, onPress: () => setEditModalVisible(true), color: colors.accent },
    { label: mode === 'dark' ? 'Light Mode' : 'Dark Mode', icon: mode === 'dark' ? Sun : Moon, onPress: toggleTheme, color: colors.accent },
    { label: 'Money Vault', icon: Wallet, onPress: () => router.push('/modules/money-vault'), color: '#F59E0B' },
    { label: 'Badge Collection', icon: Trophy, onPress: () => router.push('/modules/badges'), color: Colors.warning },
    { label: 'Analytics', icon: BarChart2, onPress: () => router.push('/modules/analytics'), color: colors.accent },
    { label: 'Notifications', icon: Bell, onPress: () => {}, color: '#8B5CF6' },
    { label: 'Sign Out', icon: LogOut, onPress: handleLogout, color: Colors.error },
  ];

  return (
    <View style={[styles.root, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.text === '#F1F5F9' ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 80 }]} showsVerticalScrollIndicator={false}>

        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Pressable
            style={[styles.menuBtn, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}
            onPress={openDrawer}
          >
            <Menu size={20} color={colors.textMuted} strokeWidth={2} />
          </Pressable>
          <View style={[styles.avatar, { backgroundColor: colors.accent + '20', borderColor: colors.accent + '40' }]}>
            <Text style={[styles.avatarInitials, { color: colors.accent }]}>{initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>{displayName}</Text>
            <Text style={[styles.profileEmail, { color: colors.textMuted }]}>{user?.email}</Text>
            <View style={[styles.levelBadge, { backgroundColor: levelInfo.color + '18', borderColor: levelInfo.color + '40' }]}>
              <Zap size={12} color={levelInfo.color} strokeWidth={2} />
              <Text style={[styles.levelText, { color: levelInfo.color }]}>{levelInfo.label}</Text>
            </View>
          </View>
        </View>

        {/* XP Progress */}
        {nextMilestone && (
          <GlassCard style={[styles.xpCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.xpHeader}>
              <Text style={[styles.xpLabel, { color: colors.textSecondary }]}>Next: {nextMilestone.name}</Text>
              <Text style={[styles.xpValue, { color: colors.accent }]}>{completedTasks}/{nextMilestone.count}</Text>
            </View>
            <ProgressBar progress={badgeProgress} color={colors.accent} height={6} backgroundColor={colors.surfaceLight} />
            <Text style={[styles.xpSub, { color: colors.textMuted }]}>{nextMilestone.count - completedTasks} tasks to unlock next badge</Text>
          </GlassCard>
        )}

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {statsData.map((s, i) => (
            <GlassCard key={i} style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]} padding={14}>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>{s.label}</Text>
            </GlassCard>
          ))}
        </View>

        {/* Progress Section */}
        <GlassCard style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Progress Overview</Text>
          <View style={styles.progressItem}>
            <Text style={[styles.progressItemLabel, { color: colors.textSecondary }]}>Task Completion</Text>
            <Text style={[styles.progressItemValue, { color: colors.accent }]}>{completionRate}%</Text>
          </View>
          <ProgressBar progress={completionRate} color={colors.accent} height={6} backgroundColor={colors.surfaceLight} />
          <View style={[styles.progressItem, { marginTop: Spacing.md }]}>
            <Text style={[styles.progressItemLabel, { color: colors.textSecondary }]}>Goals Completed</Text>
            <Text style={[styles.progressItemValue, { color: '#22C55E' }]}>{completedGoals}/{shortGoals.length}</Text>
          </View>
          <ProgressBar progress={shortGoals.length > 0 ? (completedGoals / shortGoals.length) * 100 : 0} color="#22C55E" height={6} backgroundColor={colors.surfaceLight} />
        </GlassCard>

        {/* Growth Modules */}
        <GlassCard style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Growth Modules</Text>
          <View style={styles.modulesGrid}>
            {MODULE_ROUTES.map(m => (
              <Pressable
                key={m.key}
                style={({ pressed }) => [styles.moduleTile, { backgroundColor: colors.surfaceLight, borderColor: colors.border }, pressed && { opacity: 0.7 }]}
                onPress={() => router.push(m.route as any)}
              >
                <View style={[styles.moduleIconBox, { backgroundColor: m.color + '18' }]}>
                  {(() => { const Icon = MODULE_ICON_MAP[m.key] ?? BookOpen; return <Icon size={18} color={m.color} strokeWidth={2} />; })()}
                </View>
                <Text style={[styles.moduleLabel, { color: colors.textSecondary }]} numberOfLines={1}>{m.title}</Text>
              </Pressable>
            ))}
          </View>
        </GlassCard>

        {/* Settings */}
        <GlassCard style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]} padding={0}>
          <Text style={[styles.sectionTitle, { color: colors.text, padding: Spacing.base, paddingBottom: Spacing.sm }]}>Settings</Text>
          {settingsItems.map((item, idx) => (
            <Pressable
              key={idx}
              style={({ pressed }) => [
                styles.settingsRow,
                { borderTopWidth: idx > 0 ? 1 : 0, borderTopColor: colors.border },
                pressed && { backgroundColor: colors.surfaceLight },
              ]}
              onPress={item.onPress}
            >
              <View style={[styles.settingsIconBox, { backgroundColor: item.color + '18' }]}>
                <item.icon size={16} color={item.color} strokeWidth={2} />
              </View>
              <Text style={[styles.settingsLabel, { color: item.color === Colors.error ? Colors.error : colors.text }]}>{item.label}</Text>
              <ChevronRight size={16} color={colors.textDim} strokeWidth={2} />
            </Pressable>
          ))}
        </GlassCard>

        <Text style={[styles.version, { color: colors.textDim }]}>Inflorescence v1.0 · Personal Growth OS</Text>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Profile</Text>
              <Pressable onPress={() => setEditModalVisible(false)}>
                <X size={24} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
              <AppInput
                label="Full Name"
                placeholder="Enter your full name"
                value={editForm.full_name}
                onChangeText={(text) => setEditForm({ ...editForm, full_name: text })}
              />

              <AppInput
                label="Username"
                placeholder="Enter username"
                value={editForm.username}
                onChangeText={(text) => setEditForm({ ...editForm, username: text })}
              />

              <AppInput
                label="Bio"
                placeholder="Tell us about yourself"
                value={editForm.bio}
                onChangeText={(text) => setEditForm({ ...editForm, bio: text })}
                multiline
              />

              <AppInput
                label="Phone"
                placeholder="+1 234 567 8900"
                value={editForm.phone}
                onChangeText={(text) => setEditForm({ ...editForm, phone: text })}
                keyboardType="phone-pad"
              />

              <AppInput
                label="Location"
                placeholder="City, Country"
                value={editForm.location}
                onChangeText={(text) => setEditForm({ ...editForm, location: text })}
              />

              <AppInput
                label="College/University"
                placeholder="Your institution"
                value={editForm.college}
                onChangeText={(text) => setEditForm({ ...editForm, college: text })}
              />

              <AppInput
                label="Department"
                placeholder="Your department"
                value={editForm.department}
                onChangeText={(text) => setEditForm({ ...editForm, department: text })}
              />

              <AppInput
                label="Year of Study"
                placeholder="e.g., 3rd Year"
                value={editForm.year_of_study}
                onChangeText={(text) => setEditForm({ ...editForm, year_of_study: text })}
              />

              <AppInput
                label="Skills"
                placeholder="e.g., React, Python, Design"
                value={editForm.skills}
                onChangeText={(text) => setEditForm({ ...editForm, skills: text })}
              />

              <AppInput
                label="Interests"
                placeholder="e.g., AI, Web Dev, Gaming"
                value={editForm.interests}
                onChangeText={(text) => setEditForm({ ...editForm, interests: text })}
              />

              <AppInput
                label="GitHub"
                placeholder="github.com/username"
                value={editForm.github}
                onChangeText={(text) => setEditForm({ ...editForm, github: text })}
              />

              <AppInput
                label="LinkedIn"
                placeholder="linkedin.com/in/username"
                value={editForm.linkedin}
                onChangeText={(text) => setEditForm({ ...editForm, linkedin: text })}
              />

              <AppInput
                label="Portfolio"
                placeholder="yourportfolio.com"
                value={editForm.portfolio}
                onChangeText={(text) => setEditForm({ ...editForm, portfolio: text })}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton, { borderColor: colors.border }]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </Pressable>
              <PrimaryButton
                title={saving ? 'Saving...' : 'Save'}
                onPress={handleSaveProfile}
                disabled={saving}
                style={styles.saveButton}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.base, paddingTop: Spacing.lg },

  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.base, marginBottom: Spacing.lg },
  menuBtn: { width: 40, height: 40, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  avatar: { width: 72, height: 72, borderRadius: 36, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { fontSize: Typography.sizes.xxl, fontWeight: Typography.weights.bold },
  profileInfo: { flex: 1, gap: 4 },
  profileName: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold },
  profileEmail: { fontSize: Typography.sizes.sm },
  levelBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full, borderWidth: 1 },
  levelText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.semibold },

  xpCard: { marginBottom: Spacing.base, gap: Spacing.sm },
  xpHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  xpLabel: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.medium },
  xpValue: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold },
  xpSub: { fontSize: Typography.sizes.xs },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.base },
  statCard: { width: '30.5%', alignItems: 'center', gap: 4 },
  statValue: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold },
  statLabel: { fontSize: Typography.sizes.xs, textAlign: 'center' },

  sectionCard: { marginBottom: Spacing.base, gap: Spacing.md },
  sectionTitle: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold },

  progressItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressItemLabel: { fontSize: Typography.sizes.sm },
  progressItemValue: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold },

  modulesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  moduleTile: { width: '30.5%', alignItems: 'center', padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1, gap: Spacing.xs },
  moduleIconBox: { width: 36, height: 36, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  moduleLabel: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.semibold, textAlign: 'center' },

  settingsRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.base, paddingVertical: 14 },
  settingsIconBox: { width: 34, height: 34, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  settingsLabel: { flex: 1, fontSize: Typography.sizes.base, fontWeight: Typography.weights.medium },

  version: { fontSize: Typography.sizes.xs, textAlign: 'center', marginBottom: Spacing.base },

  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    padding: Spacing.xl,
    paddingBottom: Spacing.xl + 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
  },
  modalScroll: {
    maxHeight: '70%',
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  modalButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelButton: {
    backgroundColor: 'transparent',
  },
  modalButtonText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
  },
  saveButton: {
    flex: 1,
  },
});
