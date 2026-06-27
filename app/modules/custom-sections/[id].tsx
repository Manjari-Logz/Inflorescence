import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Modal, KeyboardAvoidingView, Platform, ActivityIndicator, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckSquare, Square, Paperclip, X, Folder } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useAlert } from '@/hooks/useAlert';
import { useCustomSections } from '@/hooks/useModules';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Typography, Spacing, Radius } from '@/constants/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import { AppInput } from '@/components/ui/AppInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { pickDocument, uploadFile } from '@/services/storageService';

export default function CustomSectionDetailScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { sections, loading, addItem, updateItem, removeItem } = useCustomSections();
  
  const [itemModal, setItemModal] = useState(false);
  const [itemTitle, setItemTitle] = useState('');
  const [requirements, setRequirements] = useState('');
  const [deadline, setDeadline] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const section = sections.find(s => s.id === id);

  const handleAddItem = async () => {
    if (!itemTitle.trim() || !id) return;
    setSaving(true);
    try {
      await addItem(id as string, {
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

  if (loading) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <StatusBar barStyle={colors.text === '#F1F5F9' ? 'light-content' : 'dark-content'} />
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      </View>
    );
  }

  if (!section) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <StatusBar barStyle={colors.text === '#F1F5F9' ? 'light-content' : 'dark-content'} />
        <ScreenHeader
          title="Section Not Found"
          showBack={true}
        />
        <View style={styles.empty}>
          <Folder size={52} color={colors.textDim} strokeWidth={1.5} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Section not found</Text>
          <Text style={[styles.emptySub, { color: colors.textMuted }]}>This section may have been deleted</Text>
          <PrimaryButton title="Go Back" onPress={() => router.back()} style={{ marginTop: Spacing.md }} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <StatusBar barStyle={colors.text === '#F1F5F9' ? 'light-content' : 'dark-content'} />
      <ScreenHeader
        title={section.name}
        subtitle={`${section.items?.length ?? 0} items`}
        showBack={true}
      />

      <ScrollView contentContainerStyle={{ padding: Spacing.base, paddingBottom: insets.bottom + 40 }}>
        {section.items && section.items.length > 0 ? (
          section.items.map(item => (
            <GlassCard key={item.id} style={{ backgroundColor: colors.surface, borderColor: colors.border, padding: Spacing.base, marginBottom: Spacing.md }}>
              <View style={styles.itemRow}>
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
            </GlassCard>
          ))
        ) : (
          <View style={styles.empty}>
            <Folder size={52} color={colors.textDim} strokeWidth={1.5} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No items yet</Text>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>Add your first item to this section</Text>
          </View>
        )}

        <PrimaryButton title="Add Item" onPress={() => setItemModal(true)} style={{ marginTop: Spacing.md }} />
      </ScrollView>

      {/* Add Item Modal */}
      <Modal visible={itemModal} transparent animationType="slide" onRequestClose={() => setItemModal(false)}>
        <KeyboardAvoidingView style={[styles.overlay, { backgroundColor: colors.overlay }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setItemModal(false)} />
          <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border, paddingBottom: insets.bottom + 16 }]}>
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
  empty: { alignItems: 'center', paddingTop: 60, gap: Spacing.md },
  emptyTitle: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold },
  emptySub: { fontSize: Typography.sizes.base, textAlign: 'center' },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  itemTitle: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.semibold },
  itemReq: { fontSize: Typography.sizes.sm, marginTop: 2 },
  itemDeadline: { fontSize: Typography.sizes.xs, marginTop: 2 },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, borderWidth: 1, padding: Spacing.xl, maxHeight: '85%' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  sheetTitle: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold },
  attachedText: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.medium, marginTop: Spacing.xs },
});
