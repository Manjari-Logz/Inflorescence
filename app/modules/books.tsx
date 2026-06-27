import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Modal,
  KeyboardAvoidingView, Platform, ActivityIndicator, StatusBar, TextInput, Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookOpen, Plus, Edit2, Trash2, X, BookMarked, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useAlert } from '@/hooks/useAlert';
import { useBooks } from '@/hooks/useModules';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Typography, Spacing, Radius, Colors } from '@/constants/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import { AppInput } from '@/components/ui/AppInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { pickImage, uploadFile } from '@/services/storageService';
import { booksService, Book } from '@/services/booksService';
import { badgesService } from '@/services/badgesService';

const GENRES = ['Fiction', 'Non-Fiction', 'Science', 'Technology', 'History', 'Biography', 'Self-Help', 'Philosophy', 'Other'];
const STATUS_COLORS: Record<string, string> = { reading: Colors.accent ?? '#3B82F6', completed: '#22C55E', paused: '#F59E0B' };

export default function BooksScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const { books, loading, addBook, updateBook, removeBook } = useBooks();
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [genre, setGenre] = useState('Other');
  const [totalPages, setTotalPages] = useState('');
  const [startDate, setStartDate] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [inlineEditId, setInlineEditId] = useState<string | null>(null);
  const [inlinePageVal, setInlinePageVal] = useState('');

  const stats = booksService.getReadingStats(books);

  const openAdd = () => {
    setEditId(null); setTitle(''); setAuthor(''); setGenre('Other'); setTotalPages('');
    setStartDate(new Date().toISOString().split('T')[0]); setTargetDate(''); setCoverUrl('');
    setModal(true);
  };

  const openEdit = (book: Book) => {
    setEditId(book.id); setTitle(book.title); setAuthor(book.author ?? '');
    setGenre((book as any).genre ?? 'Other'); setTotalPages(String(book.total_pages));
    setStartDate((book as any).start_date ?? ''); setTargetDate((book as any).target_date ?? '');
    setCoverUrl(book.cover_url ?? ''); setModal(true);
  };

  const handleSave = async () => {
    if (!title.trim()) { showAlert('Required', 'Enter book title.'); return; }
    setSaving(true);
    const input: any = {
      title: title.trim(),
      author: author.trim() || undefined,
      genre: genre,
      total_pages: parseInt(totalPages, 10) || 0,
      cover_url: coverUrl || undefined,
      start_date: startDate || undefined,
      target_date: targetDate || undefined,
      status: 'reading' as const,
    };
    if (editId) {
      await updateBook(editId, input);
    } else {
      await addBook({ ...input, current_page: 0 });
    }
    setSaving(false); setModal(false);
  };

  const handleCoverUpload = async () => {
    const asset = await pickImage();
    if (!asset || !user) return;
    const url = await uploadFile(user.id, 'covers', asset.uri, asset.fileName ?? 'cover.jpg', asset.mimeType);
    if (url) setCoverUrl(url);
  };

  const handleInlinePageSave = async (book: Book) => {
    const newPage = parseInt(inlinePageVal, 10);
    if (isNaN(newPage) || newPage < 0) return;
    const clamped = Math.min(newPage, book.total_pages || 99999);
    const status = clamped >= book.total_pages && book.total_pages > 0 ? 'completed' : book.status;
    await updateBook(book.id, { current_page: clamped, status });
    if (status === 'completed' && user) {
      const completed = books.filter(b => b.status === 'completed').length + 1;
      const result = await badgesService.checkReadingBadge(user.id, completed);
      if (result.awarded && 'name' in result) showAlert('Badge Unlocked!', result.name ?? 'Reader Badge');
    }
    setInlineEditId(null);
  };

  const getDaysRemaining = (book: Book) => {
    const target = (book as any).target_date;
    if (!target) return null;
    const days = Math.ceil((new Date(target).getTime() - Date.now()) / 86400000);
    return days;
  };

  const getEstCompletion = (book: Book) => {
    if (book.total_pages <= 0 || book.current_page <= 0) return null;
    const startD = (book as any).start_date ? new Date((book as any).start_date) : new Date(book.created_at);
    const elapsed = Math.max(1, Math.ceil((Date.now() - startD.getTime()) / 86400000));
    const pagesPerDay = book.current_page / elapsed;
    if (pagesPerDay <= 0) return null;
    const daysLeft = Math.ceil((book.total_pages - book.current_page) / pagesPerDay);
    const est = new Date();
    est.setDate(est.getDate() + daysLeft);
    return est.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <StatusBar barStyle={colors.text === '#F1F5F9' ? 'light-content' : 'dark-content'} />
      <ScreenHeader title="Books" subtitle={`${stats.total} books · ${stats.pagesRead.toLocaleString()} pages`} rightAction={
        <Pressable onPress={openAdd} style={[styles.addBtn, { backgroundColor: colors.accent }]}>
          <Plus size={20} color="#fff" strokeWidth={2.5} />
        </Pressable>
      } />

      {/* Stats */}
      <View style={[styles.statsRow, { paddingHorizontal: Spacing.base, marginBottom: Spacing.base }]}>
        {[
          { label: 'Total', value: stats.total, color: colors.accent },
          { label: 'Done', value: stats.completed, color: Colors.success },
          { label: 'Pages', value: stats.pagesRead, color: '#8B5CF6' },
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
            const daysLeft = getDaysRemaining(book);
            const estCompletion = getEstCompletion(book);
            const isInlineEdit = inlineEditId === book.id;
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
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.xs }}>
                      <Text style={[styles.bookTitle, { color: colors.text, flex: 1 }]} numberOfLines={2}>{book.title}</Text>
                      <View style={[styles.statusBadge, { borderColor: STATUS_COLORS[book.status] }]}>
                        <Text style={[styles.statusText, { color: STATUS_COLORS[book.status] }]}>{book.status}</Text>
                      </View>
                    </View>
                    {book.author && <Text style={[styles.bookAuthor, { color: colors.textMuted }]}>{book.author}</Text>}
                    {(book as any).genre && <Text style={[styles.genreText, { color: colors.textDim }]}>{(book as any).genre}</Text>}

                    <ProgressBar progress={progress} color={book.status === 'completed' ? Colors.success : colors.accent} height={4} backgroundColor={colors.surfaceLight} />

                    {/* Page Controls */}
                    <View style={styles.pageRow}>
                      {isInlineEdit ? (
                        <View style={styles.inlineEdit}>
                          <TextInput
                            style={[styles.inlineInput, { color: colors.text, borderColor: colors.accent, backgroundColor: colors.surfaceLight }]}
                            value={inlinePageVal}
                            onChangeText={setInlinePageVal}
                            keyboardType="number-pad"
                            autoFocus
                            placeholder={String(book.current_page)}
                            placeholderTextColor={colors.textDim}
                          />
                          <Pressable style={[styles.inlineSave, { backgroundColor: colors.accent }]} onPress={() => handleInlinePageSave(book)}>
                            <Text style={styles.inlineSaveText}>Set</Text>
                          </Pressable>
                          <Pressable onPress={() => setInlineEditId(null)} hitSlop={8}>
                            <X size={16} color={colors.textDim} strokeWidth={2} />
                          </Pressable>
                        </View>
                      ) : (
                        <Pressable onPress={() => { setInlineEditId(book.id); setInlinePageVal(String(book.current_page)); }}>
                          <Text style={[styles.pageText, { color: colors.accent }]}>
                            Page {book.current_page} / {book.total_pages || '?'}
                          </Text>
                        </Pressable>
                      )}
                      {remaining !== null && !isInlineEdit && (
                        <Text style={[styles.remainingText, { color: colors.textMuted }]}>{remaining} left</Text>
                      )}
                    </View>

                    {estCompletion && (
                      <Text style={[styles.estText, { color: colors.textDim }]}>Est. finish: {estCompletion}</Text>
                    )}
                    {daysLeft !== null && (
                      <Text style={[styles.estText, { color: daysLeft < 0 ? Colors.error : daysLeft <= 7 ? Colors.warning : colors.textDim }]}>
                        Target: {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                      </Text>
                    )}

                    <View style={styles.bookActions}>
                      <Pressable onPress={() => openEdit(book)} hitSlop={8}>
                        <Edit2 size={15} color={colors.textMuted} strokeWidth={2} />
                      </Pressable>
                      {book.status !== 'completed' && (
                        <Pressable onPress={() => updateBook(book.id, { status: 'completed', current_page: book.total_pages })} hitSlop={8}>
                          <Text style={[styles.markDoneText, { color: Colors.success }]}>Mark Done</Text>
                        </Pressable>
                      )}
                      {book.status === 'reading' && (
                        <Pressable onPress={() => updateBook(book.id, { status: 'paused' })} hitSlop={8}>
                          <Text style={[styles.markDoneText, { color: Colors.warning }]}>Pause</Text>
                        </Pressable>
                      )}
                      <Pressable onPress={() => Alert.alert('Delete', `Remove "${book.title}"?`, [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', style: 'destructive', onPress: () => removeBook(book.id) },
                      ])} hitSlop={8}>
                        <Trash2 size={15} color={Colors.error} strokeWidth={2} />
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
            <ScrollView showsVerticalScrollIndicator={false}>
              <AppInput label="Title *" value={title} onChangeText={setTitle} placeholder="Book title" />
              <AppInput label="Author" value={author} onChangeText={setAuthor} placeholder="Author name" />
              <AppInput label="Total Pages" value={totalPages} onChangeText={setTotalPages} keyboardType="number-pad" placeholder="300" />
              <AppInput label="Start Date (YYYY-MM-DD)" value={startDate} onChangeText={setStartDate} placeholder="2025-01-01" />
              <AppInput label="Target Date (YYYY-MM-DD)" value={targetDate} onChangeText={setTargetDate} placeholder="2025-03-01" />
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Genre</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.base }}>
                <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                  {GENRES.map(g => (
                    <Pressable key={g} style={[styles.chip, { borderColor: genre === g ? colors.accent : colors.border, backgroundColor: genre === g ? colors.accent + '18' : colors.surfaceLight }]} onPress={() => setGenre(g)}>
                      <Text style={[styles.chipText, { color: genre === g ? colors.accent : colors.textMuted }]}>{g}</Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
              <PrimaryButton title={coverUrl ? 'Cover Uploaded' : 'Upload Cover'} onPress={handleCoverUpload} variant={coverUrl ? 'ghost' : 'secondary'} />
              <PrimaryButton title={editId ? 'Save Changes' : 'Add Book'} onPress={handleSave} loading={saving} style={{ marginTop: Spacing.md }} />
            </ScrollView>
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
  genreText: { fontSize: Typography.sizes.xs },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.full, borderWidth: 1 },
  statusText: { fontSize: 10, fontWeight: '700' },
  pageRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pageText: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, textDecorationLine: 'underline' },
  remainingText: { fontSize: Typography.sizes.xs },
  estText: { fontSize: Typography.sizes.xs },
  inlineEdit: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flex: 1 },
  inlineInput: { borderWidth: 1, borderRadius: Radius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 4, fontSize: Typography.sizes.sm, width: 60 },
  inlineSave: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.sm },
  inlineSaveText: { color: '#fff', fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold },
  bookActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginTop: 4 },
  markDoneText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.semibold },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, borderWidth: 1, padding: Spacing.xl, maxHeight: '90%' },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.base },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  sheetTitle: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold },
  fieldLabel: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, marginBottom: Spacing.sm },
  chip: { paddingHorizontal: Spacing.md, paddingVertical: 7, borderRadius: Radius.full, borderWidth: 1 },
  chipText: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold },
});
