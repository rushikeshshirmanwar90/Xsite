import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Skeleton } from 'moti/skeleton';
import { SKELETON_COLORS } from '@/components/common/skeletonTheme';
import { Colors } from '@/constants/theme';

// Placeholder mirroring ProjectCard's layout (title + status, people line,
// budget figure and bar, footer action) so the home screen doesn't jump once
// real project data arrives.
const ProjectCardSkeleton: React.FC = () => {
  return (
    <View style={styles.cardShadowWrap}>
      <View style={styles.card}>
        <Skeleton.Group show>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Skeleton colors={SKELETON_COLORS} width="65%" height={18} />
              <View style={{ height: 8 }} />
              <Skeleton colors={SKELETON_COLORS} width="40%" height={12} />
            </View>
            <Skeleton colors={SKELETON_COLORS} width={92} height={26} radius={13} />
          </View>

          <View style={{ height: 16 }} />
          <Skeleton colors={SKELETON_COLORS} width="55%" height={13} />

          <View style={styles.budget}>
            <View style={styles.budgetTopRow}>
              <Skeleton colors={SKELETON_COLORS} width="50%" height={22} />
              <Skeleton colors={SKELETON_COLORS} width={44} height={14} />
            </View>
            <Skeleton colors={SKELETON_COLORS} width="100%" height={6} radius={3} />
            <View style={{ height: 10 }} />
            <Skeleton colors={SKELETON_COLORS} width="35%" height={11} />
          </View>

          <View style={styles.footer}>
            <Skeleton colors={SKELETON_COLORS} width={96} height={14} />
          </View>
        </Skeleton.Group>
      </View>
    </View>
  );
};

export const ProjectListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <ProjectCardSkeleton key={i} />
    ))}
  </>
);

const styles = StyleSheet.create({
  cardShadowWrap: {
    borderRadius: 20,
    backgroundColor: Colors.surface,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: '#E8EDF4',
    paddingTop: 18,
    paddingHorizontal: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  budget: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  budgetTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  footer: {
    justifyContent: 'center',
    minHeight: 52,
    marginTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
});

export default ProjectCardSkeleton;
