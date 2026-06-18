import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Modal,
  KeyboardAvoidingView, Platform, ActivityIndicator, StatusBar,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth, useAlert } from '@/template';
import { useCustomSections } from '@/hooks/useModules';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Typography, Spacing, Radius } from '@/constants/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import { AppInput } from '@/components/ui/AppInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { pickDocument, uploadFile } from '@/services/storageService';

export default function CustomSectionsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const { sections, loading, addSection, removeSection, addItem, updateItem, removeItem } = useCustomSections();
  const [sectionModal, setSectionModal] = useState(false);
  const [itemModal, setItemModal] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState('');
  const [sectionName, setSectionName] = useState('');
  const [sectionColor, setSectionColor] = useState('#29B6F6');
  const [itemTitle, setItemTitle] = useState('');
  const [requirements, setRequirements] = useState('');
  const [deadline, setDeadline] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleAddSection = async () => {
    if (!sectionName.trim()) return;
    setSaving(true);
    await addSection(sectionName.trim(), sectionColor, 'folder');
    setSaving(false); setSectionModal(false); setSectionName('');
  };

  const handleAddItem = async () => {
    if (!itemTitle.trim() || !activeSectionId) return;
    setSaving(true);
    await addItem(activeSectionId, { title: itemTitle.trim(), requirements: requirements.trim() || undefined, deadline: deadline.trim() || undefined, attachment_url: attachmentUrl || undefined, completed: false });
    setSaving(false); setItemModal(false);
    setItemTitle(''); setRequirements(''); setDeadline(''); setAttachmentUrl('');
  };

  const handleAttachment = async () => {
    const doc = await pickDocument(['*/*']);
    if (!doc || !user) return;
    const url = await uploadFile(user.id, 'attachments', doc.uri, doc.name, doc.mimeType ?? undefined);
    if (url) setAttachmentUrl(url);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <StatusBar barStyle={colors.text === '#FFFFFF' ? 'light-content' : 'dark-content'} />
      <ScreenHeader title="Custom Sections" subtitle="Your personal groups" rightAction={
        <Pressable onPress={() => setSectionModal(true)} style={[styles.addBtn, { backgroundColor: colors.primary }]}>
          <MaterialIcons name="add" size={24} color="#fff" />
        </Pressable>
      } />

      {loading ? <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} /> : (
        <ScrollView contentContainerStyle={{ padding: Spacing.base, paddingBottom: insets.bottom + 40, gap: Spacing.md }}>
          {sections.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📁</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Create custom groups</Text>
              <PrimaryButton title="New Section" onPress={() => setSectionModal(true)} />
            </View>
          ) : sections.map(section => (
            <GlassCard key={section.id} style={{ backgroundColor: colors.glass, borderColor: colors.border, padding: 0, overflow: 'hidden' }}>
              <Pressable style={styles.sectionHeader} onPress={() => setExpanded(expanded === section.id ? null : section.id)}>
                <View style={[styles.sectionDot, { backgroundColor: section.color }]} />
                <Text style={[styles.sectionName, { color: colors.text }]}>{section.name}</Text>
                <Text style={[styles.itemCount, { color: colors.textMuted }]}>{section.items?.length ?? 0}</Text>
                <Pressable onPress={() => showAlert('Delete', `Delete "${section.name}"?`, [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => removeSection(section.id) },
                ])} hitSlop={8}><MaterialIcons name="delete-outline" size={18} color={colors.textDim} /></Pressable>
                <MaterialIcons name={expanded === section.id ? 'expand-less' : 'expand-more'} size={22} color={colors.textMuted} />
              </Pressable>
              {expanded === section.id ? (
                <View style={styles.itemsBlock}>
                  {(section.items ?? []).map(item => (
                    <View key={item.id} style={[styles.itemRow, { borderTopColor: colors.borderLight }]}>
                      <Pressable onPress={() => updateItem(section.id, item.id, { completed: !item.completed })}>
                        <MaterialIcons name={item.completed ? 'check-box' : 'check-box-outline-blank'} size={22} color={item.completed ? colors.success : colors.textDim} />
                      </Pressable>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.itemTitle, { color: colors.text, textDecorationLine: item.completed ? 'line-through' : 'none' }]}>{item.title}</Text>
                        {item.requirements ? <Text style={[styles.itemReq, { color: colors.textMuted }]} numberOfLines={2}>{item.requirements}</Text> : null}
                        {item.deadline ? <Text style={[styles.itemDeadline, { color: colors.warning }]}>📅 {item.deadline}</Text> : null}
                        {item.attachment_url ? <MaterialIcons name="attach-file" size={14} color={colors.accent} /> : null}
                      </View>
                      <Pressable onPress={() => removeItem(section.id, item.id)} hitSlop={8}>
                        <MaterialIcons name="close" size={16} color={colors.textDim} />
                      </Pressable>
                    </View>
                  ))}
                  <Pressable style={styles.addItemBtn} onPress={() => { setActiveSectionId(section.id); setItemModal(true); }}>
                    <MaterialIcons name="add" size={16} color={section.color} />
                    <Text style={[styles.addItemText, { color: section.color }]}>Add Item</Text>
                  </Pressable>
                </View>
              ) : null}
            </GlassCard>
          ))}
        </ScrollView>
      )}

      <Modal visible={sectionModal} transparent animationType="slide" onRequestClose={() => setSectionModal(false)}>
        <KeyboardAvoidingView style={[styles.overlay, { backgroundColor: colors.overlay }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSectionModal(false)} />
          <View style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 16 }]}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>New Section</Text>
            <AppInput label="Name *" value={sectionName} onChangeText={setSectionName} placeholder="Project Alpha" />
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Color</Text>
            <View style={styles.colorRow}>
              {colors.domainColors.map(c => (
                <Pressable key={c} style={[styles.colorDot, { backgroundColor: c }, sectionColor === c && styles.colorSelected]} onPress={() => setSectionColor(c)} />
              ))}
            </View>
            <PrimaryButton title="Create Section" onPress={handleAddSection} loading={saving} style={{ marginTop: Spacing.lg }} />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={itemModal} transparent animationType="slide" onRequestClose={() => setItemModal(false)}>
        <KeyboardAvoidingView style={[styles.overlay, { backgroundColor: colors.overlay }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setItemModal(false)} />
          <View style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 16 }]}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>Add Item</Text>
            <AppInput label="Title *" value={itemTitle} onChangeText={setItemTitle} placeholder="Task name" />
            <AppInput label="Requirements" value={requirements} onChangeText={setRequirements} placeholder="What needs to be done?" multiline />
            <AppInput label="Deadline" value={deadline} onChangeText={setDeadline} placeholder="YYYY-MM-DD" />
            <PrimaryButton title="Attach File" onPress={handleAttachment} variant="secondary" />
            {attachmentUrl ? <Text style={{ color: colors.success, fontFamily: Typography.fontFamily, fontSize: Typography.sizes.sm }}>✓ Attachment added</Text> : null}
            <PrimaryButton title="Add Item" onPress={handleAddItem} loading={saving} style={{ marginTop: Spacing.md }} />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  addBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingTop: 60, gap: Spacing.md },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.xl, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base, gap: Spacing.sm },
  sectionDot: { width: 12, height: 12, borderRadius: 6 },
  sectionName: { flex: 1, fontFamily: Typography.fontFamily, fontSize: Typography.sizes.lg, fontWeight: '700' },
  itemCount: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.sm },
  itemsBlock: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.base },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, paddingVertical: Spacing.sm, borderTopWidth: 1 },
  itemTitle: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.base, fontWeight: '600' },
  itemReq: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.sm, marginTop: 2 },
  itemDeadline: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.xs, marginTop: 2 },
  addItemBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingVertical: Spacing.sm },
  addItemText: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.sm, fontWeight: '600' },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, padding: Spacing.xl, maxHeight: '85%' },
  sheetTitle: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.xl, fontWeight: '700', marginBottom: Spacing.lg },
  fieldLabel: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.sm, fontWeight: '600', marginBottom: Spacing.sm },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorSelected: { borderWidth: 3, borderColor: '#fff', transform: [{ scale: 1.15 }] },
});
