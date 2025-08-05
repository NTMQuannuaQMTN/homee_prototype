// Utility to save a base64 image to the device's gallery using expo-file-system and expo-media-library
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

export async function saveBase64ToGallery(base64Data: string, filename = 'qr-card.png') {
  // Create a file URI
  const fileUri = FileSystem.cacheDirectory + filename;
  // Write the base64 image to the file
  await FileSystem.writeAsStringAsync(fileUri, base64Data, { encoding: FileSystem.EncodingType.Base64 });
  // Request permissions
  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== 'granted') throw new Error('Permission to access media library is required!');
  // Save to gallery
  const asset = await MediaLibrary.createAssetAsync(fileUri);
  await MediaLibrary.createAlbumAsync('Download', asset, false);
  return asset;
}
