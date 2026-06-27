import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Switch, Alert, Platform, Linking, ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  Bell, Shield, Volume2, Clock, Check, Send, AlertTriangle, ChevronRight, Settings, ArrowLeft
} from 'lucide-react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useNotifications } from '@/hooks/useNotifications';
import { Typography, Spacing, Radius } from '@/constants/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { ScreenHeader } from '@/components/ui/ScreenHeader';

const STORAGE_KEY = '@inflorescence_notification_settings';

export default function NotificationSettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useAppTheme();
  const { addNotification } = useNotifications();

  const [loading, setLoading] = useState(true);

  // Switch states
  const [taskReminders, setTaskReminders] = useState(true);
  const [goalReminders, setGoalReminders] = useState(true);
  const [habitReminders, setHabitReminders] = useState(true);
  const [studyReminders, setStudyReminders] = useState(true);
  const [eventReminders, setEventReminders] = useState(true);
  const [examReminders, setExamReminders] = useState(true);
  const [bookReminders, setBookReminders] = useState(true);
  const [notesReminders, setNotesReminders] = useState(true);
  const [customReminders, setCustomReminders] = useState(true);

  const [dailySummary, setDailySummary] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(true);
  const [monthlySummary, setMonthlySummary] = useState(false);
  const [productivitySummary, setProductivitySummary] = useState(true);

  // Times
  const [morningTime, setMorningTime] = useState('08:00');
  const [afternoonTime, setAfternoonTime] = useState('13:00');
  const [eveningTime, setEveningTime] = useState('18:00');
  const [customTime, setCustomTime] = useState('20:00');

  // Time Picker show controls
  const [showMorningPicker, setShowMorningPicker] = useState(false);
  const [showAfternoonPicker, setShowAfternoonPicker] = useState(false);
  const [showEveningPicker, setShowEveningPicker] = useState(false);
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  // Quiet Hours
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietStart, setQuietStart] = useState('22:00');
  const [quietEnd, setQuietEnd] = useState('07:00');
  const [showQuietStartPicker, setShowQuietStartPicker] = useState(false);
  const [showQuietEndPicker, setShowQuietEndPicker] = useState(false);

  // Sound & Vibration
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [badgeCountEnabled, setBadgeCountEnabled] = useState(true);
  const [popupAlertsEnabled, setPopupAlertsEnabled] = useState(true);

  // Permission status
  const [permissionGranted, setPermissionGranted] = useState(true);

  // Detect Expo Go
  const isExpoGo = Constants?.appOwnership === 'expo' || __DEV__;

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.taskReminders !== undefined) setTaskReminders(parsed.taskReminders);
        if (parsed.goalReminders !== undefined) setGoalReminders(parsed.goalReminders);
        if (parsed.habitReminders !== undefined) setHabitReminders(parsed.habitReminders);
        if (parsed.studyReminders !== undefined) setStudyReminders(parsed.studyReminders);
        if (parsed.eventReminders !== undefined) setEventReminders(parsed.eventReminders);
        if (parsed.examReminders !== undefined) setExamReminders(parsed.examReminders);
        if (parsed.bookReminders !== undefined) setBookReminders(parsed.bookReminders);
        if (parsed.notesReminders !== undefined) setNotesReminders(parsed.notesReminders);
        if (parsed.customReminders !== undefined) setCustomReminders(parsed.customReminders);

        if (parsed.dailySummary !== undefined) setDailySummary(parsed.dailySummary);
        if (parsed.weeklySummary !== undefined) setWeeklySummary(parsed.weeklySummary);
        if (parsed.monthlySummary !== undefined) setMonthlySummary(parsed.monthlySummary);
        if (parsed.productivitySummary !== undefined) setProductivitySummary(parsed.productivitySummary);

        if (parsed.morningTime !== undefined) setMorningTime(parsed.morningTime);
        if (parsed.afternoonTime !== undefined) setAfternoonTime(parsed.afternoonTime);
        if (parsed.eveningTime !== undefined) setEveningTime(parsed.eveningTime);
        if (parsed.customTime !== undefined) setCustomTime(parsed.customTime);

        if (parsed.quietHoursEnabled !== undefined) setQuietHoursEnabled(parsed.quietHoursEnabled);
        if (parsed.quietStart !== undefined) setQuietStart(parsed.quietStart);
        if (parsed.quietEnd !== undefined) setQuietEnd(parsed.quietEnd);

        if (parsed.soundEnabled !== undefined) setSoundEnabled(parsed.soundEnabled);
        if (parsed.vibrationEnabled !== undefined) setVibrationEnabled(parsed.vibrationEnabled);
        if (parsed.badgeCountEnabled !== undefined) setBadgeCountEnabled(parsed.badgeCountEnabled);
        if (parsed.popupAlertsEnabled !== undefined) setPopupAlertsEnabled(parsed.popupAlertsEnabled);
      }
    } catch (e) {
      console.warn('[NotificationSettings] Failed to load settings:', e);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      const state = {
        taskReminders, goalReminders, habitReminders, studyReminders, eventReminders,
        examReminders, bookReminders, notesReminders, customReminders,
        dailySummary, weeklySummary, monthlySummary, productivitySummary,
        morningTime, afternoonTime, eveningTime, customTime,
        quietHoursEnabled, quietStart, quietEnd,
        soundEnabled, vibrationEnabled, badgeCountEnabled, popupAlertsEnabled
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      Alert.alert('Settings Saved', 'Your preferences have been persisted.');
    } catch (e) {
      Alert.alert('Save Failed', 'Could not save notification preferences.');
    }
  };

  const handleSendTestNotification = async () => {
    if (isExpoGo) {
      Alert.alert(
        'Expo Go Notice',
        'Push notifications are simulated. Development Builds or standalone APKs are required for native device channels.',
        [{ text: 'Dismiss' }]
      );
    }
    await addNotification(
      'Test Push Notification',
      'This is a visual test verification from Inflorescence settings!'
    );
  };

  const handleOpenDeviceSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  const formatPickerTime = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000B29', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: '#000B29', paddingTop: insets.top }]}>
      <ScreenHeader title="Notification Settings" showBack={true} />
      
      <ScrollView contentContainerStyle={{ padding: Spacing.base, paddingBottom: insets.bottom + 40, gap: 16 }} showsVerticalScrollIndicator={false}>
        
        {/* Permission Info Card */}
        <GlassCard style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <Shield size={24} color="#10B981" />
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Permissions Granted</Text>
              <Text style={styles.cardSubtitle}>App notification channels are active</Text>
            </View>
            <Pressable style={styles.actionBtn} onPress={handleOpenDeviceSettings}>
              <Text style={styles.actionBtnText}>Configure</Text>
            </Pressable>
          </View>
        </GlassCard>

        {/* Expo Go Alert Box */}
        {isExpoGo && (
          <GlassCard style={{ borderColor: 'rgba(239,68,68,0.2)', backgroundColor: 'rgba(239,68,68,0.05)' }}>
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
              <AlertTriangle size={18} color="#EF4444" style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#EF4444', fontWeight: '700', fontSize: 13 }}>Expo Go Environment Alert</Text>
                <Text style={{ color: '#94A3B8', fontSize: 11, marginTop: 4, lineHeight: 16 }}>
                  Push notification registrations will fall back gracefully in Expo Go. Standalone or Dev Client builds are required for production channels.
                </Text>
              </View>
            </View>
          </GlassCard>
        )}

        {/* Reminder Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Reminder Configurations</Text>
          <GlassCard style={styles.cardBody}>
            {[
              { label: 'Task Reminders', val: taskReminders, set: setTaskReminders },
              { label: 'Goal Reminders', val: goalReminders, set: setGoalReminders },
              { label: 'Habit Reminders', val: habitReminders, set: setHabitReminders },
              { label: 'Study Reminders', val: studyReminders, set: setStudyReminders },
              { label: 'Event Reminders', val: eventReminders, set: setEventReminders },
              { label: 'Exam Reminders', val: examReminders, set: setExamReminders },
              { label: 'Book Reminders', val: bookReminders, set: setBookReminders },
              { label: 'Notes Reminders', val: notesReminders, set: setNotesReminders },
              { label: 'Custom Section Reminders', val: customReminders, set: setCustomReminders },
            ].map((item, idx) => (
              <View key={idx} style={[styles.toggleRow, idx > 0 && styles.rowBorder]}>
                <Text style={styles.rowLabel}>{item.label}</Text>
                <Switch
                  value={item.val}
                  onValueChange={item.set}
                  trackColor={{ false: 'rgba(255,255,255,0.08)', true: '#3B82F6' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            ))}
          </GlassCard>
        </View>

        {/* Summaries */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Summaries & Updates</Text>
          <GlassCard style={styles.cardBody}>
            {[
              { label: 'Daily summary digest', val: dailySummary, set: setDailySummary },
              { label: 'Weekly productivity digest', val: weeklySummary, set: setWeeklySummary },
              { label: 'Monthly insight reports', val: monthlySummary, set: setMonthlySummary },
              { label: 'Realtime productivity suggestions', val: productivitySummary, set: setProductivitySummary },
            ].map((item, idx) => (
              <View key={idx} style={[styles.toggleRow, idx > 0 && styles.rowBorder]}>
                <Text style={styles.rowLabel}>{item.label}</Text>
                <Switch
                  value={item.val}
                  onValueChange={item.set}
                  trackColor={{ false: 'rgba(255,255,255,0.08)', true: '#3B82F6' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            ))}
          </GlassCard>
        </View>

        {/* Time configuration */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Schedule & Timings</Text>
          <GlassCard style={styles.cardBody}>
            {[
              { label: 'Morning Digest Time', val: morningTime, show: showMorningPicker, setShow: setShowMorningPicker, setVal: setMorningTime },
              { label: 'Afternoon Digest Time', val: afternoonTime, show: showAfternoonPicker, setShow: setShowAfternoonPicker, setVal: setAfternoonTime },
              { label: 'Evening Digest Time', val: eveningTime, show: showEveningPicker, setShow: setShowEveningPicker, setVal: setEveningTime },
              { label: 'Custom Digest Time', val: customTime, show: showCustomPicker, setShow: setShowCustomPicker, setVal: setCustomTime },
            ].map((item, idx) => (
              <View key={idx} style={[styles.toggleRow, idx > 0 && styles.rowBorder]}>
                <Text style={styles.rowLabel}>{item.label}</Text>
                <Pressable style={styles.timeValueBtn} onPress={() => item.setShow(true)}>
                  <Text style={styles.timeValueText}>{item.val}</Text>
                </Pressable>
                {item.show && (
                  <DateTimePicker
                    value={new Date(`2026-01-01T${item.val}:00`)}
                    mode="time"
                    display="default"
                    is24Hour={true}
                    themeVariant="dark"
                    onChange={(event, date) => {
                      item.setShow(false);
                      if (date) item.setVal(formatPickerTime(date));
                    }}
                  />
                )}
              </View>
            ))}
          </GlassCard>
        </View>

        {/* Quiet hours */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Quiet Hours Block</Text>
          <GlassCard style={styles.cardBody}>
            <View style={styles.toggleRow}>
              <Text style={styles.rowLabel}>Enable Quiet Hours</Text>
              <Switch
                value={quietHoursEnabled}
                onValueChange={setQuietHoursEnabled}
                trackColor={{ false: 'rgba(255,255,255,0.08)', true: '#3B82F6' }}
                thumbColor="#FFFFFF"
              />
            </View>
            {quietHoursEnabled && (
              <>
                <View style={[styles.toggleRow, styles.rowBorder]}>
                  <Text style={styles.rowLabel}>Silence Starts At</Text>
                  <Pressable style={styles.timeValueBtn} onPress={() => setShowQuietStartPicker(true)}>
                    <Text style={styles.timeValueText}>{quietStart}</Text>
                  </Pressable>
                  {showQuietStartPicker && (
                    <DateTimePicker
                      value={new Date(`2026-01-01T${quietStart}:00`)}
                      mode="time"
                      display="default"
                      is24Hour={true}
                      themeVariant="dark"
                      onChange={(event, date) => {
                        setShowQuietStartPicker(false);
                        if (date) setQuietStart(formatPickerTime(date));
                      }}
                    />
                  )}
                </View>
                <View style={[styles.toggleRow, styles.rowBorder]}>
                  <Text style={styles.rowLabel}>Silence Ends At</Text>
                  <Pressable style={styles.timeValueBtn} onPress={() => setShowQuietEndPicker(true)}>
                    <Text style={styles.timeValueText}>{quietEnd}</Text>
                  </Pressable>
                  {showQuietEndPicker && (
                    <DateTimePicker
                      value={new Date(`2026-01-01T${quietEnd}:00`)}
                      mode="time"
                      display="default"
                      is24Hour={true}
                      themeVariant="dark"
                      onChange={(event, date) => {
                        setShowQuietEndPicker(false);
                        if (date) setQuietEnd(formatPickerTime(date));
                      }}
                    />
                  )}
                </View>
              </>
            )}
          </GlassCard>
        </View>

        {/* Sound & Vibration */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Alert Types & Channels</Text>
          <GlassCard style={styles.cardBody}>
            {[
              { label: 'Notification Sounds', val: soundEnabled, set: setSoundEnabled },
              { label: 'Vibration Mode', val: vibrationEnabled, set: setVibrationEnabled },
              { label: 'Icon badge unread counters', val: badgeCountEnabled, set: setBadgeCountEnabled },
              { label: 'Floating popup banners', val: popupAlertsEnabled, set: setPopupAlertsEnabled },
            ].map((item, idx) => (
              <View key={idx} style={[styles.toggleRow, idx > 0 && styles.rowBorder]}>
                <Text style={styles.rowLabel}>{item.label}</Text>
                <Switch
                  value={item.val}
                  onValueChange={item.set}
                  trackColor={{ false: 'rgba(255,255,255,0.08)', true: '#3B82F6' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            ))}
          </GlassCard>
        </View>

        {/* Save & Test Buttons */}
        <View style={{ gap: 12, marginTop: 12 }}>
          <Pressable
            style={({ pressed }) => [styles.submitBtn, { backgroundColor: '#3B82F6' }, pressed && { opacity: 0.8 }]}
            onPress={saveSettings}
          >
            <Check size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.submitBtnText}>Save Preferences</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.submitBtn, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1 }, pressed && { opacity: 0.8 }]}
            onPress={handleSendTestNotification}
          >
            <Send size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.submitBtnText}>Send Test Notification</Text>
          </Pressable>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  cardSubtitle: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: '#3B82F6' },
  actionBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  section: { gap: 10 },
  sectionHeader: { fontSize: 13, fontWeight: '700', color: '#60A5FA', textTransform: 'uppercase', paddingLeft: 4 },
  cardBody: { backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)', padding: 0 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: 14 },
  rowBorder: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)' },
  rowLabel: { fontSize: 14, color: '#FFFFFF', fontWeight: '500' },
  timeValueBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.sm, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  timeValueText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  submitBtn: { height: 48, borderRadius: Radius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  submitBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' }
});
