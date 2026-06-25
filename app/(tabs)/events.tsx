import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Modal,
  KeyboardAvoidingView, Platform, StatusBar, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Plus, Trash2, ChevronDown, ChevronUp, Trophy, Calendar,
  Clock, MapPin, ExternalLink, Circle, X, Edit2, TrendingUp,
} from 'lucide-react-native';
import { useAlert } from '@/template';
import { useEvents } from '@/hooks/useEvents';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { AppInput } from '@/components/ui/AppInput';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Hackathon } from '@/services/eventsService';

const ROUND_STATUSES = ['Pending', 'In Progress', 'Submitted', 'Cleared', 'Eliminated'];
const MODES = ['Online', 'Offline', 'Hybrid'];

const STATUS_COLORS: Record<string, string> = {
  Cleared: Colors.success,
  Eliminated: Colors.error,
  'In Progress': Colors.warning,
  Submitted: Colors.accent,
  Pending: Colors.textMuted,
};

export default function EventsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { hackathons, loading, addHackathon, updateHackathon, deleteHackathon, addRound, updateRound, deleteRound } = useEvents();
  const { showAlert } = useAlert();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [hackModal, setHackModal] = useState(false);
  const [roundModal, setRoundModal] = useState(false);
  const [activeHackathonId, setActiveHackathonId] = useState('');
  const [saving, setSaving] = useState(false);
  const [editHackId, setEditHackId] = useState<string | null>(null);

  const [hName, setHName] = useState('');
  const [hTheme, setHTheme] = useState('');
  const [hOrganizer, setHOrganizer] = useState('');
  const [hRegLink, setHRegLink] = useState('');
  const [hStart, setHStart] = useState('');
  const [hEnd, setHEnd] = useState('');
  const [hProblem, setHProblem] = useState('');

  const [rName, setRName] = useState('');
  const [rDeadline, setRDeadline] = useState('');
  const [rReqs, setRReqs] = useState('');
  const [rMode, setRMode] = useState('Online');
  const [rLocation, setRLocation] = useState('');
  const [rNumber, setRNumber] = useState('1');

  const resetHackForm = () => { setEditHackId(null); setHName(''); setHTheme(''); setHOrganizer(''); setHRegLink(''); setHStart(''); setHEnd(''); setHProblem(''); };
  const resetRoundForm = () => { setRName(''); setRDeadline(''); setRReqs(''); setRMode('Online'); setRLocation(''); setRNumber('1'); };

  const openEditHackathon = (h: Hackathon) => {
    setEditHackId(h.id);
    setHName(h.name); setHTheme(h.theme ?? ''); setHOrganizer(h.organizer ?? '');
    setHRegLink(h.registration_link ?? ''); setHStart(h.start_date ?? ''); setHEnd(h.end_date ?? '');
    setHProblem(h.problem_statement ?? '');
    setHackModal(true);
  };

  const handleAddHackathon = async () => {
    if (!hName.trim()) { showAlert('Required', 'Enter event name.'); return; }
    setSaving(true);
    const payload = { name: hName.trim(), theme: hTheme.trim() || undefined, problem_statement: hProblem.trim() || undefined, organizer: hOrganizer.trim() || undefined, registration_link: hRegLink.trim() || undefined, start_date: hStart.trim() || undefined, end_date: hEnd.trim() || undefined };
    if (editHackId) {
      await updateHackathon(editHackId, payload);
    } else {
      await addHackathon(payload);
    }
    setSaving(false); setHackModal(false); resetHackForm();
  };

  const handleAddRound = async () => {
    if (!rName.trim()) { showAlert('Required', 'Enter round name.'); return; }
    setSaving(true);
    await addRound({ hackathon_id: activeHackathonId, name: rName.trim(), deadline: rDeadline.trim() || undefined, requirements: rReqs.trim() || undefined, mode: rMode, location: rLocation.trim() || undefined, status: 'Pending', round_number: parseInt(rNumber) || 1 });
    setSaving(false); setRoundModal(false); resetRoundForm();
  };

  const today = new Date();
  const isUpcoming = (h: Hackathon) => h.end_date ? new Date(h.end_date) >= today : true;

  return (
    <View style={[styles.root, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.text === '#F1F5F9' ? 'light-content' : 'dark-content'} />

      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Events</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>{hackathons.length} tracked</Text>
        </View>
        <Pressable style={[styles.addBtn, { backgroundColor: colors.accent }]} onPress={() => setHackModal(true)}>
          <Plus size={22} color="#fff" strokeWidth={2.5} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.accent} size="large" /></View>
      ) : hackathons.length === 0 ? (
        <View style={styles.empty}>
          <Trophy size={52} color={colors.textDim} strokeWidth={1.5} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Track Your Hackathons</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>Add events with rounds, deadlines and reminders</Text>
          <PrimaryButton title="Add Event" onPress={() => setHackModal(true)} style={{ marginTop: Spacing.lg }} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]} showsVerticalScrollIndicator={false}>
          {hackathons.map(h => {
            const isExp = expandedId === h.id;
            const upcoming = isUpcoming(h);
            return (
              <GlassCard key={h.id} style={[styles.hackCard, { backgroundColor: colors.surface, borderColor: colors.border }, !upcoming && { opacity: 0.65 }]} padding={0}>
                <Pressable style={styles.hackHeader} onPress={() => setExpandedId(isExp ? null : h.id)}>
                  <View style={[styles.statusIndicator, { backgroundColor: upcoming ? Colors.success : colors.textDim }]} />
                  <View style={styles.hackInfo}>
                    <Text style={[styles.hackName, { color: colors.text }]} numberOfLines={1}>{h.name}</Text>
                    <View style={styles.hackMeta}>
                      {h.organizer && (
                        <View style={styles.metaItem}>
                          <Circle size={10} color={colors.textMuted} strokeWidth={2} />
                          <Text style={[styles.metaText, { color: colors.textMuted }]}>{h.organizer}</Text>
                        </View>
                      )}
                      {h.end_date && (
                        <View style={styles.metaItem}>
                          <Calendar size={10} color={colors.textMuted} strokeWidth={2} />
                          <Text style={[styles.metaText, { color: upcoming ? colors.textMuted : Colors.error }]}>
                            {new Date(h.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </Text>
                        </View>
                      )}
                      {h.rounds && h.rounds.length > 0 && (
                        <View style={[styles.roundBadge, { backgroundColor: colors.accent + '18', borderColor: colors.accent + '40' }]}>
                          <Text style={[styles.roundBadgeText, { color: colors.accent }]}>{h.rounds.length} rounds</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={styles.hackActions}>
                    <Pressable hitSlop={8} onPress={() => openEditHackathon(h)}>
                      <Edit2 size={15} color={colors.textMuted} strokeWidth={2} />
                    </Pressable>
                    <Pressable hitSlop={8} onPress={() => showAlert('Delete Event', `Delete "${h.name}"?`, [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', style: 'destructive', onPress: () => deleteHackathon(h.id) },
                    ])}>
                      <Trash2 size={16} color={colors.textDim} strokeWidth={2} />
                    </Pressable>
                    {isExp ? <ChevronUp size={18} color={colors.textMuted} strokeWidth={2} /> : <ChevronDown size={18} color={colors.textMuted} strokeWidth={2} />}
                  </View>
                </Pressable>

                  {isExp && (
                  <View style={[styles.expandedSection, { borderTopWidth: 1, borderTopColor: colors.border }]}>
                    {/* Progress */}
                    {(h.rounds?.length ?? 0) > 0 && (() => {
                      const cleared = h.rounds?.filter(r => r.status === 'Cleared' || r.status === 'Submitted').length ?? 0;
                      const pct = Math.round((cleared / (h.rounds?.length ?? 1)) * 100);
                      return (
                        <View style={{ gap: 6, marginBottom: Spacing.sm }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Round Progress</Text>
                            <Text style={[styles.detailLabel, { color: colors.accent }]}>{cleared}/{h.rounds?.length ?? 0} ({pct}%)</Text>
                          </View>
                          <ProgressBar progress={pct} color={colors.accent} height={5} backgroundColor={colors.surfaceLight} />
                        </View>
                      );
                    })()}
                    {h.theme && <Text style={[styles.detailRow, { color: colors.textSecondary }]}><Text style={[styles.detailLabel, { color: colors.textMuted }]}>Theme  </Text>{h.theme}</Text>}
                    {h.problem_statement && <Text style={[styles.detailRow, { color: colors.textSecondary }]} numberOfLines={3}><Text style={[styles.detailLabel, { color: colors.textMuted }]}>Problem  </Text>{h.problem_statement}</Text>}
                    {h.start_date && <Text style={[styles.detailRow, { color: colors.textSecondary }]}><Text style={[styles.detailLabel, { color: colors.textMuted }]}>Start  </Text>{h.start_date}</Text>}

                    <View style={styles.roundsSection}>
                      <Text style={[styles.roundsTitle, { color: colors.text }]}>Rounds</Text>
                      {(h.rounds ?? []).length === 0 ? (
                        <Text style={[styles.noRounds, { color: colors.textMuted }]}>No rounds added</Text>
                      ) : (
                        (h.rounds ?? []).map(r => (
                          <View key={r.id} style={[styles.roundCard, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
                            <View style={styles.roundTop}>
                              <View style={[styles.roundNum, { backgroundColor: colors.accent + '18' }]}>
                                <Text style={[styles.roundNumText, { color: colors.accent }]}>R{r.round_number}</Text>
                              </View>
                              <View style={styles.roundInfo}>
                                <Text style={[styles.roundName, { color: colors.text }]}>{r.name}</Text>
                                <View style={styles.roundMeta}>
                                  {r.deadline && (
                                    <View style={styles.metaItem}>
                                      <Clock size={10} color={Colors.warning} strokeWidth={2} />
                                      <Text style={[styles.metaText, { color: Colors.warning }]}>{new Date(r.deadline).toLocaleDateString()}</Text>
                                    </View>
                                  )}
                                  <View style={styles.metaItem}>
                                    <MapPin size={10} color={colors.textMuted} strokeWidth={2} />
                                    <Text style={[styles.metaText, { color: colors.textMuted }]}>{r.mode}{r.location ? ` · ${r.location}` : ''}</Text>
                                  </View>
                                </View>
                                {r.requirements && <Text style={[styles.roundReqs, { color: colors.textMuted }]} numberOfLines={2}>{r.requirements}</Text>}
                              </View>
                              <View style={styles.roundActions}>
                                <View style={[styles.statusBadge, { borderColor: STATUS_COLORS[r.status] ?? colors.textMuted }]}>
                                  <Text style={[styles.statusText, { color: STATUS_COLORS[r.status] ?? colors.textMuted }]}>{r.status}</Text>
                                </View>
                                <Pressable hitSlop={8} onPress={() => deleteRound(r.id, h.id)}>
                                  <Trash2 size={14} color={colors.textDim} strokeWidth={2} />
                                </Pressable>
                              </View>
                            </View>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusRow}>
                              {ROUND_STATUSES.map(s => (
                                <Pressable key={s} style={[styles.statusChip, { borderColor: r.status === s ? STATUS_COLORS[s] : colors.border, backgroundColor: r.status === s ? (STATUS_COLORS[s] ?? colors.accent) + '18' : colors.surface }]} onPress={() => updateRound(r.id, { status: s })}>
                                  <Text style={[styles.statusChipText, { color: r.status === s ? STATUS_COLORS[s] : colors.textMuted }]}>{s}</Text>
                                </Pressable>
                              ))}
                            </ScrollView>
                          </View>
                        ))
                      )}
                      <Pressable style={styles.addRoundBtn} onPress={() => {
                        setActiveHackathonId(h.id); setRNumber(String((h.rounds?.length ?? 0) + 1)); setRoundModal(true);
                      }}>
                        <Plus size={14} color={colors.accent} strokeWidth={2} />
                        <Text style={[styles.addRoundText, { color: colors.accent }]}>Add Round</Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              </GlassCard>
            );
          })}
        </ScrollView>
      )}

      {/* Hackathon Modal */}
      <Modal visible={hackModal} transparent animationType="slide" onRequestClose={() => setHackModal(false)}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setHackModal(false)} />
          <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border, paddingBottom: insets.bottom + 16 }]}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>{editHackId ? 'Edit Event' : 'New Event'}</Text>
              <Pressable onPress={() => { setHackModal(false); resetHackForm(); }}><X size={20} color={colors.textMuted} strokeWidth={2} /></Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <AppInput label="Event Name *" placeholder="Smart India Hackathon 2025" value={hName} onChangeText={setHName} />
              <AppInput label="Theme" placeholder="AI / Web3 / Healthcare..." value={hTheme} onChangeText={setHTheme} />
              <AppInput label="Problem Statement" placeholder="Brief description..." value={hProblem} onChangeText={setHProblem} multiline numberOfLines={2} />
              <AppInput label="Organizer" placeholder="Company / College name" value={hOrganizer} onChangeText={setHOrganizer} />
              <AppInput label="Registration Link" placeholder="https://..." value={hRegLink} onChangeText={setHRegLink} keyboardType="url" autoCapitalize="none" />
              <AppInput label="Start Date (YYYY-MM-DD)" placeholder="2025-11-01" value={hStart} onChangeText={setHStart} />
              <AppInput label="End Date (YYYY-MM-DD)" placeholder="2025-11-30" value={hEnd} onChangeText={setHEnd} />
              <PrimaryButton title={editHackId ? 'Save Changes' : 'Create Event'} onPress={handleAddHackathon} loading={saving} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Round Modal */}
      <Modal visible={roundModal} transparent animationType="slide" onRequestClose={() => setRoundModal(false)}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setRoundModal(false)} />
          <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border, paddingBottom: insets.bottom + 16 }]}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>Add Round</Text>
              <Pressable onPress={() => setRoundModal(false)}><X size={20} color={colors.textMuted} strokeWidth={2} /></Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <AppInput label="Round Name *" placeholder="Idea Submission, Prototype..." value={rName} onChangeText={setRName} />
              <AppInput label="Round Number" placeholder="1" value={rNumber} onChangeText={setRNumber} keyboardType="numeric" />
              <AppInput label="Deadline (YYYY-MM-DD)" placeholder="2025-11-15" value={rDeadline} onChangeText={setRDeadline} />
              <AppInput label="Requirements" placeholder="What to submit..." value={rReqs} onChangeText={setRReqs} multiline numberOfLines={2} />
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Mode</Text>
              <View style={styles.modeRow}>
                {MODES.map(m => (
                  <Pressable key={m} style={[styles.modeChip, { borderColor: rMode === m ? colors.accent : colors.border, backgroundColor: rMode === m ? colors.accent + '18' : colors.surfaceLight }]} onPress={() => setRMode(m)}>
                    <Text style={[styles.modeChipText, { color: rMode === m ? colors.accent : colors.textMuted }]}>{m}</Text>
                  </Pressable>
                ))}
              </View>
              {rMode !== 'Online' && <AppInput label="Location" placeholder="City / Venue" value={rLocation} onChangeText={setRLocation} />}
              <PrimaryButton title="Add Round" onPress={handleAddRound} loading={saving} style={{ marginTop: Spacing.sm }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.base, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  title: { fontSize: Typography.sizes.xxl, fontWeight: Typography.weights.bold },
  subtitle: { fontSize: Typography.sizes.sm, marginTop: 2 },
  addBtn: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xxl, gap: Spacing.md },
  emptyTitle: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, textAlign: 'center' },
  emptySubtitle: { fontSize: Typography.sizes.base, textAlign: 'center' },
  list: { paddingHorizontal: Spacing.base, paddingTop: Spacing.sm },
  hackCard: { marginBottom: Spacing.md, overflow: 'hidden' },
  hackHeader: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base, gap: Spacing.md },
  statusIndicator: { width: 8, height: 8, borderRadius: 4 },
  hackInfo: { flex: 1, gap: 4 },
  hackName: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.semibold },
  hackMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, alignItems: 'center' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: Typography.sizes.xs },
  roundBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.full, borderWidth: 1 },
  roundBadgeText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.semibold },
  hackActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  expandedSection: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.base, paddingTop: Spacing.md, gap: Spacing.sm },
  detailRow: { fontSize: Typography.sizes.sm, lineHeight: 20 },
  detailLabel: { fontWeight: Typography.weights.semibold },
  roundsSection: { gap: Spacing.sm, marginTop: Spacing.sm },
  roundsTitle: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.semibold },
  noRounds: { fontSize: Typography.sizes.sm },
  roundCard: { borderRadius: Radius.md, borderWidth: 1, padding: Spacing.md, gap: Spacing.sm },
  roundTop: { flexDirection: 'row', gap: Spacing.sm },
  roundNum: { width: 32, height: 32, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  roundNumText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold },
  roundInfo: { flex: 1, gap: 3 },
  roundMeta: { flexDirection: 'row', gap: Spacing.sm },
  roundName: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold },
  roundReqs: { fontSize: Typography.sizes.xs },
  roundActions: { alignItems: 'flex-end', gap: Spacing.xs },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.full, borderWidth: 1 },
  statusText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.semibold },
  statusRow: { marginTop: Spacing.xs },
  statusChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full, borderWidth: 1, marginRight: Spacing.xs },
  statusChipText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.semibold },
  addRoundBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingTop: Spacing.xs },
  addRoundText: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.medium },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.65)' },
  sheet: { borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, borderWidth: 1, padding: Spacing.xl, maxHeight: '90%' },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.base },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  sheetTitle: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold },
  fieldLabel: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, marginBottom: Spacing.sm },
  modeRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.base },
  modeChip: { flex: 1, paddingVertical: Spacing.sm, borderRadius: Radius.md, borderWidth: 1, alignItems: 'center' },
  modeChipText: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold },
});
