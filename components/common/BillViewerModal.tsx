import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface BillViewerModalProps {
  visible: boolean;
  /** Bill image URLs (or local file URIs) to page through. */
  images: string[];
  /** Which image to open on. */
  initialIndex?: number;
  onClose: () => void;
}

/**
 * Full-screen, swipeable viewer for vendor bill photos. Shared by the Add
 * Material payment step (reviewing what was just captured) and the notification
 * feed (admin inspecting a bill a site user uploaded).
 */
const BillViewerModal: React.FC<BillViewerModalProps> = ({
  visible,
  images,
  initialIndex = 0,
  onClose,
}) => {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  // Per-image load state so a slow CDN fetch shows a spinner instead of a blank screen
  const [loadedUris, setLoadedUris] = useState<Record<string, boolean>>({});
  const [failedUris, setFailedUris] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (visible) setActiveIndex(initialIndex);
  }, [visible, initialIndex]);

  if (!images.length) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleWrap}>
            <Ionicons name="receipt-outline" size={18} color="#FFFFFF" />
            <Text style={styles.headerTitle}>
              Bill{images.length > 1 ? ` ${activeIndex + 1} of ${images.length}` : ''}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={10}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={images}
          horizontal
          pagingEnabled
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          keyExtractor={(uri, index) => `${uri}-${index}`}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) =>
            setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH))
          }
          renderItem={({ item }) => (
            <View style={styles.page}>
              {failedUris[item] ? (
                <View style={styles.stateBox}>
                  <Ionicons name="alert-circle-outline" size={40} color="#94A3B8" />
                  <Text style={styles.stateText}>This bill image could not be loaded</Text>
                </View>
              ) : (
                <>
                  <Image
                    source={{ uri: item }}
                    style={styles.image}
                    resizeMode="contain"
                    onLoadEnd={() => setLoadedUris((p) => ({ ...p, [item]: true }))}
                    onError={() => setFailedUris((p) => ({ ...p, [item]: true }))}
                  />
                  {!loadedUris[item] && (
                    <View style={styles.loaderOverlay} pointerEvents="none">
                      <ActivityIndicator size="large" color="#FFFFFF" />
                    </View>
                  )}
                </>
              )}
            </View>
          )}
        />

        {/* Page dots */}
        {images.length > 1 && (
          <View style={styles.dots}>
            {images.map((uri, index) => (
              <View
                key={`${uri}-dot-${index}`}
                style={[styles.dot, index === activeIndex && styles.dotActive]}
              />
            ))}
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.94)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 12,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.14)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  page: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT - 170,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stateBox: {
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 40,
  },
  stateText: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 20,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
    width: 20,
  },
});

export default BillViewerModal;
