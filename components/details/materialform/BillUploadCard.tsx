import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { toast } from 'sonner-native';
import BillViewerModal from '@/components/common/BillViewerModal';
import {
  BillImage,
  BillSource,
  pickBillImage,
  recoverPendingBillImage,
  uploadBillImage,
} from '@/utils/billUpload';

interface BillUploadCardProps {
  bills: BillImage[];
  onBillsChange: (bills: BillImage[]) => void;
  /** Blocks the submit button while a photo is still uploading. */
  onUploadingChange?: (uploading: boolean) => void;
  /**
   * Fired just before the camera/gallery opens. The form uses it to snapshot
   * itself, because Android can destroy the app while the picker is in front.
   */
  onBeforeCapture?: () => void | Promise<void>;
}

// A purchase rarely has more than a couple of bill pages; the cap keeps the
// payload small and the thumbnail strip readable.
const MAX_BILLS = 5;

/**
 * "Upload Bill" control on the payment step of the Add Material form. The user
 * photographs the vendor bill (or picks an existing photo), it uploads right
 * away, and the resulting URL rides along with the material batch so the admin
 * can open the bill from the notification feed.
 */
const BillUploadCard: React.FC<BillUploadCardProps> = ({
  bills,
  onBillsChange,
  onUploadingChange,
  onBeforeCapture,
}) => {
  const [uploading, setUploading] = useState(false);
  const [showSourceSheet, setShowSourceSheet] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  // The recovery effect below runs after an app restart, so it must read the
  // list as it is *then*, not as it was when the effect was created.
  const billsRef = useRef(bills);
  useEffect(() => {
    billsRef.current = bills;
  }, [bills]);

  const setBusy = (busy: boolean) => {
    setUploading(busy);
    onUploadingChange?.(busy);
  };

  const attachUploaded = async (uri: string) => {
    setBusy(true);
    try {
      const uploaded = await uploadBillImage(uri);
      onBillsChange([...billsRef.current, uploaded]);
      return uploaded;
    } finally {
      setBusy(false);
    }
  };

  // If Android killed the app while the camera was open, the photo is waiting
  // in the picker module rather than in a resolved promise — claim it here so
  // the user doesn't have to photograph the bill a second time.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const pending = await recoverPendingBillImage();
      if (!pending || cancelled) return;
      if (billsRef.current.length >= MAX_BILLS) return;

      try {
        await attachUploaded(pending.uri);
        if (!cancelled) toast.success('Recovered your bill photo');
      } catch (error) {
        console.error('❌ Pending bill recovery failed:', error);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePick = async (source: BillSource) => {
    setShowSourceSheet(false);

    if (bills.length >= MAX_BILLS) {
      Alert.alert('Limit Reached', `You can attach up to ${MAX_BILLS} bill photos.`);
      return;
    }

    try {
      // Snapshot the form first: from here until the picker returns, Android is
      // free to tear the app down to make room for the camera.
      await onBeforeCapture?.();

      const picked = await pickBillImage(source);
      if (!picked) return; // user cancelled

      await attachUploaded(picked.uri);
      toast.success('Bill uploaded');
    } catch (error: any) {
      console.error('❌ Bill upload error:', error);
      Alert.alert(
        'Upload Failed',
        error?.response?.data?.message ||
          error?.message ||
          'Could not upload the bill. Please check your connection and try again.'
      );
    }
  };

  const handleRemove = (index: number) => {
    Alert.alert('Remove Bill?', 'This bill photo will not be attached to the material.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => onBillsChange(bills.filter((_, i) => i !== index)),
      },
    ]);
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>Bill / Receipt</Text>
        <Text style={styles.optional}>Optional</Text>
      </View>

      {/* Thumbnail strip of already-uploaded bills */}
      {bills.length > 0 && (
        <View style={styles.thumbRow}>
          {bills.map((bill, index) => (
            <View key={bill.url} style={styles.thumbWrap}>
              <TouchableOpacity
                onPress={() => setViewerIndex(index)}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: bill.localUri || bill.url }}
                  style={styles.thumb}
                  resizeMode="cover"
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => handleRemove(index)}
                hitSlop={8}
              >
                <Ionicons name="close" size={12} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Upload button */}
      <TouchableOpacity
        style={[styles.uploadBtn, uploading && styles.uploadBtnDisabled]}
        onPress={() => setShowSourceSheet(true)}
        activeOpacity={0.8}
        disabled={uploading || bills.length >= MAX_BILLS}
      >
        {uploading ? (
          <>
            <ActivityIndicator size="small" color="#3A78B5" />
            <Text style={styles.uploadBtnText}>Uploading bill…</Text>
          </>
        ) : (
          <>
            <Ionicons name="camera-outline" size={18} color="#3A78B5" />
            <Text style={styles.uploadBtnText}>
              {bills.length === 0 ? 'Upload Bill' : 'Add Another Bill'}
            </Text>
          </>
        )}
      </TouchableOpacity>

      <Text style={styles.hint}>
        {bills.length > 0
          ? `${bills.length} bill photo${bills.length > 1 ? 's' : ''} attached — the admin can view ${bills.length > 1 ? 'them' : 'it'} in notifications.`
          : 'Take a photo of the vendor bill so the admin can verify this payment.'}
      </Text>

      {/* Source picker */}
      <Modal
        visible={showSourceSheet}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSourceSheet(false)}
      >
        <TouchableOpacity
          style={styles.sheetBackdrop}
          activeOpacity={1}
          onPress={() => setShowSourceSheet(false)}
        >
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Add Bill Photo</Text>

            <TouchableOpacity
              style={styles.sheetOption}
              onPress={() => handlePick('camera')}
              activeOpacity={0.7}
            >
              <View style={[styles.sheetIcon, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="camera" size={20} color="#3A78B5" />
              </View>
              <View style={styles.sheetTextWrap}>
                <Text style={styles.sheetOptionLabel}>Take Photo</Text>
                <Text style={styles.sheetOptionDesc}>Photograph the bill now</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetOption}
              onPress={() => handlePick('library')}
              activeOpacity={0.7}
            >
              <View style={[styles.sheetIcon, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="images" size={20} color="#10B981" />
              </View>
              <View style={styles.sheetTextWrap}>
                <Text style={styles.sheetOptionLabel}>Choose from Gallery</Text>
                <Text style={styles.sheetOptionDesc}>Pick an existing bill photo</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetCancel}
              onPress={() => setShowSourceSheet(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <BillViewerModal
        visible={viewerIndex !== null}
        images={bills.map((b) => b.localUri || b.url)}
        initialIndex={viewerIndex ?? 0}
        onClose={() => setViewerIndex(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  optional: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  thumbRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  thumbWrap: {
    position: 'relative',
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F1F5F9',
  },
  removeBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#3A78B5',
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 13,
    backgroundColor: '#F8FAFF',
  },
  uploadBtnDisabled: {
    opacity: 0.7,
  },
  uploadBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3A78B5',
  },
  hint: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 16,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 34,
    gap: 10,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
  },
  sheetIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetTextWrap: {
    flex: 1,
  },
  sheetOptionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  sheetOptionDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  sheetCancel: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 2,
  },
  sheetCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
});

export default BillUploadCard;
