import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Modal,
  KeyboardAvoidingView, Platform, StatusBar, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAlert } from '@/template';
import { useStudy } from '@/hooks/useStudy';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Typography, Spacing, Radius, Colors } from '@/constants/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { AppInput } from '@/components/ui/AppInput';
import { ResourceViewer } from '@/components/feature/ResourceViewer';
import { StudyResource } from '@/services/studyService';

const RESOURCE_TYPES = ['YouTube', 'PDF', 'Website', 'Drive', 'Notes', 'Other'];
const RESOURCE_ICONS: Record<string, string> = {
  YouTube: 'play-circle-outline',
  PDF: 'picture-as-pdf',
  Website: 'language',
  Drive: 'cloud',
  Notes: 'note',
  Other: 'link',
};

export default function StudyScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const DOMAIN_COLORS = colors?.domainColors || [
    '#29B6F6', '#0288D1', '#4FC3F7', '#81D4FA',
    '#00BCD4', '#26C6DA', '#4DD0E1', '#00ACC1',
  ];
  const { domains, loading, addDomain, deleteDomain, addSubject, deleteSubject, addResource, deleteResource, updateSubjectHours } = useStudy();
  const { showAlert } = useAlert();

  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

  // Domain modal
  const [domainModal, setDomainModal] = useState(false);
  const [domainName, setDomainName] = useState('');
  const [selectedColor, setSelectedColor] = useState(DOMAIN_COLORS[0]);
  const [savingDomain, setSavingDomain] = useState(false);

  // Subject modal
  const [subjectModal, setSubjectModal] = useState(false);
  const [activeDomainId, setActiveDomainId] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [savingSubject, setSavingSubject] = useState(false);

  // Resource modal
  const [resourceModal, setResourceModal] = useState(false);
  const [activeSubjectId, setActiveSubjectId] = useState('');
  const [activeDomainIdForResource, setActiveDomainIdForResource] = useState('');
  const [resourceType, setResourceType] = useState('YouTube');
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceUrl, setResourceUrl] = useState('');
  const [savingResource, setSavingResource] = useState(false);
  const [viewerResource, setViewerResource] = useState<StudyResource | null>(null);
  const totalSubjects = domains.reduce((a, d) => a + (d.subjects?.length ?? 0), 0);
  const totalResources = domains.reduce((a, d) => a + (d.subjects?.reduce((b, s) => b + (s.resources?.length ?? 0), 0) ?? 0), 0);
  const totalHours = domains.reduce((a, d) => a + (d.subjects?.reduce((b, s) => b + (s.study_hours ?? 0), 0) ?? 0), 0);

  const handleAddDomain = async () => {
    if (!domainName.trim()) { showAlert('Required', 'Enter a domain name.'); return; }
    setSavingDomain(true);
    await addDomain(domainName.trim(), selectedColor);
    setSavingDomain(false);
    setDomainModal(false);
    setDomainName('');
  };

  const handleAddSubject = async () => {
    if (!subjectName.trim()) { showAlert('Required', 'Enter a subject name.'); return; }
    setSavingSubject(true);
    await addSubject(activeDomainId, subjectName.trim());
    setSavingSubject(false);
    setSubjectModal(false);
    setSubjectName('');
  };

  const handleAddResource = async () => {
    if (!resourceTitle.trim()) { showAlert('Required', 'Enter a resource title.'); return; }
    setSavingResource(true);
    await addResource(activeSubjectId, activeDomainIdForResource, resourceType, resourceTitle.trim(), resourceUrl.trim() || undefined);
    setSavingResource(false);
    setResourceModal(false);
    setResourceTitle(''); setResourceUrl('');
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.text === '#FFFFFF' ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.screenTitle, { color: colors.text }]}>Study Chamber</Text>
          <Text style={[styles.screenSub, { color: colors.textMuted }]}>{domains.length} domains · {totalSubjects} subjects · {totalResources} resources · {totalHours}h tracked</Text>
        </View>
        <Pressable style={styles.addBtn} onPress={() => setDomainModal(true)}>
          <MaterialIcons name="add" size={26} color="#fff" />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.accent} size="large" /></View>
      ) : domains.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📚</Text>
          <Text style={styles.emptyTitle}>Create your Study Domain</Text>
          <Text style={styles.emptySubtitle}>Organize subjects, resources, and track study hours</Text>
          <PrimaryButton title="Add Domain" onPress={() => setDomainModal(true)} style={{ marginTop: Spacing.lg, paddingHorizontal: Spacing.xxl }} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]} showsVerticalScrollIndicator={false}>
          {domains.map(domain => {
            const isExpanded = expandedDomain === domain.id;
            return (
              <GlassCard key={domain.id} style={styles.domainCard}>
                {/* Domain Header */}
                <Pressable style={styles.domainHeader} onPress={() => setExpandedDomain(isExpanded ? null : domain.id)}>
                  <View style={[styles.domainDot, { backgroundColor: domain.color }]} />
                  <Text style={styles.domainName}>{domain.name}</Text>
                  <Text style={styles.subjectCount}>{domain.subjects?.length ?? 0} subjects</Text>
                  <Pressable
                    hitSlop={8}
                    onPress={() => showAlert('Delete Domain', `Delete "${domain.name}" and all its subjects?`, [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', style: 'destructive', onPress: () => deleteDomain(domain.id) },
                    ])}
                  >
                    <MaterialIcons name="delete-outline" size={18} color={Colors.textDim} />
                  </Pressable>
                  <MaterialIcons name={isExpanded ? 'expand-less' : 'expand-more'} size={22} color={Colors.textMuted} />
                </Pressable>

                {isExpanded ? (
                  <View style={styles.subjectSection}>
                    {(domain.subjects ?? []).map(subject => {
                      const isSubExpanded = expandedSubject === subject.id;
                      return (
                        <View key={subject.id} style={styles.subjectCard}>
                          <Pressable style={styles.subjectHeader} onPress={() => setExpandedSubject(isSubExpanded ? null : subject.id)}>
                            <MaterialIcons name="book" size={16} color={domain.color} />
                            <Text style={[styles.subjectName, { color: colors.text }]}>{subject.name}</Text>
                            <Text style={[styles.resourceCount, { color: colors.textMuted }]}>{subject.study_hours ?? 0}h · {subject.resources?.length ?? 0} res</Text>
                            <Pressable hitSlop={8} onPress={() => updateSubjectHours(subject.id, domain.id, (subject.study_hours ?? 0) + 0.5)}>
                              <MaterialIcons name="add-circle-outline" size={18} color={colors.accent} />
                            </Pressable>
                            <Pressable hitSlop={8} onPress={() => showAlert('Delete Subject', `Delete "${subject.name}"?`, [
                              { text: 'Cancel', style: 'cancel' },
                              { text: 'Delete', style: 'destructive', onPress: () => deleteSubject(subject.id, domain.id) },
                            ])}>
                              <MaterialIcons name="delete-outline" size={16} color={Colors.textDim} />
                            </Pressable>
                            <MaterialIcons name={isSubExpanded ? 'expand-less' : 'expand-more'} size={18} color={Colors.textMuted} />
                          </Pressable>

                          {isSubExpanded ? (
                            <View style={styles.resourceSection}>
                              {(subject.resources ?? []).map(res => (
                                <Pressable key={res.id} style={styles.resourceRow} onPress={() => setViewerResource(res)}>
                                  <MaterialIcons name={RESOURCE_ICONS[res.type] as any ?? 'link'} size={16} color={colors.accent} />
                                  <Text style={[styles.resourceTitle, { color: colors.textSecondary }]} numberOfLines={1}>{res.title}</Text>
                                  <MaterialIcons name="open-in-new" size={14} color={colors.textDim} />
                                  <Pressable hitSlop={8} onPress={() => deleteResource(res.id, subject.id, domain.id)}>
                                    <MaterialIcons name="close" size={14} color={colors.textDim} />
                                  </Pressable>
                                </Pressable>
                              ))}
                              <Pressable
                                style={styles.addResourceBtn}
                                onPress={() => {
                                  setActiveSubjectId(subject.id);
                                  setActiveDomainIdForResource(domain.id);
                                  setResourceModal(true);
                                }}
                              >
                                <MaterialIcons name="add" size={16} color={Colors.accent} />
                                <Text style={styles.addResourceText}>Add Resource</Text>
                              </Pressable>
                            </View>
                          ) : null}
                        </View>
                      );
                    })}
                    <Pressable
                      style={styles.addSubjectBtn}
                      onPress={() => { setActiveDomainId(domain.id); setSubjectModal(true); }}
                    >
                      <MaterialIcons name="add" size={16} color={domain.color} />
                      <Text style={[styles.addSubjectText, { color: domain.color }]}>Add Subject</Text>
                    </Pressable>
                  </View>
                ) : null}
              </GlassCard>
            );
          })}
        </ScrollView>
      )}

      {/* Domain Modal */}
      <Modal visible={domainModal} transparent animationType="slide" onRequestClose={() => setDomainModal(false)}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setDomainModal(false)} />
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>New Domain</Text>
            <AppInput label="Domain Name *" placeholder="e.g. College, Placement, Coding..." value={domainName} onChangeText={setDomainName} />
            <Text style={styles.fieldLabel}>Color</Text>
            <View style={styles.colorRow}>
              {DOMAIN_COLORS.map(c => (
                <Pressable
                  key={c}
                  style={[styles.colorDot, { backgroundColor: c }, selectedColor === c && styles.colorDotSelected]}
                  onPress={() => setSelectedColor(c)}
                />
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
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>New Subject</Text>
            <AppInput label="Subject Name *" placeholder="e.g. DSA, Java, React..." value={subjectName} onChangeText={setSubjectName} />
            <PrimaryButton title="Add Subject" onPress={handleAddSubject} loading={savingSubject} style={{ marginTop: Spacing.lg }} />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Resource Modal */}
      <Modal visible={resourceModal} transparent animationType="slide" onRequestClose={() => setResourceModal(false)}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setResourceModal(false)} />
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Add Resource</Text>
            <Text style={styles.fieldLabel}>Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.base }}>
              <View style={styles.chipRow}>
                {RESOURCE_TYPES.map(t => (
                  <Pressable key={t} style={[styles.typeChip, resourceType === t && styles.typeChipActive]} onPress={() => setResourceType(t)}>
                    <MaterialIcons name={RESOURCE_ICONS[t] as any ?? 'link'} size={14} color={resourceType === t ? Colors.accent : Colors.textMuted} />
                    <Text style={[styles.typeChipText, resourceType === t && styles.typeChipTextActive]}>{t}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
            <AppInput label="Title *" placeholder="Resource name" value={resourceTitle} onChangeText={setResourceTitle} />
            <AppInput label="URL (optional)" placeholder="https://..." value={resourceUrl} onChangeText={setResourceUrl} keyboardType="url" autoCapitalize="none" />
            <PrimaryButton title="Add Resource" onPress={handleAddResource} loading={savingResource} />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <ResourceViewer
        visible={!!viewerResource}
        onClose={() => setViewerResource(null)}
        type={viewerResource?.type ?? ''}
        title={viewerResource?.title ?? ''}
        url={viewerResource?.url}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
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
  domainCard: { marginBottom: Spacing.md, padding: 0, overflow: 'hidden' },
  domainHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.base },
  domainDot: { width: 12, height: 12, borderRadius: 6 },
  domainName: { flex: 1, color: Colors.text, fontFamily: 'Arial', fontSize: Typography.sizes.lg, fontWeight: '700' },
  subjectCount: { color: Colors.textMuted, fontFamily: 'Arial', fontSize: Typography.sizes.sm },
  subjectSection: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.base },
  subjectCard: { backgroundColor: Colors.surfaceLight, borderRadius: Radius.md, marginBottom: Spacing.sm, overflow: 'hidden' },
  subjectHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md },
  subjectName: { flex: 1, color: Colors.text, fontFamily: 'Arial', fontSize: Typography.sizes.base, fontWeight: '600' },
  resourceCount: { color: Colors.textMuted, fontFamily: 'Arial', fontSize: Typography.sizes.xs },
  resourceSection: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.md },
  resourceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xs + 2, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  resourceTitle: { flex: 1, color: Colors.textSecondary, fontFamily: 'Arial', fontSize: Typography.sizes.sm },
  resourceUrl: { color: Colors.textMuted, fontFamily: 'Arial', fontSize: Typography.sizes.xs, maxWidth: 100 },
  addResourceBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingVertical: Spacing.sm, marginTop: Spacing.xs },
  addResourceText: { color: Colors.accent, fontFamily: 'Arial', fontSize: Typography.sizes.sm, fontWeight: '600' },
  addSubjectBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingVertical: Spacing.sm, marginTop: Spacing.xs },
  addSubjectText: { fontFamily: 'Arial', fontSize: Typography.sizes.sm, fontWeight: '600' },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: { backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, borderWidth: 1, borderColor: Colors.border, padding: Spacing.xl, maxHeight: '85%' },
  sheetHandle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.lg },
  sheetTitle: { color: Colors.text, fontFamily: 'Arial', fontSize: Typography.sizes.xl, fontWeight: '700', marginBottom: Spacing.lg },
  fieldLabel: { color: Colors.textSecondary, fontFamily: 'Arial', fontSize: Typography.sizes.sm, fontWeight: '600', marginBottom: Spacing.sm },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorDotSelected: { borderWidth: 3, borderColor: '#fff', transform: [{ scale: 1.15 }] },
  chipRow: { flexDirection: 'row', gap: Spacing.sm },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surfaceLight },
  typeChipActive: { borderColor: Colors.accent, backgroundColor: 'rgba(41,182,246,0.12)' },
  typeChipText: { color: Colors.textMuted, fontFamily: 'Arial', fontSize: Typography.sizes.sm },
  typeChipTextActive: { color: Colors.accent },
});
