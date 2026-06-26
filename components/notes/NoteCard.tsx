// components/notes/NoteCard.tsx
import React, { useCallback, memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Note } from '@/services/notesService';
import { MoreHorizontal, Pin, Calendar, Tag } from 'lucide-react-native';
import { Colors, Typography, Radius, Shadows, Spacing } from '@/constants/theme';

interface NoteCardProps {
  note: Note;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onTogglePin?: () => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onPress, onEdit, onDelete, onTogglePin }) => {
  const handleLongPress = useCallback(() => {
    // Simplified: just call edit if available
    if (onEdit) {
      onEdit();
    }
  }, [onEdit]);

  const title = note.title?.trim() ? note.title : 'Untitled Note';
  const contentPreview = note.content?.trim()
    ? note.content
    : 'No content';

  const formattedDate = new Date(note.updated_at || note.created_at).toLocaleDateString();

  const renderTags = () => {
    if (!note.tags?.length) return null;
    const visible = note.tags.slice(0, 3);
    const remaining = note.tags.length - visible.length;
    return (
      <View style={styles.tagsContainer}>
        {visible.map(tag => (
          <View key={tag} style={[styles.tagChip, { backgroundColor: Colors.surfaceLight }]}>
            <Tag size={12} color={Colors.textSecondary} />
            <Text style={[styles.tagText, { color: Colors.text }]}>{tag}</Text>
          </View>
        ))}
        {remaining > 0 && (
          <View style={[styles.tagChip, { backgroundColor: Colors.surfaceLight }]}>
            <Text style={[styles.tagText, { color: Colors.text }]}>{`+${remaining}`}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: Colors.glass, borderColor: Colors.borderLight, borderRadius: Radius.md, ...Shadows.card },
        pressed && { opacity: 0.9 },
      ]}
      onPress={onPress}
      onLongPress={handleLongPress}
      accessibilityRole="button"
      accessibilityLabel={`Note card, ${title}`}
      accessibilityHint="Tap to open, long press for actions"
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          {note.pinned && <Pin size={16} color={Colors.accent} style={styles.icon} />}
          <Text style={[styles.title, { color: Colors.text }]} numberOfLines={1}>
            {title}
          </Text>
          {note.parent_type && (
            <View style={styles.parentBadge}>
              <Text style={styles.parentBadgeText}>{note.parent_type}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={handleLongPress} style={styles.menuButton} accessibilityLabel="More options">
          <MoreHorizontal size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>
      {/* Body */}
      <Text style={[styles.content, { color: Colors.textSecondary }]} numberOfLines={3} ellipsizeMode="tail">
        {contentPreview}
      </Text>
      {/* Tags */}
      {renderTags()}
      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          {note.color && <View style={[styles.colorDot, { backgroundColor: note.color }]} />}
          <Calendar size={14} color={Colors.textSecondary} style={styles.icon} />
          <Text style={[styles.date, { color: Colors.textSecondary }]}>{formattedDate}</Text>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: Spacing.md,
    marginVertical: Spacing.sm,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  parentBadge: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    marginLeft: Spacing.xs,
  },
  parentBadgeText: {
    color: Colors.text,
    fontSize: Typography.sizes.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.xs,
  },
  title: {
    fontWeight: Typography.weights.semibold,
    fontSize: Typography.sizes.md,
  },
  menuButton: {
    padding: Spacing.xs,
  },
  content: {
    fontSize: Typography.sizes.sm,
    lineHeight: 20,
    marginBottom: Spacing.xs,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.xs,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    marginRight: Spacing.xs,
    marginBottom: 2,
  },
  tagText: {
    marginLeft: 2,
    fontSize: Typography.sizes.xs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: Spacing.xs,
  },
  date: {
    fontSize: Typography.sizes.xs,
  },
  icon: {
    marginRight: Spacing.xs / 2,
  },
});

export default memo(NoteCard);
