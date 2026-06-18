import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Modal,
  KeyboardAvoidingView, Platform, StatusBar, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAlert } from '@/template';
import { useEvents } from '@/hooks/useEvents';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { AppInput } from '@/components/ui/AppInput';
import { Hackathon, Round } from '@/services/eventsService';

const ROUND_STATUSES = ['Pending', 'In Progress', 'Submitted', 'Cleared', 'Eliminated'];
const MODES = ['Online', 'Offline', 'Hybrid'];

export default function EventsScreen() {
  const insets = useSafeAreaInsets();
  const { hackathons, loading, addHackathon, deleteHackathon, addRound, updateRound, deleteRound } = useEvents();
  const { showAlert } = useAlert();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [hackModal, setHackModal] = useState(false);
  const [roundModal, setRoundModal] = useState(false);
  const [activeHackathonId, setActiveHackathonId] = useState('');
  const [saving, setSaving] = useState(false);

  // Hackathon form
  const [hName, setHName] = useState('');
  const [hTheme, setHTheme] = useState('');
  const [hOrganizer, setHOrganizer] = useState('');
  const [hRegLink, setHRegLink] = useState('');
  const [hStart, setHStart] = useState('');
  const [hEnd, setHEnd] = useState('');
  const [hProblem, setHProblem] = useState('');

  // Round form
  const [rName, setRName] = useState('');
  const [rDeadline, setRDeadline] = useState('');
  const [rReqs, setRReqs] = useState('');
  const [rMode, setRMode] = useState('Online');
  const [rLocation, setRLocation] = useState('');
  const [rNumber, setRNumber] = useState('1');

  const resetHackForm = () => { setHName(''); setHTheme(''); setHOrganizer(''); setHRegLink(''); setHStart(''); setHEnd(''); setHProblem(''); };
  const resetRoundForm = () => { setRName(''); setRDeadline(''); setRReqs(''); setRMode('Online'); setRLocation(''); setRNumber('1'); };

  const handleAddHackathon = async () => {
    if (!hName.trim()) { showAlert('Required', 'Enter event name.'); return; }
    setSaving(true);
    await addHackathon({
      name: hName.trim(), theme: hTheme.trim() || undefined,
      problem_statement: hProblem.trim() || undefined,
      organizer: hOrganizer.trim() || undefined,
      registration_link: hRegLink.trim() || undefined,
      start_date: hStart.trim() || undefined,
      end_date: hEnd.trim() || undefined,
    });
    setSaving(false);
    setHackModal(false);
    resetHackForm();
  };

  const handleAddRound = async () => {
    if (!rName.trim()) { showAlert('Required', 'Enter round name.'); return; }
    setSaving(true);
    await addRound({
      hackathon_id: activeHackathonId,
      name: rName.trim(),
      deadline: rDeadline.trim() || undefined,
      requirements: rReqs.trim() || undefined,
      mode: rMode,
      location: rLocation.trim() || undefined,
      status: 'Pending',
      round_number: parseInt(rNumber) || 1,
    });
    setSaving(false);
    setRoundModal(false);
    resetRoundForm();
  };

  const getStatusColor = (status: string) => {
    if (status === 'Cleared') return Colors.success;
    if (status === 'Eliminated') return Colors.error;
    if (status === 'In Progress') return Colors.warning;
    if (status === 'Submitted') return Colors.accent;
    return Colors.textMuted;
  };

  const isUpcoming = (h: Hackathon) => h.end_date ? new Date(h.end_date) >= new Date() : true;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <View>
          <Text style={styles.screenTitle}>Hackathons & Events</Text>
          <Text style={styles.screenSub}>{hackathons.length} events tracked</Text>
        </View>
        <Pressable style={styles.addBtn} onPress={() => setHackModal(true)}>
          <MaterialIcons name="add" size={26} color="#fff" />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.accent} size="large" /></View>
      ) : hackathons.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🚀</Text>
          <Text style={styles.emptyTitle}>Track Your Hackathons</Text>
          <Text style={styles.emptySubtitle}>Add events with rounds, deadlines and reminders</Text>
          <PrimaryButton title="Add Event" onPress={() => setHackModal(true)} style={{ marginTop: Spacing.lg }} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]} showsVerticalScrollIndicator={false}>
          {hackathons.map(h => {
            const isExp = expandedId === h.id;
            const upcoming = isUpcoming(h);
            return (
              <GlassCard key={h.id} style={[styles.hackCard, !upcoming && styles.pastCard]}>
                <Pressable style={styles.hackHeader} onPress={() => setExpandedId(isExp ? null : h.id)}>
                  <View style={styles.hackTitleRow}>
                    <View style={[styles.statusDot, { backgroundColor: upcoming ? Colors.success : Colors.textDim }]} />
                    <Text style={styles.hackName} numberOfLines={1}>{h.name}</Text>
                  </View>
                  <View style={styles.hackMeta}>
                    {h.organizer ? <Text style={styles.metaText}>🏢 {h.organizer}</Text> : null}
                    {h.end_date ? (
                      <Text style={[styles.metaText, !upcoming && styles.pastText]}>
                        📅 {new Date(h.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </Text>
                    ) : null}
                    {h.rounds && h.rounds.length > 0 ? (
                      <View style={styles.roundsBadge}>
                        <Text style={styles.roundsBadgeText}>{h.rounds.length} rounds</Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.hackActions}>
                    <Pressable hitSlop={8} onPress={() => showAlert('Delete Event', `Delete "${h.name}"?`, [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', style: 'destructive', onPress: () => deleteHackathon(h.id) },
                    ])}>
                      <MaterialIcons name="delete-outline" size={18} color={Colors.textDim} />
                    </Pressable>
                    <MaterialIcons name={isExp ? 'expand-less' : 'expand-more'} size={22} color={Colors.textMuted} />
                  </View>
                </Pressable>

                {isExp ? (
                  <View style={styles.expandedSection}>
                    {h.theme ? <Text style={styles.detailRow}><Text style={styles.detailLabel}>Theme: </Text>{h.theme}</Text> : null}
                    {h.problem_statement ? <Text style={styles.detailRow}><Text style={styles.detailLabel}>Problem: </Text>{h.problem_statement}</Text> : null}
                    {h.registration_link ? <Text style={styles.detailRow}><Text style={styles.detailLabel}>Register: </Text><Text style={styles.linkText}>{h.registration_link}</Text></Text> : null}
                    {h.start_date ? <Text style={styles.detailRow}><Text style={styles.detailLabel}>Start: </Text>{h.start_date}</Text> : null}

                    {/* Rounds */}
                    <View style={styles.roundsSection}>
                      <Text style={styles.roundsTitle}>Rounds</Text>
                      {(h.rounds ?? []).length === 0 ? (
                        <Text style={styles.noRoundsText}>No rounds added yet</Text>
                      ) : (
                        (h.rounds ?? []).map(r => (
                          <View key={r.id} style={styles.roundCard}>
                            <View style={styles.roundHeader}>
                              <View style={[styles.roundNumber, { backgroundColor: Colors.surfaceLighter }]}>
                                <Text style={styles.roundNumberText}>R{r.round_number}</Text>
                              </View>
                              <View style={styles.roundInfo}>
                                <Text style={styles.roundName}>{r.name}</Text>
                                {r.deadline ? <Text style={styles.roundDeadline}>Due: {new Date(r.deadline).toLocaleDateString()}</Text> : null}
                                {r.requirements ? <Text style={styles.roundReqs} numberOfLines={2}>{r.requirements}</Text> : null}
                                <Text style={styles.roundMode}>{r.mode}{r.location ? ` · ${r.location}` : ''}</Text>
                              </View>
                              <View style={styles.roundStatusSection}>
                                <View style={[styles.statusBadge, { borderColor: getStatusColor(r.status) }]}>
                                  <Text style={[styles.statusText, { color: getStatusColor(r.status) }]}>{r.status}</Text>
                                </View>
                                <Pressable hitSlop={8} onPress={() => deleteRound(r.id, h.id)}>
                                  <MaterialIcons name="delete-outline" size={16} color={Colors.textDim} />
                                </Pressable>
                              </View>
                            </View>
                            {/* Status selector */}
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusRow}>
                              {ROUND_STATUSES.map(s => (
                                <Pressable
                                  key={s}
                                  style={[styles.statusChip, r.status === s && { borderColor: getStatusColor(s), backgroundColor: `${getStatusColor(s)}18` }]}
                                  onPress={() => updateRound(r.id, { status: s })}
                                >
                                  <Text style={[styles.statusChipText, r.status === s && { color: getStatusColor(s) }]}>{s}</Text>
                                </Pressable>
                              ))}
                            </ScrollView>
                          </View>
                        ))
                      )}
                      <Pressable
                        style={styles.addRoundBtn}
                        onPress={() => {
                          setActiveHackathonId(h.id);
                          setRNumber(String((h.rounds?.length ?? 0) + 1));
                          setRoundModal(true);
                        }}
                      >
                        <MaterialIcons name="add-circle-outline" size={18} color={Colors.accent} />
                        <Text style={styles.addRoundText}>Add Round</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : null}
              </GlassCard>
            );
          })}
        </ScrollView>
      )}

      {/* Hackathon Modal */}
      <Modal visible={hackModal} transparent animationType="slide" onRequestClose={() => setHackModal(false)}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setHackModal(false)} />
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>New Event / Hackathon</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <AppInput label="Event Name *" placeholder="e.g. Smart India Hackathon 2025" value={hName} onChangeText={setHName} />
              <AppInput label="Theme" placeholder="AI / Web3 / Healthcare..." value={hTheme} onChangeText={setHTheme} />
              <AppInput label="Problem Statement" placeholder="Brief description..." value={hProblem} onChangeText={setHProblem} multiline numberOfLines={2} />
              <AppInput label="Organizer" placeholder="Company / College name" value={hOrganizer} onChangeText={setHOrganizer} />
              <AppInput label="Registration Link" placeholder="https://..." value={hRegLink} onChangeText={setHRegLink} keyboardType="url" autoCapitalize="none" />
              <AppInput label="Start Date (YYYY-MM-DD)" placeholder="2025-11-01" value={hStart} onChangeText={setHStart} />
              <AppInput label="End Date (YYYY-MM-DD)" placeholder="2025-11-30" value={hEnd} onChangeText={setHEnd} />
              <PrimaryButton title="Create Event" onPress={handleAddHackathon} loading={saving} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Round Modal */}
      <Modal visible={roundModal} transparent animationType="slide" onRequestClose={() => setRoundModal(false)}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setRoundModal(false)} />
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Add Round</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <AppInput label="Round Name *" placeholder="e.g. Idea Submission, Prototype" value={rName} onChangeText={setRName} />
              <AppInput label="Round Number" placeholder="1" value={rNumber} onChangeText={setRNumber} keyboardType="numeric" />
              <AppInput label="Deadline (YYYY-MM-DD HH:MM)" placeholder="2025-11-15" value={rDeadline} onChangeText={setRDeadline} />
              <AppInput label="Requirements" placeholder="What to submit..." value={rReqs} onChangeText={setRReqs} multiline numberOfLines={2} />
              <Text style={styles.fieldLabel}>Mode</Text>
              <View style={styles.modeRow}>
                {MODES.map(m => (
                  <Pressable key={m} style={[styles.modeChip, rMode === m && styles.modeChipActive]} onPress={() => setRMode(m)}>
                    <Text style={[styles.modeChipText, rMode === m && styles.modeChipActiveText]}>{m}</Text>
                  </Pressable>
                ))}
              </View>
              {rMode !== 'Online' ? (
                <AppInput label="Location" placeholder="City / Venue" value={rLocation} onChangeText={setRLocation} />
              ) : null}
              <PrimaryButton title="Add Round" onPress={handleAddRound} loading={saving} style={{ marginTop: Spacing.sm }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md },
  screenTitle: { color: Colors.text, fontFamily: 'Arial', fontSize: Typography.sizes.xxl, fontWeight: '700' },
  screenSub: { color: Colors.textMuted, fontFamily: 'Arial', fontSize: Typography.sizes.sm, marginTop: 2 },
  addBtn: { width: 46, height: 46, borderRadius: 23, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xxl },
  emptyEmoji: { fontSize: 64, marginBottom: Spacing.base },
  emptyTitle: { color: Colors.text, fontFamily: 'Arial', fontSize: Typography.sizes.xl, fontWeight: '700', textAlign: 'center', marginBottom: Spacing.sm },
  emptySubtitle: { color: Colors.textMuted, fontFamily: 'Arial', fontSize: Typography.sizes.base, textAlign: 'center' },
  list: { paddingHorizontal: Spacing.base, paddingTop: Spacing.sm },
  hackCard: { marginBottom: Spacing.md, padding: 0, overflow: 'hidden' },
  pastCard: { opacity: 0.7 },
  hackHeader: { padding: Spacing.base },
  hackTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  hackName: { flex: 1, color: Colors.text, fontFamily: 'Arial', fontSize: Typography.sizes.lg, fontWeight: '700' },
  hackMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, alignItems: 'center', marginBottom: Spacing.sm },
  metaText: { color: Colors.textMuted, fontFamily: 'Arial', fontSize: Typography.sizes.sm },
  pastText: { color: Colors.textDim },
  roundsBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full, backgroundColor: 'rgba(41,182,246,0.12)', borderWidth: 1, borderColor: Colors.border },
  roundsBadgeText: { color: Colors.accent, fontFamily: 'Arial', fontSize: Typography.sizes.xs, fontWeight: '600' },
  hackActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: Spacing.md },
  expandedSection: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.base, gap: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  detailRow: { color: Colors.textSecondary, fontFamily: 'Arial', fontSize: Typography.sizes.sm, lineHeight: 20 },
  detailLabel: { fontWeight: '600', color: Colors.textMuted },
  linkText: { color: Colors.accent },
  roundsSection: { marginTop: Spacing.sm },
  roundsTitle: { color: Colors.text, fontFamily: 'Arial', fontSize: Typography.sizes.base, fontWeight: '700', marginBottom: Spacing.sm },
  noRoundsText: { color: Colors.textMuted, fontFamily: 'Arial', fontSize: Typography.sizes.sm },
  roundCard: { backgroundColor: Colors.surfaceLight, borderRadius: Radius.md, marginBottom: Spacing.sm, padding: Spacing.md },
  roundHeader: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  roundNumber: { width: 32, height: 32, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  roundNumberText: { color: Colors.accent, fontFamily: 'Arial', fontSize: Typography.sizes.sm, fontWeight: '700' },
  roundInfo: { flex: 1, gap: 2 },
  roundName: { color: Colors.text, fontFamily: 'Arial', fontSize: Typography.sizes.base, fontWeight: '600' },
  roundDeadline: { color: Colors.warning, fontFamily: 'Arial', fontSize: Typography.sizes.xs },
  roundReqs: { color: Colors.textMuted, fontFamily: 'Arial', fontSize: Typography.sizes.xs },
  roundMode: { color: Colors.textMuted, fontFamily: 'Arial', fontSize: Typography.sizes.xs },
  roundStatusSection: { alignItems: 'flex-end', gap: Spacing.xs },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.full, borderWidth: 1 },
  statusText: { fontFamily: 'Arial', fontSize: Typography.sizes.xs, fontWeight: '600' },
  statusRow: { marginTop: Spacing.xs },
  statusChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surfaceLighter, marginRight: Spacing.xs },
  statusChipText: { color: Colors.textMuted, fontFamily: 'Arial', fontSize: Typography.sizes.xs, fontWeight: '600' },
  addRoundBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingVertical: Spacing.sm, marginTop: Spacing.xs },
  addRoundText: { color: Colors.accent, fontFamily: 'Arial', fontSize: Typography.sizes.sm, fontWeight: '600' },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.65)' },
  sheet: { backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, borderWidth: 1, borderColor: Colors.border, padding: Spacing.xl, maxHeight: '90%' },
  handle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.lg },
  sheetTitle: { color: Colors.text, fontFamily: 'Arial', fontSize: Typography.sizes.xl, fontWeight: '700', marginBottom: Spacing.lg },
  fieldLabel: { color: Colors.textSecondary, fontFamily: 'Arial', fontSize: Typography.sizes.sm, fontWeight: '600', marginBottom: Spacing.sm },
  modeRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.base },
  modeChip: { flex: 1, paddingVertical: Spacing.sm, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', backgroundColor: Colors.surfaceLight },
  modeChipActive: { borderColor: Colors.accent, backgroundColor: 'rgba(41,182,246,0.12)' },
  modeChipText: { color: Colors.textMuted, fontFamily: 'Arial', fontSize: Typography.sizes.sm, fontWeight: '600' },
  modeChipActiveText: { color: Colors.accent },
});
