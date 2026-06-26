import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput,
  KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useNotes } from '@/hooks/useNotes';
import { Typography, Radius, Spacing } from '@/constants/theme';

interface NoteEditorModalProps {
  noteId?: string | null;
  parentType: string;
  parentId: string;
  onSave: (title: string, content?: string) => void;
  onCancel: () => void;
}

export default function NoteEditorModal({ noteId, parentType, parentId, onSave, onCancel }: NoteEditorModalProps) {
  const { colors: Colors } = useAppTheme();
  const { notes } = useNotes();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (noteId) {
      const existing = notes.find((n: any) => n.id === noteId);
      if (existing) {
        setTitle(existing.title || '');
        setContent(existing.content || '');
      }
    } else {
      setTitle('');
      setContent('');
    }
  }, [noteId, notes]);

  const handleSave = () => {
    if (!title.trim()) return;
    onSave(title.trim(), content.trim() || undefined);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.overlay}
    >
      <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
      <View style={[styles.container, { backgroundColor: Colors.surface, borderColor: Colors.border }]}>
        <View style={styles.header}>
          <Text style={[styles.modalTitle, { color: Colors.text }]}>
            {noteId ? 'Edit Note' : 'Add Note'}
          </Text>
          <Pressable onPress={onCancel} style={styles.closeBtn} hitSlop={10}>
            <Text style={{ color: Colors.textSecondary, fontSize: 18 }}>×</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.scrollBody} keyboardShouldPersistTaps="handled">
          <Text style={[styles.inputLabel, { color: Colors.textSecondary }]}>Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Note title..."
            placeholderTextColor={Colors.textDim}
            style={[styles.input, { color: Colors.text, borderColor: Colors.border, backgroundColor: Colors.surfaceLight }]}
          />

          <Text style={[styles.inputLabel, { color: Colors.textSecondary, marginTop: Spacing.sm }]}>Content</Text>
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="Type your notes here..."
            placeholderTextColor={Colors.textDim}
            multiline
            numberOfLines={6}
            style={[
              styles.input,
              styles.contentInput,
              { color: Colors.text, borderColor: Colors.border, backgroundColor: Colors.surfaceLight }
            ]}
          />
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: Colors.borderLight }]}>
          <Pressable
            style={[styles.btn, styles.cancelBtn, { borderColor: Colors.border }]}
            onPress={onCancel}
          >
            <Text style={{ color: Colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
          </Pressable>
          <Pressable
            style={[
              styles.btn,
              styles.saveBtn,
              { backgroundColor: title.trim() ? Colors.accent : Colors.textDim }
            ]}
            onPress={handleSave}
            disabled={!title.trim()}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>Save</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  container: {
    width: '100%',
    maxWidth: 380,
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    paddingHorizontal: 8,
  },
  scrollBody: {
    maxHeight: 300,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    fontSize: 14,
  },
  contentInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    borderTopWidth: 1,
    paddingTop: Spacing.sm,
    marginTop: Spacing.md,
  },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    borderWidth: 1,
  },
  saveBtn: {
    minWidth: 80,
  },
});
