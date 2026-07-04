import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Skeleton } from 'moti/skeleton';
import { SKELETON_COLORS } from './skeletonTheme';
import { IconRowCardListSkeleton } from './IconRowCardSkeleton';

// Pie-chart card placeholder (heading + circle + legend rows) — used standalone
// on chart-only screens (e.g. the main Analysis Dashboard) and as part of the
// fuller AnalyticsDashboardSkeleton below.
export const ChartCardSkeleton: React.FC = () => (
  <View style={styles.chartCard}>
    <Skeleton.Group show>
      <Skeleton colors={SKELETON_COLORS} width={180} height={18} />
      <View style={{ height: 8 }} />
      <Skeleton colors={SKELETON_COLORS} width={120} height={11} />
      <View style={styles.chartCircleWrap}>
        <Skeleton colors={SKELETON_COLORS} radius="round" width={200} height={200} />
      </View>
      {[0, 1, 2].map((i) => (
        <View key={i} style={styles.legendRow}>
          <Skeleton colors={SKELETON_COLORS} radius="round" width={10} height={10} />
          <Skeleton colors={SKELETON_COLORS} width="60%" height={12} />
          <Skeleton colors={SKELETON_COLORS} width={36} height={12} />
        </View>
      ))}
    </Skeleton.Group>
  </View>
);

// Full-page placeholder for the analytics breakdown screens (equipment, labor,
// mini-sections, other-cost, project-sections): total-expense card, two stat
// tiles, a pie-chart card, and a breakdown list below it.
const AnalyticsDashboardSkeleton: React.FC<{ listCount?: number }> = ({ listCount = 3 }) => {
  return (
    <View>
      {/* Total expense card */}
      <View style={styles.totalCard}>
        <Skeleton.Group show>
          <Skeleton colors={SKELETON_COLORS} radius={16} width={64} height={64} />
          <View style={styles.totalInfo}>
            <Skeleton colors={SKELETON_COLORS} width={90} height={11} />
            <View style={{ height: 8 }} />
            <Skeleton colors={SKELETON_COLORS} width={140} height={26} />
            <View style={{ height: 6 }} />
            <Skeleton colors={SKELETON_COLORS} width={110} height={11} />
          </View>
        </Skeleton.Group>
      </View>

      {/* Stat tiles */}
      <View style={styles.statsRow}>
        {[0, 1].map((i) => (
          <View key={i} style={styles.statCard}>
            <Skeleton.Group show>
              <Skeleton colors={SKELETON_COLORS} radius={8} width={36} height={36} />
              <View style={styles.statInfo}>
                <Skeleton colors={SKELETON_COLORS} width={70} height={10} />
                <View style={{ height: 6 }} />
                <Skeleton colors={SKELETON_COLORS} width={50} height={15} />
              </View>
            </Skeleton.Group>
          </View>
        ))}
      </View>

      <ChartCardSkeleton />

      {/* Breakdown list */}
      <View style={{ paddingHorizontal: 20 }}>
        <IconRowCardListSkeleton count={listCount} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  totalCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 16,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalInfo: {
    flex: 1,
    marginLeft: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  statInfo: {
    flex: 1,
    marginLeft: 12,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  chartCircleWrap: {
    marginVertical: 20,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    alignSelf: 'stretch',
    marginBottom: 10,
  },
});

export default AnalyticsDashboardSkeleton;
