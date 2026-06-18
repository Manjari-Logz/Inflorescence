import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { getSupabaseClient } from '@/template';

export async function pickDocument(types: string[] = ['application/pdf', 'image/*']) {
  const result = await DocumentPicker.getDocumentAsync({ type: types, copyToCacheDirectory: true });
  if (result.canceled || !result.assets?.[0]) return null;
  return result.assets[0];
}

export async function pickImage() {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.85,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  return result.assets[0];
}

export async function uploadFile(
  userId: string,
  folder: string,
  uri: string,
  fileName: string,
  mimeType?: string,
): Promise<string | null> {
  try {
    const client = getSupabaseClient();
    const ext = fileName.split('.').pop() ?? 'bin';
    const path = `${userId}/${folder}/${Date.now()}.${ext}`;
    const response = await fetch(uri);
    const blob = await response.blob();
    const { error } = await client.storage.from('inflorescence').upload(path, blob, {
      contentType: mimeType ?? blob.type,
      upsert: true,
    });
    if (error) return uri;
    const { data } = client.storage.from('inflorescence').getPublicUrl(path);
    return data.publicUrl;
  } catch {
    return uri;
  }
}
