import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Modal,
  KeyboardAvoidingView, Platform, ActivityIndicator, StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookOpen, Plus, Minus, Edit2, Trash2, Upload, FileText, X, BookMarked } from 'lucide-react-native';
import { useAuth, useAlert } from '@/template';
import { useBooks } from '@/hooks/useModules';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Typography, Spacing, Radius, Colors } from '@/constants/theme';
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
    const input = { title: title.trim(), author: author.trim() || undefined, total_pages: parseInt(totalPages, 10) || 0, current_page: 0, cover_url: coverUrl || undefined, pdf_url: pdfUrl || undefined, status: 'reading' as const };
    if (editId) await updateBook(editId, input);
    else await addBook(input);
    setSaving(false); setModal(false);
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
      if (result.awarded) showAlert('Badge Unlocked!', result.name ?? 'Reader Badge');
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <StatusBar barStyle={colors.text === '#F1F5F9' ? 'light-content' : 'dark-content'} />
      <ScreenHeader title="Books" subtitle={`${stats.total} books · ${stats.pagesRead} pages`} rightAction={
        <Pressable onPress={openAdd} style={[styles.addBtn, { backgroundColor: colors.accent }]}>
          <Plus size={20} color="#fff" strokeWidth={2.5} />
        </Pressable>
      } />

      {/* Stats */}
      <View style={[styles.statsRow, { paddingHorizontal: Spacing.base, marginBottom: Spacing.base }]}>
        {[
          { label: 'Total', value: stats.total, color: colors.accent },
          { label: 'Completed', value: stats.completed, color: Colors.success },
          { label: 'Pages Read', value: stats.pagesRead, color: '#8B5CF6' },
          { label: 'Progress', value: `${stats.progress}%`, color: Colors.warning },
        ].map((s, i) => (
          <GlassCard key={i} style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]} padding={12}>
            <Text style={[styles.statNum, { color: s.color }]}>{s.value}</Text>
            <Text style={[styles.statLbl, { color: colors.textMuted }]}>{s.label}</Text>
          </GlassCard>
        ))}
      </View>

      {loading ? <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} /> : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.base, paddingBottom: insets.bottom + 40, gap: Spacing.md }}>
          {books.length === 0 ? (
            <View style={styles.empty}>
              <BookOpen size={52} color={colors.textDim} strokeWidth={1.5} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No books yet</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>Add books and track your reading progress</Text>
              <PrimaryButton title="Add Your First Book" onPress={openAdd} style={{ marginTop: Spacing.md }} />
            </View>
          ) : books.map(book => {
            const progress = book.total_pages > 0 ? (book.current_page / book.total_pages) * 100 : 0;
            const remaining = book.total_pages > 0 ? book.total_pages - book.current_page : null;
            return (
              <GlassCard key={book.id} style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                <View style={styles.bookRow}>
                  {book.cover_url ? (
                    <Image source={{ uri: book.cover_url }} style={styles.cover} contentFit="cover" />
                  ) : (
                    <View style={[styles.coverPlaceholder, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
                      <BookMarked size={24} color={colors.textDim} strokeWidth={1.5} />
                    </View>
                  )}
                  <View style={styles.bookInfo}>
                    <Text style={[styles.bookTitle, { color: colors.text }]} numberOfLines={2}>{book.title}</Text>
                    {book.author && <Text style={[styles.bookAuthor, { color: colors.textMuted }]}>{book.author}</Text>}
                    <ProgressBar progress={progress} color={colors.accent} height={4} backgroundColor={colors.surfaceLight} />
                    <View style={styles.bookPageRow}>
                      <Text style={[styles.pageText, { color: colors.textSecondary }]}>
                        Page {book.current_page} / {book.total_pages || '?'}
                      </Text>
                      {remaining !== null && <Text style={[styles.remainingText, { color: colors.textMuted }]}>{remaining} left</Text>}
                    </View>
                    <View style={styles.pageControls}>
                      <Pressable onPress={() => handlePageChange(book.id, -1)} style={[styles.pageBtn, { borderColor: colors.border, backgroundColor: colors.surfaceLight }]}>
                        <Minus size={16} color={colors.accent} strokeWidth={2} />
                      </Pressable>
                      <Pressable onPress={() => handlePageChange(book.id, 1)} style={[styles.pageBtn, { borderColor: colors.accent, backgroundColor: colors.accent + '18' }]}>
                        <Plus size={16} color={colors.accent} strokeWidth={2} />
                      </Pressable>
                      <Pressable onPress={() => openEdit(book)} hitSlop={8}>
                        <Edit2 size={16} color={colors.textMuted} strokeWidth={2} />
                      </Pressable>
                      <Pressable onPress={() => showAlert('Delete', `Remove "${book.title}"?`, [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', style: 'destructive', onPress: () => removeBook(book.id) },
                      ])} hitSlop={8}>
                        <Trash2 size={16} color={Colors.error} strokeWidth={2} />
                      </Pressable>
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
          <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border, paddingBottom: insets.bottom + 16 }]}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>{editId ? 'Edit Book' : 'Add Book'}</Text>
              <Pressable onPress={() => setModal(false)}><X size={20} color={colors.textMuted} strokeWidth={2} /></Pressable>
            </View>
            <AppInput label="Title *" value={title} onChangeText={setTitle} placeholder="Book title" />
            <AppInput label="Author" value={author} onChangeText={setAuthor} placeholder="Author name" />
            <AppInput label="Total Pages" value={totalPages} onChangeText={setTotalPages} keyboardType="number-pad" placeholder="300" />
            <View style={styles.uploadRow}>
              <PrimaryButton title={coverUrl ? 'Cover Uploaded' : 'Upload Cover'} onPress={handleCoverUpload} variant={coverUrl ? 'ghost' : 'secondary'} style={{ flex: 1 }} />
              <PrimaryButton title={pdfUrl ? 'PDF Uploaded' : 'Upload PDF'} onPress={handlePdfUpload} variant={pdfUrl ? 'ghost' : 'secondary'} style={{ flex: 1 }} />
            </View>
            <PrimaryButton title={editId ? 'Save Changes' : 'Add Book'} onPress={handleSave} loading={saving} style={{ marginTop: Spacing.md }} />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  addBtn: { width: 38, height: 38, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statCard: { flex: 1, alignItems: 'center', gap: 2 },
  statNum: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold },
  statLbl: { fontSize: Typography.sizes.xs, textAlign: 'center' },
  empty: { alignItems: 'center', paddingTop: 60, gap: Spacing.md },
  emptyTitle: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold },
  emptySubtitle: { fontSize: Typography.sizes.base, textAlign: 'center' },
  bookRow: { flexDirection: 'row', gap: Spacing.md },
  cover: { width: 72, height: 100, borderRadius: Radius.sm },
  coverPlaceholder: { width: 72, height: 100, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  bookInfo: { flex: 1, gap: Spacing.xs },
  bookTitle: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.semibold },
  bookAuthor: { fontSize: Typography.sizes.sm },
  bookPageRow: { flexDirection: 'row', justifyContent: 'space-between' },
  pageText: { fontSize: Typography.sizes.sm },
  remainingText: { fontSize: Typography.sizes.xs },
  pageControls: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  pageBtn: { width: 30, height: 30, borderRadius: Radius.sm, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, borderWidth: 1, padding: Spacing.xl, maxHeight: '85%' },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.base },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  sheetTitle: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold },
  uploadRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
});
