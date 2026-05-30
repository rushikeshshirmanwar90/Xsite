import React from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OtherCost } from '@/types/otherCost';

interface Props {
  cost: OtherCost;
  animation?: Animated.Value;
}

const OtherCostCard: React.FC<Props> = ({ cost, animation }) => {
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const cardStyle = animation
    ? {
        opacity: animation,
        transform: [
          {
            translateY: animation.interpolate({
              inputRange: [0, 1],
              outputRange: [16, 0],
            }),
          },
        ],
      }
    : {};

  return (
    <Animated.View style={[styles.card, cardStyle]}>
      {/* Icon */}
      <View style={styles.iconBox}>
        <Ionicons name="receipt-outline" size={22} color="#6366F1" />
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {cost.name ?? cost.title ?? '—'}
        </Text>
        {cost.category ? (
          <Text style={[styles.description, { color: '#6366F1', fontWeight: '600', fontSize: 11, marginBottom: 2 }]}>
            {cost.category}
          </Text>
        ) : null}
        {cost.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {cost.description}
          </Text>
        ) : null}
      </View>

      {/* Right — amount + date */}
      <View style={styles.right}>
        <Text style={styles.amount}>
          ₹{(cost.totalCost ?? cost.amount ?? 0).toLocaleString('en-IN')}
        </Text>
        <Text style={styles.date}>{formatDate(cost.date)}</Text>
      </View>
    </Animated.View>
  );
};

export default OtherCostCard;

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 3,
  },
  description: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
  },
  right: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  amount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
  },
  date: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
});
