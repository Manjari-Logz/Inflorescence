import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Modal,
  KeyboardAvoidingView, Platform, StatusBar, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Plus, Trash2, ChevronDown, ChevronUp, Book, Link,
  Youtube, FileText, Globe, Cloud, PlusCircle, X,
} from 'lucide-react-native';
import { useAlert } from '@/template';
import { useStudy } from '@/hooks/useStudy';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Typography, Spacing, Radius } from '@/constants/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { AppInput } from '@/components/ui/AppInput';
import { ResourceViewer } from '@/components/feature/ResourceViewer';
import { PomodoroTimer } from '@/components/feature/PomodoroTimer';
import { WatercolorBackground } from '@/components/ui/WatercolorBackground';
import { StudyResource } from '@/services/studyService';

const RESOURCE_TYPES = ['YouTube', 'PDF', 'Website', 'Drive', 'Notes', 'Other'];
const RESOURCE_ICONS: Record<string, any> = {
  YouTube: Youtube,
  PDF: FileText,
  Website: Globe,
  Drive: Cloud,
  Notes: FileText,
  Other: Link,
};

export default function FocusScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const DOMAIN_COLORS = colors?.domainColors || ['#3B82F6', '#2563EB', '#8B5CF6', '#6366F1', '#22C55E', '#F59E0B', '#EF4444', '#EC4899'];
  const { domains, loading, addDomain, deleteDomain, addSubject, deleteSubject, addResource, deleteResource, updateSubjectHours } = useStudy();
  const { showAlert } = useAlert();

  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [domainModal, setDomainModal] = useState(false);
  const [domainName, setDomainName] = useState('');
  const [selectedColor, setSelectedColor] = useState(DOMAIN_COLORS[0]);
  const [savingDomain, setSavingDomain] = useState(false);
  const [subjectModal, setSubjectModal] = useState(false);
  const [activeDomainId, setActiveDomainId] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [savingSubject, setSavingSubject] = useState(false);
  const [resourceModal, setResourceModal] = useState(false);
  const [activeSubjectId, setActiveSubjectId] = useState('');
  const [activeDomainIdForResource, setActiveDomainIdForResource] = useState('');
  const [resourceType, setResourceType] = useState('YouTube');
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceUrl, setResourceUrl] = useState('');
  const [savingResource, setSavingResource] = useState(false);
  const [viewerResource, setViewerResource] = useState<StudyResource | null>(null);

  const totalSubjects = domains.reduce((a, d) => a + (d.subjects?.length ?? 0), 0);
  const totalHours = domains.reduce((a, d) => a + (d.subjects?.reduce((b, s) => b + (s.study_hours ?? 0), 0) ?? 0), 0);

  const handleAddDomain = async () => {
    if (!domainName.trim()) { showAlert('Required', 'Enter a domain name.'); return; }
    setSavingDomain(true);
    await addDomain(domainName.trim(), selectedColor);
    setSavingDomain(false); setDomainModal(false); setDomainName('');
  };

  const handleAddSubject = async () => {
    if (!subjectName.trim()) { showAlert('Required', 'Enter a subject name.'); return; }
    setSavingSubject(true);
    await addSubject(activeDomainId, subjectName.trim());
    setSavingSubject(false); setSubjectModal(false); setSubjectName('');
  };

  const handleAddResource = async () => {
    if (!resourceTitle.trim()) { showAlert('Required', 'Enter a resource title.'); return; }
    setSavingResource(true);
    await addResource(activeSubjectId, activeDomainIdForResource, resourceType, resourceTitle.trim(), resourceUrl.trim() || undefined);
    setSavingResource(false); setResourceModal(false); setResourceTitle(''); setResourceUrl('');
  };

  return (
    <WatercolorBackground>
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" />

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Focus Center</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>{domains.length} domains · {totalSubjects} subjects · {totalHours}h tracked</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]} showsVerticalScrollIndicator={false}>
          {/* Integrated Pomodoro Timer */}
          <PomodoroTimer />

          {/* Section Divider */}
          <View style={styles.sectionDividerRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Subjects & Domains</Text>
            <Pressable style={[styles.addDomainBtn, { backgroundColor: colors.accent + '18', borderColor: colors.accent + '40' }]} onPress={() => setDomainModal(true)}>
              <Plus size={16} color={colors.accent} strokeWidth={2.5} />
              <Text style={[styles.addDomainTxt, { color: colors.accent }]}>Domain</Text>
            </Pressable>
          </View>

          {/* Domain List */}
          {loading ? (
            <View style={styles.center}><ActivityIndicator color={colors.accent} size="large" /></View>
          ) : domains.length === 0 ? (
            <View style={styles.empty}>
              <Book size={44} color={colors.textDim} strokeWidth={1.5} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Create a Study Domain</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>Organize subject targets, attach notes/links, and record focus intervals.</Text>
            </View>
          ) : (
            domains.map(domain => {
              const isExpanded = expandedDomain === domain.id;
              return (
                <GlassCard key={domain.id} style={[styles.domainCard, { backgroundColor: colors.surface, borderColor: colors.border }]} padding={0}>
                  <Pressable style={styles.domainHeader} onPress={() => setExpandedDomain(isExpanded ? null : domain.id)}>
                    <View style={[styles.domainDot, { backgroundColor: domain.color }]} />
                    <Text style={[styles.domainName, { color: colors.text }]}>{domain.name}</Text>
                    <Text style={[styles.domainMeta, { color: colors.textMuted }]}>{domain.subjects?.length ?? 0} subjects</Text>
                    <Pressable hitSlop={8} style={styles.trashBtn} onPress={() => showAlert('Delete Domain', `Delete "${domain.name}" and all its subjects?`, [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', style: 'destructive', onPress: () => deleteDomain(domain.id) },
                    ])}>
                      <Trash2 size={15} color={colors.textDim} strokeWidth={2} />
                    </Pressable>
                    {isExpanded ? <ChevronUp size={18} color={colors.textMuted} strokeWidth={2} /> : <ChevronDown size={18} color={colors.textMuted} strokeWidth={2} />}
                  </Pressable>

                  {isExpanded && (
                    <View style={[styles.subjectSection, { borderTopWidth: 1, borderTopColor: colors.border }]}>
                      {(domain.subjects ?? []).map(subject => {
                        const isSubExpanded = expandedSubject === subject.id;
                        return (
                          <View key={subject.id} style={[styles.subjectCard, { backgroundColor: colors.surfaceLight }]}>
                            <Pressable style={styles.subjectHeader} onPress={() => setExpandedSubject(isSubExpanded ? null : subject.id)}>
                              <Book size={14} color={domain.color} strokeWidth={2} />
                              <Text style={[styles.subjectNameText, { color: colors.text }]}>{subject.name}</Text>
                              <Text style={[styles.subjectMetaText, { color: colors.textMuted }]}>{subject.study_hours ?? 0}h</Text>
                              <Pressable hitSlop={8} style={styles.plusHoursBtn} onPress={() => updateSubjectHours(subject.id, domain.id, (subject.study_hours ?? 0) + 0.5)}>
                                <PlusCircle size={16} color={colors.accent} strokeWidth={2} />
                              </Pressable>
                              <Pressable hitSlop={8} style={styles.trashBtn} onPress={() => showAlert('Delete Subject', `Delete "${subject.name}"?`, [
                                { text: 'Cancel', style: 'cancel' },
                                { text: 'Delete', style: 'destructive', onPress: () => deleteSubject(subject.id, domain.id) },
                              ])}>
                                <Trash2 size={13} color={colors.textDim} strokeWidth={2} />
                              </Pressable>
                              {isSubExpanded ? <ChevronUp size={16} color={colors.textMuted} strokeWidth={2} /> : <ChevronDown size={16} color={colors.textMuted} strokeWidth={2} />}
                            </Pressable>

                            {isSubExpanded && (
                              <View style={[styles.resourceSection, { borderTopWidth: 1, borderTopColor: colors.border }]}>
                                {(subject.resources ?? []).map(res => {
                                  const ResIcon = RESOURCE_ICONS[res.type] ?? Link;
                                  return (
                                    <Pressable key={res.id} style={styles.resourceRow} onPress={() => setViewerResource(res)}>
                                      <ResIcon size={14} color={colors.accent} strokeWidth={2} />
                                      <Text style={[styles.resourceTitle, { color: colors.textSecondary }]} numberOfLines={1}>{res.title}</Text>
                                      <Pressable hitSlop={8} onPress={() => deleteResource(res.id, subject.id, domain.id)}>
                                        <X size={14} color={colors.textDim} strokeWidth={2} />
                                      </Pressable>
                                    </Pressable>
                                  );
                                })}
                                <Pressable style={styles.addResourceBtn} onPress={() => {
                                  setActiveSubjectId(subject.id); setActiveDomainIdForResource(domain.id); setResourceModal(true);
                                }}>
                                  <Plus size={14} color={colors.accent} strokeWidth={2} />
                                  <Text style={[styles.addResourceText, { color: colors.accent }]}>Add Resource</Text>
                                </Pressable>
                              </View>
                            )}
                          </View>
                        );
                      })}
                      <Pressable style={styles.addSubjectBtn} onPress={() => { setActiveDomainId(domain.id); setSubjectModal(true); }}>
                        <Plus size={14} color={domain.color} strokeWidth={2} />
                        <Text style={[styles.addSubjectText, { color: domain.color }]}>Add Subject</Text>
                      </Pressable>
                    </View>
                  )}
                </GlassCard>
              );
            })
          )}
        </ScrollView>

        {/* Domain Modal */}
        <Modal visible={domainModal} transparent animationType="slide" onRequestClose={() => setDomainModal(false)}>
          <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setDomainModal(false)} />
            <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border, paddingBottom: insets.bottom + 16 }]}>
              <View style={[styles.handle, { backgroundColor: colors.border }]} />
              <View style={styles.sheetHeader}>
                <Text style={[styles.sheetTitle, { color: colors.text }]}>New Domain</Text>
                <Pressable onPress={() => setDomainModal(false)}><X size={20} color={colors.textMuted} strokeWidth={2} /></Pressable>
              </View>
              <AppInput label="Domain Name *" placeholder="e.g. College, Placement, Coding..." value={domainName} onChangeText={setDomainName} />
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Color</Text>
              <View style={styles.colorRow}>
                {DOMAIN_COLORS.map(c => (
                  <Pressable key={c} style={[styles.colorDot, { backgroundColor: c }, selectedColor === c && styles.colorDotSelected]} onPress={() => setSelectedColor(c)} />
                ))}
              </View>
              <PrimaryButton title="Create Domain" onPress={handleAddDomain} loading={savingDomain} style={{ marginTop: Spacing.lg }} />
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Subject Modal */}
        <Modal visible={subjectModal} transparent animationType="slide" onRequestClose={() => setSubjectModal(false)}>
          <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setSubjectModal(false)} />
            <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border, paddingBottom: insets.bottom + 16 }]}>
              <View style={[styles.handle, { backgroundColor: colors.border }]} />
              <View style={styles.sheetHeader}>
                <Text style={[styles.sheetTitle, { color: colors.text }]}>New Subject</Text>
                <Pressable onPress={() => setSubjectModal(false)}><X size={20} color={colors.textMuted} strokeWidth={2} /></Pressable>
              </View>
              <AppInput label="Subject Name *" placeholder="e.g. DSA, Java, React..." value={subjectName} onChangeText={setSubjectName} />
              <PrimaryButton title="Add Subject" onPress={handleAddSubject} loading={savingSubject} style={{ marginTop: Spacing.lg }} />
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Resource Modal */}
        <Modal visible={resourceModal} transparent animationType="slide" onRequestClose={() => setResourceModal(false)}>
          <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setResourceModal(false)} />
            <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border, paddingBottom: insets.bottom + 16 }]}>
              <View style={[styles.handle, { backgroundColor: colors.border }]} />
              <View style={styles.sheetHeader}>
                <Text style={[styles.sheetTitle, { color: colors.text }]}>Add Resource</Text>
                <Pressable onPress={() => setResourceModal(false)}><X size={20} color={colors.textMuted} strokeWidth={2} /></Pressable>
              </View>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.base }}>
                <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                  {RESOURCE_TYPES.map(t => {
                    const Icon = RESOURCE_ICONS[t] ?? Link;
                    return (
                      <Pressable key={t} style={[styles.typeChip, { borderColor: resourceType === t ? colors.accent : colors.border, backgroundColor: resourceType === t ? colors.accent + '18' : colors.surfaceLight }]} onPress={() => setResourceType(t)}>
                        <Icon size={14} color={resourceType === t ? colors.accent : colors.textMuted} strokeWidth={2} />
                        <Text style={[styles.typeChipText, { color: resourceType === t ? colors.accent : colors.textMuted }]}>{t}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
              <AppInput label="Title *" placeholder="Resource name" value={resourceTitle} onChangeText={setResourceTitle} />
              <AppInput label="URL (optional)" placeholder="https://..." value={resourceUrl} onChangeText={setResourceUrl} keyboardType="url" autoCapitalize="none" />
              <PrimaryButton title="Add Resource" onPress={handleAddResource} loading={savingResource} />
            </View>
          </KeyboardAvoidingView>
        </Modal>

        <ResourceViewer visible={!!viewerResource} onClose={() => setViewerResource(null)} type={viewerResource?.type ?? ''} title={viewerResource?.title ?? ''} url={viewerResource?.url} />
      </View>
    </WatercolorBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: Spacing.base, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  title: { fontSize: Typography.sizes.xxl, fontWeight: Typography.weights.bold },
  subtitle: { fontSize: Typography.sizes.sm, marginTop: 2 },
  scrollContent: { paddingHorizontal: Spacing.base, gap: Spacing.lg },
  sectionDividerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.sm },
  sectionTitle: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold },
  addDomainBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1 },
  addDomainTxt: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold },
  center: { paddingVertical: Spacing.xxl, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.sm },
  emptyTitle: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, textAlign: 'center' },
  emptySubtitle: { fontSize: Typography.sizes.base, textAlign: 'center', paddingHorizontal: Spacing.xl },
  domainCard: { overflow: 'hidden' },
  domainHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.base },
  domainDot: { width: 10, height: 10, borderRadius: 5 },
  domainName: { flex: 1, fontSize: Typography.sizes.base, fontWeight: Typography.weights.semibold },
  domainMeta: { fontSize: Typography.sizes.sm },
  trashBtn: { padding: 4, opacity: 0.8 },
  subjectSection: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.md, paddingTop: Spacing.sm, gap: Spacing.xs },
  subjectCard: { borderRadius: Radius.md, marginBottom: Spacing.xs, overflow: 'hidden' },
  subjectHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md },
  subjectNameText: { flex: 1, fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold },
  subjectMetaText: { fontSize: Typography.sizes.xs },
  plusHoursBtn: { padding: 4 },
  resourceSection: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.md },
  resourceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 8 },
  resourceTitle: { flex: 1, fontSize: Typography.sizes.sm },
  addResourceBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingTop: Spacing.sm },
  addResourceText: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.medium },
  addSubjectBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingTop: Spacing.sm },
  addSubjectText: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.medium },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: { borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, borderWidth: 1, padding: Spacing.xl, maxHeight: '85%' },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.base },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  sheetTitle: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold },
  fieldLabel: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, marginBottom: Spacing.sm },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorDotSelected: { borderWidth: 3, borderColor: '#fff', transform: [{ scale: 1.15 }] },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.full, borderWidth: 1 },
  typeChipText: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.medium },
});
