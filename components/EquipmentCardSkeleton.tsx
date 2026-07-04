import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Skeleton } from 'moti/skeleton';
import { SKELETON_COLORS } from '@/components/common/skeletonTheme';

// Placeholder mirroring EquipmentCard's layout (icon + name/category header,
// detail rows, footer status badge + date) shown while the equipment list loads.
const EquipmentCardSkeleton: React.FC = () => {
  return (
    <View style={styles.card}>
      <Skeleton.Group show>
        <View style={styles.header}>
          <Skeleton colors={SKELETON_COLORS} radius={12} width={48} height={48} />
          <View style={styles.info}>
            <Skeleton colors={SKELETON_COLORS} width="55%" height={16} />
            <View style={{ height: 6 }} />
            <Skeleton colors={SKELETON_COLORS} width="35%" height={12} />
          </View>
        </View>

        <View style={styles.details}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={styles.detailRow}>
              <Skeleton colors={SKELETON_COLORS} width={80} height={12} />
              <Skeleton colors={SKELETON_COLORS} width={60} height={13} />
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Skeleton colors={SKELETON_COLORS} width={60} height={20} radius={6} />
          <Skeleton colors={SKELETON_COLORS} width={70} height={11} />
        </View>
      </Skeleton.Group>
    </View>
  );
};

export const EquipmentListSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <EquipmentCardSkeleton key={i} />
    ))}
  </>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  details: {
    gap: 8,
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
});

export default EquipmentCardSkeleton;
