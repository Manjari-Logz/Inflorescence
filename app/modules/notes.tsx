import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Modal,
  KeyboardAvoidingView, Platform, ActivityIndicator, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, Edit2, Trash2, X, FileText, ChevronRight } from 'lucide-react-native';
import Markdown from 'react-native-markdown-display';
import { useAlert } from '@/template';
import { useNotes } from '@/hooks/useNotes';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Typography, Spacing, Radius } from '@/constants/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { AppInput } from '@/components/ui/AppInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { WatercolorBackground } from '@/components/ui/WatercolorBackground';
import { Note } from '@/services/notesService';

export default function NotesScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { notes, loading, addNote, updateNote, deleteNote } = useNotes();
  const { showAlert } = useAlert();

  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreateOrUpdate = async () => {
    if (!title.trim()) {
      showAlert('Required', 'Please enter a note title.');
      return;
    }
    setSaving(true);
    if (selectedNote) {
      await updateNote(selectedNote.id, { title: title.trim(), content: content.trim() });
    } else {
      await addNote(title.trim(), content.trim() || undefined);
    }
    setSaving(false);
    setModalVisible(false);
    resetForm();
  };

  const handleOpenEdit = (note: Note) => {
    setSelectedNote(note);
    setTitle(note.title);
    setContent(note.content ?? '');
    setViewModalVisible(false);
    setModalVisible(true);
  };

  const handleOpenNew = () => {
    setSelectedNote(null);
    setTitle('');
    setContent('');
    setModalVisible(true);
  };

  const handleDelete = (id: string, noteTitle: string) => {
    showAlert('Delete Note', `Are you sure you want to delete "${noteTitle}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
          deleteNote(id);
          setViewModalVisible(false);
        }
      },
    ]);
  };

  const handleOpenView = (note: Note) => {
    setSelectedNote(note);
    setViewModalVisible(true);
  };

  const resetForm = () => {
    setSelectedNote(null);
    setTitle('');
    setContent('');
  };

  return (
    <WatercolorBackground>
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" />
        <ScreenHeader
          title="Daily Notes"
          subtitle="Jot down quick notes & study summaries"
          rightAction={
            <Pressable onPress={handleOpenNew} style={[styles.addBtn, { backgroundColor: colors.accent }]}>
              <Plus size={20} color="#fff" strokeWidth={2.5} />
            </Pressable>
          }
        />

        {loading ? (
          <View style={styles.center}><ActivityIndicator color={colors.accent} size="large" /></View>
        ) : notes.length === 0 ? (
          <View style={styles.empty}>
            <FileText size={52} color={colors.textDim} strokeWidth={1.5} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No notes yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              Keep summaries, code snippets, and checklists here. Supports Markdown formatting.
            </Text>
            <PrimaryButton title="Create Note" onPress={handleOpenNew} style={{ marginTop: Spacing.lg }} />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]}
            showsVerticalScrollIndicator={false}
          >
            {notes.map(note => (
              <GlassCard
                key={note.id}
                style={[styles.noteCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                padding={0}
              >
                <Pressable style={styles.cardPressable} onPress={() => handleOpenView(note)}>
                  <View style={styles.cardHeader}>
                    <Text style={[styles.noteTitle, { color: colors.text }]} numberOfLines={1}>
                      {note.title}
                    </Text>
                    <ChevronRight size={16} color={colors.textDim} strokeWidth={2} />
                  </View>
                  {note.content ? (
                    <Text style={[styles.noteSnippet, { color: colors.textMuted }]} numberOfLines={2}>
                      {note.content.replace(/[#*`_-]/g, '')}
                    </Text>
                  ) : (
                    <Text style={[styles.noteSnippet, { color: colors.textDim, fontStyle: 'italic' }]}>
                      Empty content
                    </Text>
                  )}
                  <Text style={[styles.noteDate, { color: colors.textDim }]}>
                    Updated {new Date(note.updated_at).toLocaleDateString()}
                  </Text>
                </Pressable>
              </GlassCard>
            ))}
          </ScrollView>
        )}

        {/* View Note Modal */}
        <Modal
          visible={viewModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setViewModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setViewModalVisible(false)} />
            <View style={[styles.viewCard, { backgroundColor: colors.surface, borderColor: colors.border, paddingTop: insets.top }]}>
              <View style={styles.viewHeader}>
                <Text style={[styles.viewTitle, { color: colors.text }]} numberOfLines={1}>
                  {selectedNote?.title}
                </Text>
                <View style={styles.viewActions}>
                  <Pressable onPress={() => selectedNote && handleOpenEdit(selectedNote)} hitSlop={8} style={styles.actionBtn}>
                    <Edit2 size={16} color={colors.accent} strokeWidth={2} />
                  </Pressable>
                  <Pressable onPress={() => selectedNote && handleDelete(selectedNote.id, selectedNote.title)} hitSlop={8} style={styles.actionBtn}>
                    <Trash2 size={16} color={colors.error} strokeWidth={2} />
                  </Pressable>
                  <Pressable onPress={() => setViewModalVisible(false)} hitSlop={8} style={styles.actionBtn}>
                    <X size={20} color={colors.textMuted} strokeWidth={2} />
                  </Pressable>
                </View>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.markdownScroll}>
                {selectedNote?.content ? (
                  <Markdown style={{
                    body: { color: colors.text, fontSize: 15, lineHeight: 22 },
                    heading1: { color: colors.text, fontSize: 22, fontWeight: 'bold', marginVertical: 8 },
                    heading2: { color: colors.text, fontSize: 18, fontWeight: 'semibold', marginVertical: 6 },
                    paragraph: { marginVertical: 4 },
                    code_inline: { backgroundColor: colors.surfaceLight, color: colors.accent, padding: 2, borderRadius: 4, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
                    code_block: { backgroundColor: colors.surfaceLight, padding: 8, borderRadius: 8, marginVertical: 8 },
                    fence: { backgroundColor: colors.surfaceLight, padding: 8, borderRadius: 8, marginVertical: 8, color: colors.textSecondary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
                    link: { color: colors.accent },
                  }}>
                    {selectedNote.content}
                  </Markdown>
                ) : (
                  <Text style={[styles.emptyContentTxt, { color: colors.textDim }]}>No content added yet.</Text>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Add/Edit Note Modal (Centered, Glassmorphic Scale/Fade) */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => { setModalVisible(false); resetForm(); }}
        >
          <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => { setModalVisible(false); resetForm(); }} />
            <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {selectedNote ? 'Edit Note' : 'New Note'}
                </Text>
                <Pressable onPress={() => { setModalVisible(false); resetForm(); }} hitSlop={8}>
                  <X size={20} color={colors.textMuted} strokeWidth={2} />
                </Pressable>
              </View>

              <AppInput
                label="Title *"
                placeholder="e.g. Project Specs, Exam Summary..."
                value={title}
                onChangeText={setTitle}
              />

              <AppInput
                label="Content (Supports Markdown)"
                placeholder="Write your note contents here... Use # for headings, - for lists, `code` for code snippets."
                value={content}
                onChangeText={setContent}
                multiline
                numberOfLines={8}
                style={styles.contentInput}
              />

              <PrimaryButton
                title={selectedNote ? 'Save Changes' : 'Create Note'}
                onPress={handleCreateOrUpdate}
                loading={saving}
                style={{ marginTop: Spacing.md }}
              />
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </WatercolorBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  addBtn: { width: 38, height: 38, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xxl, gap: Spacing.md },
  emptyTitle: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, textAlign: 'center' },
  emptySubtitle: { fontSize: Typography.sizes.base, textAlign: 'center' },
  list: { padding: Spacing.base, gap: Spacing.md },
  noteCard: { borderRadius: Radius.lg, borderWidth: 1, overflow: 'hidden' },
  cardPressable: { padding: Spacing.base },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  noteTitle: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold, flex: 1, marginRight: Spacing.sm },
  noteSnippet: { fontSize: Typography.sizes.sm, marginBottom: 8, lineHeight: 18 },
  noteDate: { fontSize: Typography.sizes.xs },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(3, 10, 22, 0.75)', padding: Spacing.xl },
  modalCard: { width: '100%', borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.xl, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  modalTitle: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold },
  contentInput: { minHeight: 120, textAlignVertical: 'top' },
  viewCard: { width: '100%', height: '90%', borderRadius: Radius.xl, borderWidth: 1, overflow: 'hidden', paddingHorizontal: Spacing.xl },
  viewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.08)' },
  viewTitle: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, flex: 1, marginRight: Spacing.sm },
  viewActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  actionBtn: { padding: 4 },
  markdownScroll: { paddingVertical: Spacing.md },
  emptyContentTxt: { fontSize: Typography.sizes.base, fontStyle: 'italic' },
});
