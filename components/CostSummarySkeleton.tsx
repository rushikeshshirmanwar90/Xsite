import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Skeleton } from 'moti/skeleton';
import { SKELETON_COLORS } from '@/components/common/skeletonTheme';

const THEME_COLOR = '#3A78B5';

// Placeholder mirroring the Cost Summary screen: the solid-color grand-total
// card (static translucent blocks — a shimmer looks wrong on a brand-color
// background) followed by category cards (icon + label/count + amount, action
// row) that do shimmer.
const CostSummarySkeleton: React.FC = () => {
  return (
    <View>
      <View style={styles.totalCard}>
        <View style={styles.totalIconWrap} />
        <View style={styles.totalLabelBar} />
        <View style={styles.totalAmountBar} />
      </View>

      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={styles.card}>
          <View style={styles.headerRow}>
            <Skeleton.Group show>
              <Skeleton colors={SKELETON_COLORS} radius={12} width={44} height={44} />
              <View style={styles.info}>
                <Skeleton colors={SKELETON_COLORS} width="50%" height={15} />
                <View style={{ height: 6 }} />
                <Skeleton colors={SKELETON_COLORS} width="30%" height={11} />
              </View>
              <Skeleton colors={SKELETON_COLORS} width={70} height={16} />
            </Skeleton.Group>
          </View>
          <View style={styles.actionsRow}>
            <View style={{ flex: 1 }}>
              <Skeleton colors={SKELETON_COLORS} width="100%" height={32} radius={10} />
            </View>
            <View style={{ flex: 1 }}>
              <Skeleton colors={SKELETON_COLORS} width="100%" height={32} radius={10} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  totalCard: {
    backgroundColor: THEME_COLOR,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  totalIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginBottom: 10,
  },
  totalLabelBar: {
    width: 120,
    height: 11,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginBottom: 10,
  },
  totalAmountBar: {
    width: 160,
    height: 26,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  info: {
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
});

export default CostSummarySkeleton;
