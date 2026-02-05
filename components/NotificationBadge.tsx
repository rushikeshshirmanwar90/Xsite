import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNotifications } from '../hooks/useNotifications';

interface NotificationBadgeProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  textColor?: string;
  showZero?: boolean;
  maxCount?: number;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  size = 'medium',
  color = '#EF4444',
  textColor = '#FFFFFF',
  showZero = false,
  maxCount = 99,
}) => {
  const { unreadCount } = useNotifications();

  if (!showZero && unreadCount === 0) {
    return null;
  }

  const displayCount = unreadCount > maxCount ? `${maxCount}+` : unreadCount.toString();

  const sizeStyles = {
    small: styles.small,
    medium: styles.medium,
    large: styles.large,
  };

  const textSizeStyles = {
    small: styles.textSmall,
    medium: styles.textMedium,
    large: styles.textLarge,
  };

  return (
    <View style={[styles.badge, sizeStyles[size], { backgroundColor: color }]}>
      <Text style={[styles.text, textSizeStyles[size], { color: textColor }]}>
        {displayCount}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 20,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  small: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  medium: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
  },
  large: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 8,
  },
  text: {
    fontWeight: '700',
    textAlign: 'center',
  },
  textSmall: {
    fontSize: 10,
  },
  textMedium: {
    fontSize: 12,
  },
  textLarge: {
    fontSize: 14,
  },
});

export default NotificationBadge;