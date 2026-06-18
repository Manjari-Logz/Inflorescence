import React from 'react';
import { View, Text, Modal, Pressable, StyleSheet, Linking, ScrollView } from 'react-native';
import { WebView } from 'react-native-webview';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Typography, Spacing, Radius } from '@/constants/theme';

interface ResourceViewerProps {
  visible: boolean;
  onClose: () => void;
  type: string;
  title: string;
  url?: string;
}

function getYouTubeEmbed(url: string): string | null {
  const match = url.match(/(?:v=|youtu\.be\/)([\w-]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=0` : null;
}

export function ResourceViewer({ visible, onClose, type, title, url }: ResourceViewerProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

  const renderContent = () => {
    if (!url) {
      return (
        <View style={styles.center}>
          <MaterialIcons name="link-off" size={48} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>No URL provided for this resource</Text>
        </View>
      );
    }

    if (type === 'YouTube') {
      const embed = getYouTubeEmbed(url);
      if (embed) {
        return <WebView source={{ uri: embed }} style={styles.webview} allowsFullscreenVideo mediaPlaybackRequiresUserAction={false} />;
      }
    }

    if (type === 'PDF') {
      const pdfViewer = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`;
      return <WebView source={{ uri: pdfViewer }} style={styles.webview} />;
    }

    if (type === 'Notes' || type === 'Image') {
      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url) || url.startsWith('file://');
      if (isImage) {
        return (
          <ScrollView contentContainerStyle={styles.imageScroll}>
            <Image source={{ uri: url }} style={styles.image} contentFit="contain" />
          </ScrollView>
        );
      }
    }

    if (url.startsWith('http')) {
      return <WebView source={{ uri: url }} style={styles.webview} />;
    }

    return (
      <View style={styles.center}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{url}</Text>
        <Pressable onPress={() => Linking.openURL(url)} style={[styles.openBtn, { backgroundColor: colors.primary }]}>
          <Text style={styles.openBtnText}>Open Link</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={[styles.toolbar, { borderBottomColor: colors.border }]}>
          <Pressable onPress={onClose} hitSlop={12}>
            <MaterialIcons name="close" size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.toolbarTitle, { color: colors.text }]} numberOfLines={1}>{title}</Text>
          {url ? (
            <Pressable onPress={() => Linking.openURL(url)} hitSlop={12}>
              <MaterialIcons name="open-in-new" size={22} color={colors.accent} />
            </Pressable>
          ) : <View style={{ width: 22 }} />}
        </View>
        {renderContent()}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  toolbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, borderBottomWidth: 1, gap: Spacing.md },
  toolbarTitle: { flex: 1, fontFamily: Typography.fontFamily, fontSize: Typography.sizes.lg, fontWeight: '600', textAlign: 'center' },
  webview: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl, gap: Spacing.md },
  emptyText: { fontFamily: Typography.fontFamily, fontSize: Typography.sizes.base, textAlign: 'center' },
  openBtn: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: Radius.md },
  openBtnText: { color: '#fff', fontFamily: Typography.fontFamily, fontWeight: '600' },
  imageScroll: { flexGrow: 1, justifyContent: 'center', padding: Spacing.base },
  image: { width: '100%', height: 500 },
});
