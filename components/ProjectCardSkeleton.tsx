import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Skeleton } from 'moti/skeleton';
import { SKELETON_COLORS } from '@/components/common/skeletonTheme';

// Placeholder mirroring ProjectCard's layout (accent bar, two icon+text rows,
// budget progress panel, CTA button) so the home screen doesn't jump once
// real project data arrives.
const ProjectCardSkeleton: React.FC = () => {
  return (
    <View style={styles.cardShadowWrap}>
      <View style={styles.card}>
        <View style={styles.topAccentBar} />
        <View style={styles.cardInner}>
          <Skeleton.Group show>
            {[0, 1].map((i) => (
              <View key={i} style={styles.row}>
                <Skeleton colors={SKELETON_COLORS} radius={10} width={32} height={32} />
                <View style={styles.rowTextBlock}>
                  <Skeleton colors={SKELETON_COLORS} width="70%" height={14} />
                  <View style={{ height: 6 }} />
                  <Skeleton colors={SKELETON_COLORS} width="45%" height={11} />
                </View>
              </View>
            ))}

            <View style={styles.progressPanel}>
              <Skeleton colors={SKELETON_COLORS} width={110} height={11} />
              <View style={{ height: 10 }} />
              <Skeleton colors={SKELETON_COLORS} width="60%" height={15} />
              <View style={{ height: 8 }} />
              <Skeleton colors={SKELETON_COLORS} width="100%" height={8} radius={4} />
            </View>

            <Skeleton colors={SKELETON_COLORS} width="100%" height={46} radius={14} />
          </Skeleton.Group>
        </View>
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
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 22,
    elevation: 8,
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEF2F8',
  },
  topAccentBar: {
    height: 4,
    width: '100%',
    backgroundColor: '#EEF2F8',
  },
  cardInner: {
    padding: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  rowTextBlock: {
    flex: 1,
  },
  progressPanel: {
    marginBottom: 16,
  },
});

export default ProjectCardSkeleton;
