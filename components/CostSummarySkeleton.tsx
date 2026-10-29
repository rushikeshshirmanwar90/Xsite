import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Skeleton } from 'moti/skeleton';
import { SKELETON_COLORS } from '@/components/common/skeletonTheme';
import { Colors } from '@/constants/theme';

// Placeholder mirroring the Cost Summary screen block for block, so nothing
// jumps when the figures arrive: the "Total Spent" card (label, amount, budget
// line, spending bar, status row), the Breakdown heading, then four category
// rows (icon tile, label and count, amount).
const CostSummarySkeleton: React.FC = () => {
  return (
    <View accessible accessibilityLabel="Loading cost summary">
      <Skeleton.Group show>
        <View style={styles.heroCard}>
          <Skeleton colors={SKELETON_COLORS} width={90} height={14} />
          <View style={{ height: 10 }} />
          <Skeleton colors={SKELETON_COLORS} width={190} height={34} radius={8} />
          <View style={{ height: 8 }} />
          <Skeleton colors={SKELETON_COLORS} width={150} height={15} />
          <View style={{ height: 18 }} />
          <Skeleton colors={SKELETON_COLORS} width="100%" height={12} radius={6} />
          <View style={styles.statusRow}>
            <Skeleton colors={SKELETON_COLORS} width={80} height={13} />
            <Skeleton colors={SKELETON_COLORS} width={100} height={13} />
          </View>
        </View>

        <View style={styles.heading}>
          <Skeleton colors={SKELETON_COLORS} width={110} height={20} />
        </View>

        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={styles.card}>
            <Skeleton colors={SKELETON_COLORS} radius={12} width={42} height={42} />
            <View style={styles.info}>
              <Skeleton colors={SKELETON_COLORS} width="55%" height={17} />
              <View style={{ height: 6 }} />
              <Skeleton colors={SKELETON_COLORS} width="40%" height={13} />
            </View>
            <Skeleton colors={SKELETON_COLORS} width={76} height={17} />
          </View>
        ))}
      </Skeleton.Group>
    </View>
  );
};

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  heading: {
    marginTop: 8,
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 72,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  info: {
    flex: 1,
  },
});

export default CostSummarySkeleton;
