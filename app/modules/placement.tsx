import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Modal,
  KeyboardAvoidingView, Platform, ActivityIndicator, StatusBar,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth, useAlert } from '@/template';
import { usePlacement } from '@/hooks/useModules';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Typography, Spacing, Radius } from '@/constants/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import { AppInput } from '@/components/ui/AppInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { PLACEMENT_STAGES, PlacementStage, placementService } from '@/services/placementService';
import { pickDocument, uploadFile } from '@/services/storageService';

export default function PlacementScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const { companies, loading, addCompany, updateCompany, removeCompany } = usePlacement();
  const [modal, setModal] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [pkg, setPkg] = useState('');
  const [notes, setNotes] = useState('');
  const [deadline, setDeadline] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const analytics = placementService.getAnalytics(companies);

  const handleSave = async () => {
    if (!name.trim()) { showAlert('Required', 'Enter company name.'); return; }
    setSaving(true);
    await addCompany({ name: name.trim(), role: role.trim() || undefined, package_amount: pkg.trim() || undefined, notes: notes.trim() || undefined, deadline: deadline.trim() || undefined, resume_url: resumeUrl || undefined, stage: 'applied' });
    setSaving(false); setModal(false);
    setName(''); setRole(''); setPkg(''); setNotes(''); setDeadline(''); setResumeUrl('');
  };

  const handleResumeUpload = async () => {
    const doc = await pickDocument(['application/pdf']);
    if (!doc || !user) return;
    const url = await uploadFile(user.id, 'resumes', doc.uri, doc.name, doc.mimeType ?? 'application/pdf');
    if (url) setResumeUrl(url);
  };

  const moveStage = (id: string, stage: PlacementStage) => updateCompany(id, { stage });

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <StatusBar barStyle={colors.text === '#FFFFFF' ? 'light-content' : 'dark-content'} />
      <ScreenHeader title="Placement Drive" subtitle={`${analytics.total} companies · ${analytics.offers} offers`} rightAction={
        <Pressable onPress={() => setModal(true)} style={[styles.addBtn, { backgroundColor: colors.primary }]}>
          <MaterialIcons name="add" size={24} color="#fff" />
        </Pressable>
      } />

      <ScrollView contentContainerStyle={{ padding: Spacing.base, paddingBottom: insets.bottom + 40 }}>
        <GlassCard style={{ backgroundColor: colors.glass, borderColor: colors.border, marginBottom: Spacing.md, gap: Spacing.sm }}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Pipeline Overview</Text>
          <View style={styles.pipelineRow}>
            {PLACEMENT_STAGES.slice(0, 4).map(s => (
              <View key={s.key} style={styles.pipelineStat}>
                <Text style={[styles.pipelineNum, { color: s.color }]}>{analytics.byStage[s.key] ?? 0}</Text>
                <Text style={[styles.pipelineLbl, { color: colors.textMuted }]}>{s.label}</Text>
              </View>
            ))}
          </View>
        </GlassCard>

        <Text style={[styles.kanbanTitle, { color: colors.text }]}>Hiring Pipeline</Text>
        {loading ? <ActivityIndicator color={colors.accent} /> : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.md, paddingBottom: Spacing.md }}>
            {PLACEMENT_STAGES.map(stage => {
              const items = companies.filter(c => c.stage === stage.key);
              return (
                <View key={stage.key} style={[styles.kanbanCol, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
                  <View style={[styles.colHeader, { borderBottomColor: colors.border }]}>
                    <View style={[styles.colDot, { backgroundColor: stage.color }]} />
                    <Text style={[styles.colTitle, { color: colors.text }]}>{stage.label}</Text>
                    <Text style={[styles.colCount, { color: colors.textMuted }]}>{items.length}</Text>
                  </View>
                  {items.map(c => (
                    <Pressable key={c.id} style={[styles.kanbanCard, { backgroundColor: colors.glass, borderColor: colors.border }]}>
                      <Text style={[styles.companyName, { color: colors.text }]} numberOfLines={1}>{c.name}</Text>
                      {c.role ? <Text style={[styles.companyRole, { color: colors.textMuted }]} numberOfLines={1}>{c.role}</Text> : null}
                      {c.package_amount ? <Text style={[styles.companyPkg, { color: stage.color }]}>💰 {c.package_amount}</Text> : null}
                      {c.resume_url ? <MaterialIcons name="description" size={14} color={colors.success} /> : null}
                      <View style={styles.stageActions}>
                        {PLACEMENT_STAGES.filter(s => s.key !== c.stage).slice(0, 2).map(s => (
                          <Pressable key={s.key} onPress={() => moveStage(c.id, s.key)} style={[styles.stageBtn, { borderColor: s.color }]}>
                            <Text style={[styles.stageBtnText, { color: s.color }]}>{s.label}</Text>
                          </Pressable>
                        ))}
                        <Pressable onPress={() => removeCompany(c.id)} hitSlop={8}>
                          <MaterialIcons name="delete-outline" size={16} color={colors.error} />
                        </Pressable>
                      </View>
                    </Pressable>
                  ))}
                </View>
              );
            })}
          </ScrollView>
        )}
      </ScrollView>

      <Modal visible={modal} transparent animationType="slide" onRequestClose={() => setModal(false)}>
        <KeyboardAvoidingView style={[styles.overlay, { backgroundColor: colors.overlay }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setModal(false)} />
          <View style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 16 }]}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>Add Company</Text>
            <AppInput label="Company *" value={name} onChangeText={setName} placeholder="Google, Microsoft..." />
            <AppInput label="Role" value={role} onChangeText={setRole} placeholder="SDE, Analyst..." />
            <AppInput label="Package" value={pkg} onChangeText={setPkg} placeholder="12 LPA, $120k..." />
            <AppInput label="Deadline" value={deadline} onChangeText={setDeadline} placeholder="YYYY-MM-DD" />
            <AppInput label="Notes" value={notes} onChangeText={setNotes} placeholder="Interview notes..." multiline />
            <PrimaryButton title="Upload Resume" onPress={handleResumeUpload} variant="secondary" style={{ marginTop: Spacing.sm }} />
            {resumeUrl ? <Text style={{ color: colors.success, fontFamily: Typography.fontFamily, fontSize: Typography.sizes.sm }}>✓ Resume uploaded</Text> : null}
            <PrimaryButton title="Add Company" onPress={handleSave} loading={saving} style={{ marginTop: Spacing.md }} />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  addBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.lg, fontWeight: '700' },
  pipelineRow: { flexDirection: 'row', justifyContent: 'space-around' },
  pipelineStat: { alignItems: 'center' },
  pipelineNum: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.xxl, fontWeight: '700' },
  pipelineLbl: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.xs },
  kanbanTitle: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.lg, fontWeight: '700', marginBottom: Spacing.md },
  kanbanCol: { width: 200, borderRadius: Radius.lg, borderWidth: 1, maxHeight: 400 },
  colHeader: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.sm, borderBottomWidth: 1 },
  colDot: { width: 8, height: 8, borderRadius: 4 },
  colTitle: { flex: 1, fontFamily: Typography.fontFamily, fontSize: Typography.sizes.sm, fontWeight: '700' },
  colCount: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.sm },
  kanbanCard: { margin: Spacing.sm, padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1, gap: 4 },
  companyName: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.base, fontWeight: '700' },
  companyRole: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.xs },
  companyPkg: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.sm, fontWeight: '600' },
  stageActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: Spacing.xs, flexWrap: 'wrap' },
  stageBtn: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.sm, borderWidth: 1 },
  stageBtnText: { fontFamily: Typography.fontFamily, fontSize: 9, fontWeight: '600' },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, padding: Spacing.xl, maxHeight: '90%' },
  sheetTitle: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.xl, fontWeight: '700', marginBottom: Spacing.lg },
});
