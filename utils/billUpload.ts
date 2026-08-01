import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import apiClient from './axiosConfig';

/**
 * Vendor bill photo capture + upload for the Add Material payment step.
 *
 * The image is compressed on-device before it leaves the phone (site photos from
 * a modern camera are 3–8 MB, which is far more resolution than a readable bill
 * needs), then proxied through `/api/material/bill-upload` so the storage config
 * and auth stay server-side.
 *
 * ── Why this file is so careful about memory ──────────────────────────────────
 * While the system camera is in the foreground Xsite is a *backgrounded* app, so
 * Android is free to destroy MainActivity to reclaim memory. When that happens
 * the JS bundle reloads on return and the user sees the app "restart" with their
 * half-filled material form gone. Three things make that far less likely:
 *   1. capture at a modest quality and skip the extra crop activity,
 *   2. never hold the photo in memory as base64 (upload streams the file),
 *   3. `recoverPendingBillImage()` picks the photo back up if it happens anyway.
 */

export interface BillImage {
  url: string;
  publicId?: string;
  uploadedAt?: string;
  /** Local file URI, kept only so the thumbnail can render instantly on-device. */
  localUri?: string;
}

export type BillSource = 'camera' | 'library';

// Bills are text-heavy, so width matters more than colour fidelity. 1600px keeps
// printed line items legible when the admin zooms in, at ~300–600 KB per photo.
const MAX_WIDTH = 1600;
const COMPRESSION = 0.7;

// The capture is downscaled to MAX_WIDTH straight after anyway, so asking the
// camera for a full-quality JPEG only buys a bigger file to decode later.
const CAPTURE_QUALITY = 0.6;

/**
 * Opens the camera or the photo library and returns the picked image URI.
 * Returns null when the user cancels or denies camera access.
 *
 * NOTE: the library path deliberately uses the system photo picker, which needs
 * no media-library permission — Xsite must not request READ_MEDIA_IMAGES (those
 * permissions are blocked in app.json for Play Store policy reasons).
 */
export const pickBillImage = async (
  source: BillSource
): Promise<{ uri: string } | null> => {
  // `allowsEditing` is off on purpose: on Android the crop UI is a *second*
  // activity stacked on top of the camera, which both doubles the time Xsite
  // spends in the background and keeps another full bitmap alive. Bills are
  // photographed whole, so the crop step wasn't earning its cost.
  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      throw new Error(
        'Camera access is needed to photograph the bill. Please enable it in Settings.'
      );
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: CAPTURE_QUALITY,
      exif: false,
    });

    if (result.canceled || !result.assets?.[0]) return null;
    return { uri: result.assets[0].uri };
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: false,
    quality: CAPTURE_QUALITY,
    exif: false,
    allowsMultipleSelection: false,
  });

  if (result.canceled || !result.assets?.[0]) return null;
  return { uri: result.assets[0].uri };
};

/**
 * Android only. If the OS destroyed MainActivity while the camera was open, the
 * photo the user took never reached `launchCameraAsync`'s promise — it is held
 * by the picker module instead. Call this once the UI is back to claim it.
 * Resolves to null on iOS, and whenever there is nothing pending.
 */
export const recoverPendingBillImage = async (): Promise<{ uri: string } | null> => {
  if (Platform.OS !== 'android') return null;

  try {
    const pending = await ImagePicker.getPendingResultAsync();
    if (!pending || !('assets' in pending)) return null;
    if (pending.canceled || !pending.assets?.[0]?.uri) return null;
    return { uri: pending.assets[0].uri };
  } catch (error) {
    // A missing/expired pending result must never block the form.
    console.log('ℹ️ No pending bill photo to recover:', error);
    return null;
  }
};

/**
 * Compresses the picked photo and uploads it, returning the hosted bill record
 * that gets attached to the material batch.
 */
export const uploadBillImage = async (uri: string): Promise<BillImage> => {
  const processed = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: MAX_WIDTH } }],
    {
      compress: COMPRESSION,
      format: ImageManipulator.SaveFormat.JPEG,
    }
  );

  // Multipart rather than a base64 data URI: base64 inflates the photo by ~33%
  // and keeps the whole thing in the JS heap (twice, once axios serialises the
  // body), which is exactly the memory spike that gets the app killed. With
  // FormData the native networking layer streams the file straight off disk.
  const form = new FormData();
  form.append('file', {
    uri: processed.uri,
    name: `bill-${Date.now()}.jpg`,
    type: 'image/jpeg',
  } as any);

  const res = await apiClient.post('/api/material/bill-upload', form, {
    // Must be set explicitly — the shared client defaults to JSON, and in React
    // Native axios does not strip that for FormData the way it does on web.
    headers: { 'Content-Type': 'multipart/form-data' },
    // Uploads are far slower than the JSON calls the shared client is tuned for.
    timeout: 60000,
  });

  const data = (res.data as any)?.data;
  if (!data?.url) {
    throw new Error((res.data as any)?.message || 'Bill upload failed. Please try again.');
  }

  return {
    url: data.url,
    publicId: data.publicId,
    uploadedAt: data.uploadedAt,
    localUri: processed.uri,
  };
};

/** Strips the device-only fields before the bill is sent to the material API. */
export const toBillPayload = (bills: BillImage[]) =>
  bills.map(({ url, publicId, uploadedAt }) => ({
    url,
    ...(publicId ? { publicId } : {}),
    ...(uploadedAt ? { uploadedAt } : {}),
  }));
