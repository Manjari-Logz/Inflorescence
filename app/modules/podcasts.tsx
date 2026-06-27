import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Modal,
  KeyboardAvoidingView, Platform, ActivityIndicator, StatusBar, Dimensions, Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '@/hooks/useAlert';
import { usePodcasts } from '@/hooks/useModules';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Typography, Spacing, Radius } from '@/constants/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import { AppInput } from '@/components/ui/AppInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { detectPlatform, getEmbedUrl } from '@/services/podcastService';

const { width } = Dimensions.get('window');

export default function PodcastsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { showAlert } = useAlert();
  const { podcasts, loading, addPodcast, updatePodcast, removePodcast } = usePodcasts();
  const [modal, setModal] = useState(false);
  const [playing, setPlaying] = useState<typeof podcasts[0] | null>(null);
  const [title, setTitle] = useState('');
  const [host, setHost] = useState('');
  const [url, setUrl] = useState('');
  const [duration, setDuration] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) { showAlert('Required', 'Enter podcast title.'); return; }
    setSaving(true);
    const platform = url ? detectPlatform(url) : 'other';
    await addPodcast({
      title: title.trim(),
      host: host.trim() || undefined,
      url: url.trim() || undefined,
      platform,
      duration_minutes: parseInt(duration, 10) || 0,
      playlist_order: podcasts.length,
      completed: false,
    });
    setSaving(false);
    setModal(false);
    setTitle(''); setHost(''); setUrl(''); setDuration('');
  };

  const embedUrl = playing ? getEmbedUrl(playing.url ?? '', playing.platform) : null;

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <StatusBar barStyle={colors.text === '#FFFFFF' ? 'light-content' : 'dark-content'} />
      <ScreenHeader title="Podcasts" subtitle="Spotify-style playlist" rightAction={
        <Pressable onPress={() => setModal(true)} style={[styles.addBtn, { backgroundColor: '#1DB954' }]}>
          <MaterialIcons name="add" size={24} color="#fff" />
        </Pressable>
      } />

      {loading ? <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} /> : (
        <ScrollView contentContainerStyle={{ padding: Spacing.base, paddingBottom: insets.bottom + 40 }}>
          {podcasts.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🎧</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Your playlist is empty</Text>
              <Text style={[styles.emptySub, { color: colors.textMuted }]}>Add YouTube or Spotify podcasts</Text>
              <PrimaryButton title="Add Podcast" onPress={() => setModal(true)} />
            </View>
          ) : (
            <GlassCard style={{ backgroundColor: colors.glass, borderColor: colors.border, padding: 0, overflow: 'hidden' }}>
              {podcasts.map((p, i) => (
                <Pressable
                  key={p.id}
                  style={[styles.playlistItem, i > 0 && { borderTopWidth: 1, borderTopColor: colors.borderLight }]}
                  onPress={() => setPlaying(p)}
                >
                  <Text style={[styles.trackNum, { color: colors.textDim }]}>{i + 1}</Text>
                  <View style={[styles.platformIcon, { backgroundColor: p.platform === 'spotify' ? '#1DB95422' : '#FF000022' }]}>
                    <MaterialIcons name={p.platform === 'spotify' ? 'music-note' : 'play-circle-outline'} size={22} color={p.platform === 'spotify' ? '#1DB954' : '#FF0000'} />
                  </View>
                  <View style={styles.trackInfo}>
                    <Text style={[styles.trackTitle, { color: colors.text }]} numberOfLines={1}>{p.title}</Text>
                    <Text style={[styles.trackHost, { color: colors.textMuted }]} numberOfLines={1}>{p.host ?? p.platform}</Text>
                  </View>
                  <Pressable onPress={() => updatePodcast(p.id, { completed: !p.completed })} hitSlop={8}>
                    <MaterialIcons name={p.completed ? 'check-circle' : 'radio-button-unchecked'} size={22} color={p.completed ? colors.success : colors.textDim} />
                  </Pressable>
                  <Pressable onPress={() => Alert.alert('Delete', 'Remove this podcast?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => removePodcast(p.id) },
                  ])} hitSlop={8}>
                    <MaterialIcons name="more-vert" size={20} color={colors.textDim} />
                  </Pressable>
                </Pressable>
              ))}
            </GlassCard>
          )}
        </ScrollView>
      )}

      <Modal visible={!!playing} animationType="slide" onRequestClose={() => setPlaying(null)}>
        <View style={[styles.playerRoot, { backgroundColor: colors.background, paddingTop: insets.top }]}>
          <View style={styles.playerHeader}>
            <Pressable onPress={() => setPlaying(null)}><MaterialIcons name="keyboard-arrow-down" size={32} color={colors.text} /></Pressable>
            <Text style={[styles.playerTitle, { color: colors.text }]} numberOfLines={1}>{playing?.title}</Text>
            <View style={{ width: 32 }} />
          </View>
          {embedUrl ? (
            <WebView source={{ uri: embedUrl }} style={{ flex: 1, width }} allowsFullscreenVideo />
          ) : (
            <View style={styles.noEmbed}><Text style={[styles.noEmbedText, { color: colors.textMuted }]}>No playable URL</Text></View>
          )}
        </View>
      </Modal>

      <Modal visible={modal} transparent animationType="slide" onRequestClose={() => setModal(false)}>
        <KeyboardAvoidingView style={[styles.overlay, { backgroundColor: colors.overlay }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setModal(false)} />
          <View style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 16 }]}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>Add Podcast</Text>
            <AppInput label="Title *" value={title} onChangeText={setTitle} placeholder="Episode title" />
            <AppInput label="Host" value={host} onChangeText={setHost} placeholder="Podcast host" />
            <AppInput label="URL (YouTube / Spotify)" value={url} onChangeText={setUrl} placeholder="https://..." keyboardType="url" autoCapitalize="none" />
            <AppInput label="Duration (minutes)" value={duration} onChangeText={setDuration} keyboardType="number-pad" placeholder="45" />
            <PrimaryButton title="Add to Playlist" onPress={handleSave} loading={saving} style={{ marginTop: Spacing.md }} />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  addBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingTop: 60, gap: Spacing.sm },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.xl, fontWeight: '700' },
  emptySub: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.base, marginBottom: Spacing.md },
  playlistItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.sm },
  trackNum: { width: 24, fontFamily: Typography.fontFamily, fontSize: Typography.sizes.sm, textAlign: 'center' },
  platformIcon: { width: 40, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  trackInfo: { flex: 1 },
  trackTitle: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.base, fontWeight: '600' },
  trackHost: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.sm },
  playerRoot: { flex: 1 },
  playerHeader: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base, gap: Spacing.sm },
  playerTitle: { flex: 1, fontFamily: Typography.fontFamily, fontSize: Typography.sizes.lg, fontWeight: '600', textAlign: 'center' },
  noEmbed: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  noEmbedText: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.base },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, padding: Spacing.xl },
  sheetTitle: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.xl, fontWeight: '700', marginBottom: Spacing.lg },
});
