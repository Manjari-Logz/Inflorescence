import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Modal,
  KeyboardAvoidingView, Platform, ActivityIndicator, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Plus, ChevronDown, ChevronUp, Trash2, CheckSquare,
  Square, Paperclip, X, Folder,
} from 'lucide-react-native';
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
    try {
      await addSection(sectionName.trim(), sectionColor, 'folder');
      setSectionModal(false);
      setSectionName('');
    } catch (error) {
      showAlert('Error', 'Failed to create section. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddItem = async () => {
    if (!itemTitle.trim() || !activeSectionId) return;
    setSaving(true);
    try {
      await addItem(activeSectionId, {
        title: itemTitle.trim(),
        requirements: requirements.trim() || undefined,
        deadline: deadline.trim() || undefined,
        attachment_url: attachmentUrl || undefined,
        completed: false,
      });
      setItemModal(false);
      setItemTitle('');
      setRequirements('');
      setDeadline('');
      setAttachmentUrl('');
    } catch (error) {
      showAlert('Error', 'Failed to add item. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAttachment = async () => {
    const doc = await pickDocument(['*/*']);
    if (!doc || !user) return;
    const url = await uploadFile(user.id, 'attachments', doc.uri, doc.name, doc.mimeType ?? undefined);
    if (url) setAttachmentUrl(url);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <StatusBar barStyle={colors.text === '#F1F5F9' ? 'light-content' : 'dark-content'} />
      <ScreenHeader
        title="Custom Sections"
        subtitle="Your personal groups"
        rightAction={
          <Pressable onPress={() => setSectionModal(true)} style={[styles.addBtn, { backgroundColor: colors.accent }]}>
            <Plus size={20} color="#fff" strokeWidth={2.5} />
          </Pressable>
        }
      />

      {loading ? <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} /> : (
        <ScrollView contentContainerStyle={{ padding: Spacing.base, paddingBottom: insets.bottom + 40, gap: Spacing.md }}>
          {sections.length === 0 ? (
            <View style={styles.empty}>
              <Folder size={52} color={colors.textDim} strokeWidth={1.5} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Create custom groups</Text>
              <Text style={[styles.emptySub, { color: colors.textMuted }]}>Organize anything — internships, research, projects</Text>
              <PrimaryButton title="New Section" onPress={() => setSectionModal(true)} style={{ marginTop: Spacing.md }} />
            </View>
          ) : sections.map(section => (
            <GlassCard key={section.id} style={{ backgroundColor: colors.surface, borderColor: colors.border, padding: 0, overflow: 'hidden' }}>
              <Pressable style={styles.sectionHeader} onPress={() => setExpanded(expanded === section.id ? null : section.id)}>
                <View style={[styles.sectionDot, { backgroundColor: section.color }]} />
                <Text style={[styles.sectionName, { color: colors.text }]}>{section.name}</Text>
                <Text style={[styles.itemCount, { color: colors.textMuted }]}>{section.items?.length ?? 0} items</Text>
                <Pressable onPress={() => showAlert('Delete', `Delete "${section.name}"?`, [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => removeSection(section.id) },
                ])} hitSlop={8}>
                  <Trash2 size={16} color={colors.textDim} strokeWidth={2} />
                </Pressable>
                {expanded === section.id
                  ? <ChevronUp size={18} color={colors.textMuted} strokeWidth={2} />
                  : <ChevronDown size={18} color={colors.textMuted} strokeWidth={2} />}
              </Pressable>

              {expanded === section.id && (
                <View style={[styles.itemsBlock, { borderTopColor: colors.border }]}>
                  {(section.items ?? []).map(item => (
                    <View key={item.id} style={[styles.itemRow, { borderTopColor: colors.borderLight }]}>
                      <Pressable onPress={() => updateItem(section.id, item.id, { completed: !item.completed })}>
                        {item.completed
                          ? <CheckSquare size={20} color={colors.accent} strokeWidth={2} />
                          : <Square size={20} color={colors.textDim} strokeWidth={2} />}
                      </Pressable>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.itemTitle, { color: colors.text, textDecorationLine: item.completed ? 'line-through' : 'none' }]}>
                          {item.title}
                        </Text>
                        {item.requirements ? <Text style={[styles.itemReq, { color: colors.textMuted }]} numberOfLines={2}>{item.requirements}</Text> : null}
                        {item.deadline ? <Text style={[styles.itemDeadline, { color: colors.warning }]}>Due {item.deadline}</Text> : null}
                        {item.attachment_url ? <Paperclip size={12} color={colors.accent} strokeWidth={2} style={{ marginTop: 2 }} /> : null}
                      </View>
                      <Pressable onPress={() => removeItem(section.id, item.id)} hitSlop={8}>
                        <X size={14} color={colors.textDim} strokeWidth={2} />
                      </Pressable>
                    </View>
                  ))}
                  <Pressable style={styles.addItemBtn} onPress={() => { setActiveSectionId(section.id); setItemModal(true); }}>
                    <Plus size={14} color={section.color} strokeWidth={2} />
                    <Text style={[styles.addItemText, { color: section.color }]}>Add Item</Text>
                  </Pressable>
                </View>
              )}
            </GlassCard>
          ))}
        </ScrollView>
      )}

      {/* New Section Modal */}
      <Modal visible={sectionModal} transparent animationType="slide" onRequestClose={() => setSectionModal(false)}>
        <KeyboardAvoidingView style={[styles.overlay, { backgroundColor: colors.overlay }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSectionModal(false)} />
          <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border, paddingBottom: insets.bottom + 16 }]}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>New Section</Text>
              <Pressable onPress={() => setSectionModal(false)}><X size={20} color={colors.textMuted} strokeWidth={2} /></Pressable>
            </View>
            <AppInput label="Name *" value={sectionName} onChangeText={setSectionName} placeholder="Internship Tracker, Research Papers..." />
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

      {/* Add Item Modal */}
      <Modal visible={itemModal} transparent animationType="slide" onRequestClose={() => setItemModal(false)}>
        <KeyboardAvoidingView style={[styles.overlay, { backgroundColor: colors.overlay }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setItemModal(false)} />
          <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border, paddingBottom: insets.bottom + 16 }]}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>Add Item</Text>
              <Pressable onPress={() => setItemModal(false)}><X size={20} color={colors.textMuted} strokeWidth={2} /></Pressable>
            </View>
            <AppInput label="Title *" value={itemTitle} onChangeText={setItemTitle} placeholder="Item name" />
            <AppInput label="Requirements / Notes" value={requirements} onChangeText={setRequirements} placeholder="Details..." multiline />
            <AppInput label="Deadline (YYYY-MM-DD)" value={deadline} onChangeText={setDeadline} placeholder="2025-12-31" />
            <PrimaryButton title="Attach File" onPress={handleAttachment} variant="secondary" />
            {attachmentUrl ? <Text style={[styles.attachedText, { color: colors.accent }]}>Attachment added</Text> : null}
            <PrimaryButton title="Add Item" onPress={handleAddItem} loading={saving} style={{ marginTop: Spacing.md }} />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  addBtn: { width: 38, height: 38, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingTop: 60, gap: Spacing.md },
  emptyTitle: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold },
  emptySub: { fontSize: Typography.sizes.base, textAlign: 'center' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base, gap: Spacing.sm },
  sectionDot: { width: 12, height: 12, borderRadius: 6 },
  sectionName: { flex: 1, fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold },
  itemCount: { fontSize: Typography.sizes.sm },
  itemsBlock: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.base, borderTopWidth: 1 },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, paddingVertical: Spacing.sm, borderTopWidth: 1 },
  itemTitle: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.semibold },
  itemReq: { fontSize: Typography.sizes.sm, marginTop: 2 },
  itemDeadline: { fontSize: Typography.sizes.xs, marginTop: 2 },
  addItemBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingTop: Spacing.sm },
  addItemText: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, borderWidth: 1, padding: Spacing.xl, maxHeight: '85%' },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.base },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  sheetTitle: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold },
  fieldLabel: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, marginBottom: Spacing.sm },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorSelected: { borderWidth: 3, borderColor: '#fff', transform: [{ scale: 1.15 }] },
  attachedText: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.medium, marginTop: Spacing.xs },
});
