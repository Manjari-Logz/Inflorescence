import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Modal,
  KeyboardAvoidingView, Platform, ActivityIndicator, StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth, useAlert } from '@/template';
import { useBooks } from '@/hooks/useModules';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Typography, Spacing, Radius } from '@/constants/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import { AppInput } from '@/components/ui/AppInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { pickDocument, pickImage, uploadFile } from '@/services/storageService';
import { booksService } from '@/services/booksService';
import { badgesService } from '@/services/badgesService';

export default function BooksScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const { books, loading, addBook, updateBook, removeBook, updatePage } = useBooks();
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [totalPages, setTotalPages] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const stats = booksService.getReadingStats(books);

  const openAdd = () => {
    setEditId(null); setTitle(''); setAuthor(''); setTotalPages(''); setCoverUrl(''); setPdfUrl('');
    setModal(true);
  };

  const openEdit = (book: typeof books[0]) => {
    setEditId(book.id); setTitle(book.title); setAuthor(book.author ?? '');
    setTotalPages(String(book.total_pages)); setCoverUrl(book.cover_url ?? ''); setPdfUrl(book.pdf_url ?? '');
    setModal(true);
  };

  const handleSave = async () => {
    if (!title.trim()) { showAlert('Required', 'Enter book title.'); return; }
    setSaving(true);
    const input = {
      title: title.trim(),
      author: author.trim() || undefined,
      total_pages: parseInt(totalPages, 10) || 0,
      current_page: 0,
      cover_url: coverUrl || undefined,
      pdf_url: pdfUrl || undefined,
      status: 'reading' as const,
    };
    if (editId) {
      await updateBook(editId, input);
    } else {
      await addBook(input);
    }
    setSaving(false);
    setModal(false);
  };

  const handleCoverUpload = async () => {
    const asset = await pickImage();
    if (!asset || !user) return;
    const url = await uploadFile(user.id, 'covers', asset.uri, asset.fileName ?? 'cover.jpg', asset.mimeType);
    if (url) setCoverUrl(url);
  };

  const handlePdfUpload = async () => {
    const doc = await pickDocument(['application/pdf']);
    if (!doc || !user) return;
    const url = await uploadFile(user.id, 'books', doc.uri, doc.name, doc.mimeType ?? 'application/pdf');
    if (url) setPdfUrl(url);
  };

  const handlePageChange = async (id: string, delta: number) => {
    await updatePage(id, delta);
    const book = books.find(b => b.id === id);
    if (book && book.current_page + delta >= book.total_pages && book.total_pages > 0 && user) {
      const completed = books.filter(b => b.status === 'completed').length + 1;
      const result = await badgesService.checkReadingBadge(user.id, completed);
      if (result.awarded) showAlert('📖 Badge Unlocked!', result.name ?? 'Reader Badge');
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <StatusBar barStyle={colors.text === '#FFFFFF' ? 'light-content' : 'dark-content'} />
      <ScreenHeader title="Books" subtitle={`${stats.total} books · ${stats.pagesRead} pages read`} rightAction={
        <Pressable onPress={openAdd} style={[styles.addBtn, { backgroundColor: colors.primary }]}>
          <MaterialIcons name="add" size={24} color="#fff" />
        </Pressable>
      } />

      <GlassCard style={[styles.statsCard, { backgroundColor: colors.glass, borderColor: colors.border }]}>
        <Text style={[styles.statsTitle, { color: colors.text }]}>Reading Analytics</Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}><Text style={[styles.statNum, { color: colors.accent }]}>{stats.completed}</Text><Text style={[styles.statLbl, { color: colors.textMuted }]}>Completed</Text></View>
          <View style={styles.stat}><Text style={[styles.statNum, { color: colors.accent }]}>{stats.pagesRead}</Text><Text style={[styles.statLbl, { color: colors.textMuted }]}>Pages Read</Text></View>
          <View style={styles.stat}><Text style={[styles.statNum, { color: colors.accent }]}>{stats.progress}%</Text><Text style={[styles.statLbl, { color: colors.textMuted }]}>Progress</Text></View>
        </View>
        <ProgressBar progress={stats.progress} color={colors.accent} height={6} />
      </GlassCard>

      {loading ? <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} /> : (
        <ScrollView contentContainerStyle={{ padding: Spacing.base, paddingBottom: insets.bottom + 40, gap: Spacing.md }}>
          {books.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📚</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No books yet</Text>
              <PrimaryButton title="Add Your First Book" onPress={openAdd} />
            </View>
          ) : books.map(book => {
            const progress = book.total_pages > 0 ? (book.current_page / book.total_pages) * 100 : 0;
            return (
              <GlassCard key={book.id} style={{ backgroundColor: colors.glass, borderColor: colors.border }}>
                <View style={styles.bookRow}>
                  {book.cover_url ? (
                    <Image source={{ uri: book.cover_url }} style={styles.cover} contentFit="cover" />
                  ) : (
                    <View style={[styles.coverPlaceholder, { backgroundColor: colors.surfaceLight }]}>
                      <Text style={{ fontSize: 28 }}>📖</Text>
                    </View>
                  )}
                  <View style={styles.bookInfo}>
                    <Text style={[styles.bookTitle, { color: colors.text }]} numberOfLines={2}>{book.title}</Text>
                    {book.author ? <Text style={[styles.bookAuthor, { color: colors.textMuted }]}>{book.author}</Text> : null}
                    <ProgressBar progress={progress} color={colors.accent} height={4} />
                    <Text style={[styles.pageText, { color: colors.textSecondary }]}>
                      Page {book.current_page} / {book.total_pages || '?'}
                    </Text>
                    <View style={styles.pageControls}>
                      <Pressable onPress={() => handlePageChange(book.id, -1)} style={[styles.pageBtn, { borderColor: colors.border }]}>
                        <MaterialIcons name="remove" size={20} color={colors.accent} />
                      </Pressable>
                      <Pressable onPress={() => handlePageChange(book.id, 1)} style={[styles.pageBtn, { borderColor: colors.border }]}>
                        <MaterialIcons name="add" size={20} color={colors.accent} />
                      </Pressable>
                      <Pressable onPress={() => openEdit(book)} hitSlop={8}><MaterialIcons name="edit" size={18} color={colors.textMuted} /></Pressable>
                      <Pressable onPress={() => showAlert('Delete', `Remove "${book.title}"?`, [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', style: 'destructive', onPress: () => removeBook(book.id) },
                      ])} hitSlop={8}><MaterialIcons name="delete-outline" size={18} color={colors.error} /></Pressable>
                    </View>
                  </View>
                </View>
              </GlassCard>
            );
          })}
        </ScrollView>
      )}

      <Modal visible={modal} transparent animationType="slide" onRequestClose={() => setModal(false)}>
        <KeyboardAvoidingView style={[styles.overlay, { backgroundColor: colors.overlay }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setModal(false)} />
          <View style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 16 }]}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>{editId ? 'Edit Book' : 'Add Book'}</Text>
            <AppInput label="Title *" value={title} onChangeText={setTitle} placeholder="Book title" />
            <AppInput label="Author" value={author} onChangeText={setAuthor} placeholder="Author name" />
            <AppInput label="Total Pages" value={totalPages} onChangeText={setTotalPages} keyboardType="number-pad" placeholder="300" />
            <View style={styles.uploadRow}>
              <PrimaryButton title="Upload Cover" onPress={handleCoverUpload} variant="secondary" style={{ flex: 1 }} />
              <PrimaryButton title="Upload PDF" onPress={handlePdfUpload} variant="secondary" style={{ flex: 1 }} />
            </View>
            {coverUrl ? <Text style={[styles.uploadHint, { color: colors.success }]}>✓ Cover uploaded</Text> : null}
            {pdfUrl ? <Text style={[styles.uploadHint, { color: colors.success }]}>✓ PDF uploaded</Text> : null}
            <PrimaryButton title={editId ? 'Save Changes' : 'Add Book'} onPress={handleSave} loading={saving} style={{ marginTop: Spacing.md }} />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  addBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  statsCard: { marginHorizontal: Spacing.base, marginBottom: Spacing.md, gap: Spacing.sm },
  statsTitle: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.lg, fontWeight: '700' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  statNum: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.xxl, fontWeight: '700' },
  statLbl: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.xs },
  empty: { alignItems: 'center', paddingTop: 60, gap: Spacing.md },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.xl, fontWeight: '700' },
  bookRow: { flexDirection: 'row', gap: Spacing.md },
  cover: { width: 70, height: 100, borderRadius: Radius.sm },
  coverPlaceholder: { width: 70, height: 100, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  bookInfo: { flex: 1, gap: Spacing.xs },
  bookTitle: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.base, fontWeight: '700' },
  bookAuthor: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.sm },
  pageText: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.sm },
  pageControls: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xs },
  pageBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, padding: Spacing.xl, maxHeight: '85%' },
  sheetTitle: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.xl, fontWeight: '700', marginBottom: Spacing.lg },
  uploadRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  uploadHint: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.sm, marginTop: Spacing.xs },
});
