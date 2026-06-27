import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Modal } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useNotes } from '@/hooks/useNotes';
import { Typography, Radius, Shadows } from '@/constants/theme';
import NoteCard from './NoteCard';
import NoteEditorModal from './NoteEditorModal';

interface NotesSectionProps {
  /**
   * The type of the parent entity that owns the notes, e.g. 'task', 'subject', etc.
   */
  parentType: string;
  /**
   * The ID of the parent entity.
   */
  parentId: string;
}

export default function NotesSection({ parentType, parentId }: NotesSectionProps) {
  const { notes, addNote, filterNotes } = useNotes();
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const { colors: Colors } = useAppTheme();

  const relevantNotes = useMemo(() => {
    return filterNotes({ parentType });
  }, [parentType, filterNotes]);

  const openEditor = (noteId: string | null = null) => {
    setEditingNoteId(noteId);
    setEditorVisible(true);
  };

  const closeEditor = () => {
    setEditorVisible(false);
    setEditingNoteId(null);
  };

  const handleSave = async (title: string, content?: string) => {
    if (editingNoteId) {
      // update existing note
      await addNote(title, content, { parent_type: parentType, parent_id: parentId });
    } else {
      // create new note
      await addNote(title, content, { parent_type: parentType, parent_id: parentId });
    }
    closeEditor();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: Colors.text, fontFamily: Typography.fontFamily, fontSize: Typography.sizes.lg, fontWeight: Typography.weights.semibold as any }]}>Notes</Text>
        <TouchableOpacity onPress={() => openEditor()} style={[styles.addButton, { backgroundColor: Colors.surfaceLight, borderRadius: Radius.sm, ...Shadows.card }]}>
          <Text style={{ color: Colors.text, fontWeight: '600' }}>+ Add</Text>
        </TouchableOpacity>
      </View>
      {relevantNotes.length === 0 ? (
        <Text style={{ color: Colors.textSecondary, marginTop: 8 }}>No notes yet.</Text>
      ) : (
        <FlatList
          data={relevantNotes}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <NoteCard note={item} onPress={() => openEditor(item.id)} />
          )}
          contentContainerStyle={{ paddingVertical: 8 }}
        />
      )}
      <Modal visible={editorVisible} transparent animationType="slide" onRequestClose={closeEditor}>
        <NoteEditorModal
          noteId={editingNoteId}
          parentType={parentType}
          parentId={parentId}
          onSave={handleSave}
          onCancel={closeEditor}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    // will be styled via theme
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
});
